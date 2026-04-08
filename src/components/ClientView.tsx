import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Client, STATUS_COLORS, DocumentStatus, UploadedFile } from '../types';
import { ArrowLeft, Upload, CheckCircle, FileText, Clock, AlertCircle, Hash, Search, FileUp, Send, Plus, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ClientViewProps {
  clients: Client[];
  updateClientStatus: (clientId: string, docId: string, newStatus: DocumentStatus) => void;
  addFileToDocument: (clientId: string, docId: string, file: UploadedFile) => void;
  finishUploading: (clientId: string) => void;
}

export default function ClientView({ clients, updateClientStatus, addFileToDocument, finishUploading }: ClientViewProps) {
  const { id } = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [invoiceInput, setInvoiceInput] = useState('');
  const [missingInvoices, setMissingInvoices] = useState<number[]>([]);
  const [showChecker, setShowChecker] = useState(false);

  useEffect(() => {
    const found = clients.find(c => c.id === id);
    if (found) setClient(found);
  }, [id, clients]);

  // --- NOWA FUNKCJA WYSYŁKI DO n8n ---
  const sendToN8nKombajn = async (file: File, docLabel: string) => {
    const formData = new FormData();
    formData.append('data', file); // Klucz 'data' musi zgadzać się z n8n
    formData.append('clientName', client?.name || 'Nieznany');
    formData.append('documentType', docLabel);

    try {
      // Twój URL z drugiego screena (Kombajn OCR)
      await fetch('https://n8n.srv1151721.hstgr.cloud/webhook/abd250c7-8d55-4c9f-b9bb-71b7d1a7207e', {
        method: 'POST',
        body: formData,
      });
      console.log('n8n: Plik odebrany przez kombajn');
    } catch (error) {
      console.error('n8n Error:', error);
    }
  };
  // ----------------------------------

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
        if (doc.label.includes('Faktury')) {
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
          <h2 className="text-2xl font-bold text-slate-900">Nie znaleziono klienta</h2>
          <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">Wróć do panelu</Link>
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

    if (id) {
      addFileToDocument(id, docId, fileData);
      setUploading(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Powrót do panelu
        </Link>

        <header className="mb-12">
          <div className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold mb-4">
            Strefa Klienta
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">{client.name}</h1>
          <p className="text-slate-500 text-lg">Twoje dokumenty za miesiąc: <span className="font-semibold text-slate-700">{client.month}</span></p>
          
          {client.locked && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 font-semibold"
            >
              <Lock className="w-5 h-5" />
              Miesiąc zatwierdzony przez biuro. Edycja zablokowana.
            </motion.div>
          )}
        </header>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Lista wymaganych dokumentów
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
                    <div className={`p-3 rounded-2xl ${
                      doc.status === 'OK' || doc.status === 'Zatwierdzone' ? 'bg-green-100 text-green-600' : 
                      doc.status === 'W toku' ? 'bg-blue-100 text-blue-600' :
                      doc.status === 'Spóźnione' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {doc.status === 'OK' || doc.status === 'Zatwierdzone' ? <CheckCircle className="w-6 h-6" /> : 
                       doc.status === 'W toku' ? <Clock className="w-6 h-6" /> :
                       doc.status === 'Spóźnione' ? <AlertCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{doc.label}</h3>
                      <span className={`text-sm font-medium ${STATUS_COLORS[doc.status].split(' ')[1]}`}>
                        Status: {doc.status === 'Zatwierdzone' ? 'Zatwierdzone przez biuro' : doc.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {doc.label.includes('Faktury') && doc.status !== 'OK' && (
                        <button 
                          onClick={() => setShowChecker(!showChecker)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                            showChecker ? 'bg-slate-200 text-slate-800' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Sprawdź ciągłość
                        </button>
                      )}
                      
                      <input 
                        type="file" 
                        id={`file-upload-${doc.id}`}
                        className="hidden" 
                        accept=".pdf, .jpg, .jpeg, .png"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUpload(doc.id, doc.label, file);
                          }
                        }}
                      />
                      
                      <button 
                        onClick={() => document.getElementById(`file-upload-${doc.id}`)?.click()}
                        disabled={uploading === doc.id || client.locked}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                      >
                        {uploading === doc.id ? (
                          <span className="flex items-center gap-2">
                            <motion.div 
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            >
                              <Upload className="w-4 h-4" />
                            </motion.div>
                            Wysyłanie...
                          </span>
                        ) : (
                          <><Plus className="w-4 h-4" /> Dodaj dokument</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200/50">
                  <p className="text-sm font-medium text-slate-500 mb-2">
                    Przesłano: <span className="text-slate-900 font-bold">{doc.files.length} {doc.files.length === 1 ? 'plik' : (doc.files.length > 1 && doc.files.length < 5) ? 'pliki' : 'plików'}</span>
                  </p>
                  
                  {doc.files.length > 0 ? (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {doc.files.slice(-4).reverse().map((file, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                          <FileUp className="w-3 h-3 text-slate-400" />
                          <span className="truncate flex-1">{file.name}</span>
                          <span className="text-[10px] text-slate-300">{new Date(file.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Brak przesłanych plików.</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-12 p-10 bg-blue-600 rounded-[3rem] text-white text-center shadow-2xl shadow-blue-200">
          <h3 className="text-3xl font-bold mb-3">Gotowe na ten miesiąc?</h3>
          <p className="text-blue-100 mb-8 text-lg max-w-md mx-auto">Kliknij poniżej, aby poinformować biuro o zakończeniu przesyłania.</p>
          <button 
            onClick={() => {
              if (id && !client.locked) finishUploading(id);
            }}
            disabled={client.locked}
            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-blue-600 rounded-2xl font-bold text-xl hover:bg-blue-50 transition-all shadow-xl disabled:opacity-50"
          >
            <Send className="w-6 h-6" />
            {client.locked ? 'Zatwierdzone' : 'Zakończ przesyłanie'}
          </button>
        </div>
      </div>
    </div>
  );
}