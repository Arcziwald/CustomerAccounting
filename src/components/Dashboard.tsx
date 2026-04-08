import React, { useState } from 'react';
import { Client, STATUS_COLORS, DocumentStatus, OCRRecord } from '../types';
import { Bell, Copy, Check, ExternalLink, Search, Settings2, Plus, Trash2, X, Users, Clock, AlertTriangle, Folder, Lock, Unlock, History, ChevronDown, Download, Eye, FileText, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ActivityEntry } from '../types';
import { useTranslation } from 'react-i18next';

const { t, i18n } = useTranslation();

interface DashboardProps {
  clients: Client[];
  subscriptionTier: string;
  addDocument: (clientId: string, label: string) => void;
  removeDocument: (clientId: string, docId: string) => void;
  activities: ActivityEntry[];
  toggleLockClient: (clientId: string) => void;
  ocrRecords: OCRRecord[];
  updateOCRStatus: (recordId: string, newStatus: 'Oczekiwanie' | 'Do weryfikacji' | 'Zweryfikowano' | 'Odrzucone') => void;
  analyzeDocument: (recordId: string) => void;
}

export default function Dashboard({ 
  clients, 
  subscriptionTier,
  addDocument, 
  removeDocument, 
  activities, 
  toggleLockClient,
  ocrRecords,
  updateOCRStatus,
  analyzeDocument
}: DashboardProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [newDocLabel, setNewDocLabel] = useState('');
  const [viewingFilesDocId, setViewingFilesDocId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<OCRRecord | null>(null);

  const handleNudge = (client: Client) => {
    const missing = client.documents
      .filter(doc => doc.status === 'Brak' || doc.status === 'Spóźnione' || doc.status === 'W toku')
      .map(doc => doc.label)
      .join(', ');

    const message = `Cześć ${client.name}, brakuje nam jeszcze ${missing || 'dokumentów'} za miesiąc ${client.month}. Pozdrawiamy, Twoje Biuro`;
    
    navigator.clipboard.writeText(message);
    setCopiedId(client.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const editingClient = clients.find(c => c.id === editingClientId);

  const handleSmartNudge = (record: OCRRecord) => {
    const message = `Cześć! Przesłany plik ${record.fileName} nie wygląda na dokument księgowy. Proszę, prześlij poprawną fakturę.`;
    navigator.clipboard.writeText(message);
    alert('Skopiowano inteligentne powiadomienie do schowka!');
  };

  const stats = {
    total: clients.length,
    complete: clients.filter(c => c.documents.every(d => d.status === 'OK' || d.status === 'Zatwierdzone')).length,
    late: clients.filter(c => c.documents.some(d => d.status === 'Spóźnione')).length,
    missing: clients.filter(c => 
      !c.documents.some(d => d.status === 'Spóźnione') && 
      c.documents.some(d => d.status === 'Brak' || d.status === 'W toku')
    ).length,
    toCorrect: ocrRecords.filter(r => r.status === 'Odrzucone').length
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">The Missing Link</h1>
          <p className="text-slate-500 text-lg">Panel administracyjny biura rachunkowego</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Szukaj klienta..." 
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {/* Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
              <div className="text-sm text-slate-500 font-medium">Wszyscy klienci</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.complete}</div>
              <div className="text-sm text-slate-500 font-medium">Kompletne</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.missing}</div>
              <div className="text-sm text-slate-500 font-medium">Brakujące</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.late}</div>
              <div className="text-sm text-slate-500 font-medium">Spóźnione</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.toCorrect}</div>
              <div className="text-sm text-slate-500 font-medium">Do poprawki</div>
            </div>
          </div>
        </div>

        {/* Activity Feed Sidebar */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full min-h-[140px]">
          <div className="flex items-center gap-2 mb-4 text-slate-900 font-bold">
            <History className="w-5 h-5 text-blue-600" />
            <span>Ostatnie działania</span>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-[100px] lg:max-h-none scrollbar-hide">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Brak niedawnych aktywności</p>
            ) : (
              activities.map(activity => (
                <div key={activity.id} className="text-xs border-l-2 border-blue-100 pl-3 py-1">
                  <div className="font-bold text-slate-800 truncate">{activity.clientName}</div>
                  <div className="text-slate-500 truncate">{activity.docLabel}: {activity.fileName}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{activity.timestamp}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-bottom border-slate-100">
                <th className="px-8 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider">Klient</th>
                <th className="px-6 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider">Statusy dokumentów</th>
                <th className="px-8 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredClients.map((client) => (
                <motion.tr 
                  key={client.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-slate-50/30 transition-colors"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-lg flex items-center gap-2">
                          {client.name}
                          {client.locked && <Lock className="w-4 h-4 text-emerald-600" />}
                        </div>
                        <div className="text-sm text-slate-400 font-medium flex items-center gap-2">
                          {client.month}
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <a 
                            href={`https://drive.google.com/drive/search?q=${encodeURIComponent(client.name)}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-500 hover:text-blue-700 transition-colors"
                          >
                            <Folder className="w-3.5 h-3.5" />
                            Dysk Google
                          </a>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-6">
                    <div className="flex flex-wrap gap-2">
                      {client.documents.map((doc) => (
                        <div key={doc.id} className="relative group">
                          <button 
                            onClick={() => doc.status === 'W toku' ? setViewingFilesDocId(viewingFilesDocId === `${client.id}-${doc.id}` ? null : `${client.id}-${doc.id}`) : null}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight border transition-all ${STATUS_COLORS[doc.status]} ${doc.status === 'W toku' ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`}
                          >
                            {doc.label}
                            {doc.files.length > 0 && (
                              <span className="bg-white/40 px-1.5 rounded-md text-[10px]">
                                {doc.files.length}
                              </span>
                            )}
                            {doc.status === 'W toku' && <ChevronDown className={`w-3 h-3 transition-transform ${viewingFilesDocId === `${client.id}-${doc.id}` ? 'rotate-180' : ''}`} />}
                          </button>

                          <AnimatePresence>
                            {viewingFilesDocId === `${client.id}-${doc.id}` && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute z-10 top-full mt-2 left-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4"
                              >
                                <div className="text-xs font-bold text-slate-900 mb-3 flex items-center justify-between">
                                  <span>Wgrane pliki ({doc.files.length})</span>
                                  <button onClick={() => setViewingFilesDocId(null)}><X className="w-3.5 h-3.5 text-slate-400" /></button>
                                </div>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                  {doc.files.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                                      <span className="text-[10px] font-medium text-slate-700 truncate max-w-[120px]">{file.name}</span>
                                      <span className="text-[9px] text-slate-400">{file.timestamp}</span>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleLockClient(client.id)}
                        className={`p-2 rounded-xl transition-all ${
                          client.locked 
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                            : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                        title={client.locked ? "Odblokuj edycję dla klienta" : "Zatwierdź miesiąc i zablokuj edycję"}
                      >
                        {client.locked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                      </button>

                      <button
                        onClick={() => setEditingClientId(client.id)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Edytuj listę dokumentów"
                      >
                        <Settings2 className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => handleNudge(client)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          copiedId === client.id 
                            ? 'bg-green-500 text-white shadow-lg shadow-green-200' 
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        }`}
                      >
                        {copiedId === client.id ? (
                          <><Check className="w-4 h-4" /> Skopiowano</>
                        ) : (
                          <><Bell className="w-4 h-4" /> Nudge</>
                        )}
                      </button>
                      
                      <Link 
                        to={`/client/${client.id}`}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Widok klienta"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </Link>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredClients.length === 0 && (
          <div className="py-20 text-center">
            <div className="text-slate-300 mb-4 flex justify-center">
              <Search className="w-12 h-12" />
            </div>
            <p className="text-slate-500 text-lg">Nie znaleziono klientów spełniających kryteria.</p>
          </div>
        )}
      </div>

      {/* Edit List Modal */}
      <AnimatePresence>
        {editingClientId && editingClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingClientId(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-slate-900">Edytuj wymagania</h3>
                  <button onClick={() => setEditingClientId(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>
                
                <p className="text-slate-500 mb-6 font-medium">{editingClient.name}</p>

                <div className="space-y-3 mb-8 max-h-[300px] overflow-y-auto pr-2">
                  {editingClient.documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="font-semibold text-slate-700">{doc.label}</span>
                      <button 
                        onClick={() => removeDocument(editingClient.id, doc.id)}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Nowy dokument (np. Umowa najmu)" 
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    value={newDocLabel}
                    onChange={(e) => setNewDocLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newDocLabel.trim()) {
                        addDocument(editingClient.id, newDocLabel.trim());
                        setNewDocLabel('');
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      if (newDocLabel.trim()) {
                        addDocument(editingClient.id, newDocLabel.trim());
                        setNewDocLabel('');
                      }
                    }}
                    className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Intelligent Document Register Section */}
      <div className="relative">
        <div className={`bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-12 transition-all duration-500 ${subscriptionTier === '1' ? 'opacity-40 pointer-events-none select-none blur-[2px]' : ''}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Inteligentny Rejestr Dokumentów</h2>
                <p className="text-slate-500">Automatyczna ekstrakcja danych z faktur (OCR)</p>
              </div>
            </div>
            <button 
              onClick={() => alert('Symulacja eksportu do Excel (.xlsx)...')}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-bold hover:bg-emerald-100 transition-all shadow-sm"
            >
              <Download className="w-5 h-5" />
              Eksport do Excel
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="pb-4 font-semibold text-slate-400 text-xs uppercase tracking-wider">Klient / Faktura</th>
                  <th className="pb-4 font-semibold text-slate-400 text-xs uppercase tracking-wider">Typ / Data / NIP</th>
                  <th className="pb-4 font-semibold text-slate-400 text-xs uppercase tracking-wider text-right">Kwoty (Netto / VAT / Brutto)</th>
                  <th className="pb-4 font-semibold text-slate-400 text-xs uppercase tracking-wider text-center">Status</th>
                  <th className="pb-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {ocrRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400 italic">
                      <div className="flex flex-col items-center gap-3">
                        <Search className="w-10 h-10 opacity-20" />
                        <p>Oczekiwanie na przesłanie dokumentów do analizy...</p>
                        <p className="text-xs not-italic">Wgraj fakturę w Strefie Klienta, aby zobaczyć magię OCR.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  ocrRecords.map((record) => (
                    <tr key={record.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-5 px-2">
                        <div className="font-bold text-slate-900">{record.clientName}</div>
                        {record.status === 'Oczekiwanie' ? (
                          <div className="text-slate-400 text-sm italic">Oczekiwanie na analizę...</div>
                        ) : (
                          <button 
                            onClick={() => setPreviewDoc(record)}
                            className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1 mt-0.5"
                          >
                            {record.invoiceNumber} <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                      <td className="py-5">
                        {record.status === 'Oczekiwanie' ? (
                          <div className="text-slate-300 text-xs">---</div>
                        ) : (
                          <>
                            <div className={`text-xs font-bold mb-1 ${record.documentType === 'Nieznany' ? 'text-red-500' : 'text-indigo-500'}`}>
                              {record.documentType === 'Nieznany' ? '⚠️ BŁĄD: Nieznany dokument' : 'Faktura'}
                            </div>
                            <div className="text-sm text-slate-700 font-medium">{record.issueDate}</div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">{record.sellerNip}</div>
                          </>
                        )}
                      </td>
                      <td className="py-5 text-right">
                        {record.status === 'Oczekiwanie' ? (
                          <div className="text-slate-300 text-xs">---</div>
                        ) : (
                          <>
                            <div className="text-sm font-bold text-slate-900">{record.netAmount.toLocaleString()} zł</div>
                            <div className="text-xs text-slate-400">VAT: {record.vatAmount.toLocaleString()} zł</div>
                            <div className="text-xs font-black text-blue-600 mt-0.5">Brutto: {record.grossAmount.toLocaleString()} zł</div>
                          </>
                        )}
                      </td>
                      <td className="py-5 text-center">
                        <div className="flex flex-col items-center gap-2">
                          {record.status === 'Oczekiwanie' ? (
                            <button 
                              onClick={() => analyzeDocument(record.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                            >
                              <Search className="w-3.5 h-3.5" /> Analizuj
                            </button>
                          ) : (
                            <>
                              <button 
                                onClick={() => {
                                  const nextStatus = record.status === 'Zweryfikowano' ? 'Do weryfikacji' : 'Zweryfikowano';
                                  updateOCRStatus(record.id, nextStatus);
                                }}
                                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                                  record.status === 'Zweryfikowano' 
                                    ? 'bg-green-100 text-green-700 border border-green-200' 
                                    : record.status === 'Odrzucone'
                                    ? 'bg-red-100 text-red-700 border border-red-200'
                                    : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                }`}
                              >
                                {record.status === 'Zweryfikowano' ? <Check className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
                                {record.status}
                              </button>
                              {record.status === 'Odrzucone' && (
                                <button 
                                  onClick={() => handleSmartNudge(record)}
                                  className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1"
                                >
                                  <Bell className="w-3 h-3" /> Smart Nudge
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-5 text-right pr-2">
                        <div className="text-[10px] text-slate-300 font-mono italic truncate max-w-[120px]" title={record.fileName}>
                          {record.fileName}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>



      {/* Preview Modal */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewDoc(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Podgląd dokumentu</h3>
                  <p className="text-sm text-slate-500">{previewDoc.invoiceNumber} • {previewDoc.clientName}</p>
                </div>
                <button 
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-600 shadow-sm"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8">
                <div className="aspect-[3/4] bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200 overflow-hidden relative group">
                  <img 
                    src={`https://picsum.photos/seed/${previewDoc.id}/800/1200`} 
                    alt="Podgląd faktury" 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px]">
                    <div className="p-4 bg-white rounded-2xl shadow-xl flex flex-col items-center gap-3">
                      <FileText className="w-12 h-12 text-blue-500" />
                      <p className="font-bold text-slate-900">Symulacja podglądu OCR</p>
                      <div className="text-xs text-slate-500 text-center space-y-1">
                        <p>Plik: {previewDoc.fileName}</p>
                        <p>Rozmiar: 1.2 MB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => {
                    updateOCRStatus(previewDoc.id, 'Odrzucone');
                    setPreviewDoc(null);
                    alert('Dokument odrzucony. Klient otrzyma powiadomienie.');
                  }}
                  className="px-6 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold hover:bg-red-100 transition-all"
                >
                  Odrzuć (Powiadom klienta)
                </button>
                <button 
                  onClick={() => {
                    updateOCRStatus(previewDoc.id, 'Zweryfikowano');
                    setPreviewDoc(null);
                  }}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                  Zatwierdź dane
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="mt-12 text-center text-slate-400 text-sm">
        &copy; 2026 The Missing Link - System Monitorowania Dokumentacji
      </footer>
    </div>
</div>
)}
