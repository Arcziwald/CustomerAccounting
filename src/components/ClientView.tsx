import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Client, STATUS_COLORS, DocumentStatus, UploadedFile } from '../types';
import { ArrowLeft, Upload, CheckCircle, FileText, Clock, AlertCircle, Hash, Search, FileUp, Send, Plus, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

interface ClientViewProps {
  clients: Client[];
  updateClientStatus: (clientId: string, docId: string, newStatus: DocumentStatus) => void;
  addFileToDocument: (clientId: string, docId: string, file: UploadedFile) => void;
  addActivity: (clientName: string, action: string, description: string) => void;
  finishUploading: (clientId: string) => void;
}

export default function ClientView({ clients, updateClientStatus, addFileToDocument, addActivity, finishUploading }: ClientViewProps) {
  const { id } = useParams();
  const { t } = useTranslation(); // Poprawione umiejscowienie hooka
  const [client, setClient] = useState<Client | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [invoiceInput, setInvoiceInput] = useState('');
  const [missingInvoices, setMissingInvoices] = useState<number[]>([]);
  const [showChecker, setShowChecker] = useState(false);

  useEffect(() => {
    const found = clients.find(c => c.id === id);
    if (found) setClient(found);
  }, [id, clients]);

  const sendToN8nKombajn = async (file: File, docLabel: string) => {
    const formData = new FormData();
    formData.append('data', file);
    formData.append('clientName', client?.name || 'Unknown');
    formData.append('documentType', docLabel);

    try {
      await fetch('https://n8n.srv1151721.hstgr.cloud/webhook-test/abd250c7-8d55-4c9f-b9bb-71b7d1a7207e', {
        method: 'POST',
        body: formData,
      });
    } catch (error) {
      console.error('n8n Error:', error);
    }
  };

  const handleSequenceCheck = (input: string) => {
    setInvoiceInput(input);
    const nums = input.split(/[\s,]+/).map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    
    if (nums.length < 2) {
      setMissingInvoices([]);
      return;
    }

    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const missing: number[] = [];
    for (let i = min; i <= max; i++) {
      if (!nums.includes(i)) {
        missing.push(i);
      }
    }
    
    setMissingInvoices(missing);
    
    if (id && client) {
      client.documents.forEach(doc => {
        if (doc.label.toLowerCase().includes('faktur')) {
          if (missing.length > 0) {
            updateClientStatus(id, doc.id, 'Spóźnione');
          } else if (nums.length > 0) {
            updateClientStatus(id, doc.id, 'OK');
          }
        }
      });
    }
  };

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Client not found</h2>
          <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">{t('client_view.back')}</Link>
        </div>
      </div>
    );
  }

  const handleUpload = async (docId: string, docLabel: string, file: File) => {
    setUploading(docId);
    
    // 1. Wysyłamy do n8n (Kombajn)
    await sendToN8nKombajn(file, docLabel);

    // 2. Aktualizujemy stan lokalny aplikacji
    const fileData: UploadedFile = {
      name: file.name,
      timestamp: new Date().toISOString(),
      rawFile: file 
    };

    if (id && client) {
      addFileToDocument(id, docId, fileData);

      



      setUploading(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {t('client_view.back')}
        </Link>

        <header className="mb-12">
          <div className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold mb-4">
            {t('client_view.client_zone')}
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">{client.name}</h1>
          <p className="text-slate-500 text-lg">
  {t('client_view.month_label')}{' '}
  <span className="font-semibold text-slate-700">
    {/* Dodajemy t() i formatowanie klucza miesiąca */}
    {t(`months.${client.month.toLowerCase().replace(/ /g, '_')}`)}
  </span>
</p>
          
          {client.locked && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 font-semibold"
            >
              <Lock className="w-5 h-5" />
              {t('status.locked_msg', { defaultValue: 'Month approved. Editing locked.' })}
            </motion.div>
          )}
        </header>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            {t('client_view.list_title')}
          </h2>

          <div className="grid gap-4">
            {client.documents.map((doc) => (
              <motion.div 
                key={doc.id}
                layout
                className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
  {/* IKONA I KOLOR TŁA */}
  <div className={`p-3 rounded-2xl ${STATUS_COLORS[doc.status] || 'bg-slate-100 text-slate-600'}`}>
    {doc.status === 'OK' || doc.status === 'Zatwierdzone' ? <CheckCircle className="w-6 h-6" /> : 
     doc.status === 'W toku' ? <Clock className="w-6 h-6" /> :
     doc.status === 'Spóźnione' ? <AlertCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
  </div>

  {/* TEKST STATUSU (Tu naprawiamy błąd ze screena) */}
  <div>
    <h3 className="font-bold text-slate-900 text-lg">
      {(() => {
        const labelMap: { [key: string]: string } = {
          'Faktury Kosztowe': 'faktury_kosztowe',
          'Faktury Przychodowe': 'faktury_przychodowe',
          'Wyciągi': 'wyciagi',
          'ZUS': 'zus',
          'Kadry': 'kadry'
        };
        const key = labelMap[doc.label] || doc.label.toLowerCase().replace(/ /g, '_');
        return t(`labels.${key}`);
      })()}
    </h3>
    <span className={`text-sm font-medium ${STATUS_COLORS[doc.status]?.split(' ')[1] || 'text-slate-500'}`}>
  {t('common.status')}: {
    (() => {
      // Mapujemy polskie nazwy ze stanu na techniczne klucze JSON
      const statusMap: { [key: string]: string } = {
        'OK': 'ok',
        'Zatwierdzone': 'zatwierdzone',
        'W toku': 'w_toku',
        'Spóźnione': 'spoznione',
        'Brak': 'brak'
      };
      
      const statusKey = statusMap[doc.status] || 'brak';
      return t(`status.${statusKey}`);
    })()
  }
</span>
  </div>
</div>

                  <div className="flex items-center gap-3">
                    {doc.label.toLowerCase().includes('faktur') && doc.status !== 'OK' && (
                      <button 
                        onClick={() => setShowChecker(!showChecker)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                          showChecker ? 'bg-slate-200 text-slate-800' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {t('client_view.check_continuity')}
                      </button>
                    )}
                    
                    <input 
                      type="file" 
                      id={`file-upload-${doc.id}`}
                      className="hidden" 
                      accept=".pdf, .jpg, .jpeg, .png"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(doc.id, doc.label, file);
                      }}
                    />
                    
                    <button 
                      onClick={() => document.getElementById(`file-upload-${doc.id}`)?.click()}
                      disabled={uploading === doc.id || client.locked}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                    >
                      {uploading === doc.id ? (
                        <span className="flex items-center gap-2">
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                            <Upload className="w-4 h-4" />
                          </motion.div>
                          {t('common.uploading', { defaultValue: 'Uploading...' })}
                        </span>
                      ) : (
                        <><Plus className="w-4 h-4" />{t('client_view.add_doc')}</>
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200/50">
                  <p className="text-sm font-medium text-slate-500 mb-2">
                    {t('client_view.uploaded')}: <span className="text-slate-900 font-bold">
                      {doc.files.length} {t('common.files_count', { count: doc.files.length, defaultValue: 'files' })}
                    </span>
                  </p>
                  
                  {doc.files.length > 0 ? (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {doc.files.slice(-4).reverse().map((file, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                          <FileUp className="w-3 h-3 text-slate-400" />
                          <span className="truncate flex-1">{file.name}</span>
                          <span className="text-[10px] text-slate-300">
                            {new Date(file.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 italic">{t('client_view.no_files')}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-12 p-10 bg-blue-600 rounded-[3rem] text-white text-center shadow-2xl shadow-blue-200">
          <h3 className="text-3xl font-bold mb-3">{t('client_view.ready_title')}</h3>
          <p className="text-blue-100 mb-8 text-lg max-w-md mx-auto">{t('client_view.ready_desc')}</p>
          <button 
    onClick={() => {
      if (id && !client.locked) {
        // 1. Logika biznesowa
        finishUploading(id);
        
        // 2. Informacja zwrotna dla klienta
        toast.success(t('client_view.finish_success_msg'), {
          icon: '🚀',
          duration: 5000,
          style: {
            borderRadius: '15px',
            background: '#fff',
            color: '#2563eb',
            fontWeight: 'bold'
          }
        });
      }
    }}
    disabled={client.locked}
    className="inline-flex items-center gap-3 px-10 py-5 bg-white text-blue-600 rounded-2xl font-bold text-xl hover:bg-blue-50 transition-all shadow-xl disabled:opacity-50"
  >
    <Send className="w-6 h-6" />
    {client.locked ? t('status.zatwierdzone') : t('client_view.finish_btn')}
  </button>
        </div>
      </div>
    </div>
  );
}