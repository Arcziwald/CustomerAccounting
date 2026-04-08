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

  // POPRAWIONA FUNKCJA PRZESYŁANIA
  const handleUpload = (docId: string, file: File) => {
    setUploading(docId);
    
    const fileData: UploadedFile = {
      name: file.name,
      timestamp: new Date().toISOString(),
      rawFile: file // Przekazujemy fizyczny plik do App.tsx
    };

    if (id) {
      addFileToDocument(id, docId, fileData);
      
      // Krótkie opóźnienie tylko dla efektu UI
      setTimeout(() => {
        setUploading(null);
      }, 800);
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
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUpload(doc.id, file); // WYWOŁANIE PRAWDZIWEGO UPLOADU
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
                    {doc.status === 'OK' && (
                      <div className="flex items-center gap-2 text-green-600 font-medium bg-green-50 px-4 py-2 rounded-xl border border-green-100">
                        <CheckCircle className="w-4 h-4" /> Gotowe
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-500">
                      Przesłano: <span className="text-slate-900 font-bold">{doc.files.length} {doc.files.length === 1 ? 'plik' : (doc.files.length > 1 && doc.files.length < 5) ? 'pliki' : 'plików'}</span>
                    </p>
                  </div>
                  
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
                    <p className="text-xs text-slate-400 italic">Brak przesłanych plików w tej kategorii.</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <AnimatePresence>
            {showChecker && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-8 bg-blue-50/50 rounded-[2rem] border border-blue-100 shadow-inner"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-600 text-white rounded-lg">
                    <Hash className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Weryfikator ciągłości faktur</h3>
                </div>
                
                <textarea
                  className="w-full p-4 bg-white border border-blue-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[100px] text-lg font-mono"
                  placeholder="Wklej numery..."
                  value={invoiceInput}
                  onChange={(e) => handleSequenceCheck(e.target.value)}
                />

                {missingInvoices.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-6 p-5 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4"
                  >
                    <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-800 font-bold text-lg">Wykryto braki w numeracji!</p>
                      <p className="text-red-600">
                        Brakuje faktur nr: <span className="font-bold">{missingInvoices.join(', ')}</span>
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-12 p-10 bg-blue-600 rounded-[3rem] text-white text-center shadow-2xl shadow-blue-200 relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-3xl font-bold mb-3">Gotowe na ten miesiąc?</h3>
            <p className="text-blue-100 mb-8 text-lg max-w-md mx-auto">Kliknij poniżej, aby poinformować biuro o zakończeniu przesyłania dokumentów.</p>
            <button 
              onClick={() => {
                if (id && !client.locked) finishUploading(id);
              }}
              disabled={client.locked}
              className="inline-flex items-center gap-3 px-10 py-5 bg-white text-blue-600 rounded-2xl font-bold text-xl hover:bg-blue-50 transition-all transform hover:scale-105 active:scale-95 shadow-xl disabled:opacity-50"
            >
              <Send className="w-6 h-6" />
              {client.locked ? 'Zatwierdzone' : 'Zakończ przesyłanie'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
