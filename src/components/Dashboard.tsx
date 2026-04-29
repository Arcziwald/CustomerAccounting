import React, { useState } from 'react';
import { Client, STATUS_COLORS, DocumentStatus, OCRRecord } from '../types';
import { Bell, Copy, Check, ExternalLink, Search, Settings2, Plus, Trash2, X, Users, Clock, AlertTriangle, Folder, Lock, Unlock, History, ChevronDown, Download, Eye, FileText, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ActivityEntry } from '../types';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';


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
  addActivity: (clientName: string, docLabel: string, fileName: string) => void;
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
  analyzeDocument,
  addActivity
}: DashboardProps) {
  const { t, i18n } = useTranslation();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [newDocLabel, setNewDocLabel] = useState('');
  const [viewingFilesDocId, setViewingFilesDocId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<OCRRecord | null>(null);

  const handleNudge = async (client: any) => {
// 1. Treść wiadomości od Agenta
  const aiMessage = `Dzień dobry! Agent AI z tej strony. 🤖 Widzę, że w firmie ${client.name} brakuje jeszcze kilku dokumentów za ten miesiąc. Pomóżmy sobie to dokończyć`;

  // 2. Logika wizualna (to co już masz)
  setCopiedId(client.id);
  // 3. Dodanie do paska (bezpieczne wywołanie)
  try {
    if (typeof addActivity === 'function') {
      addActivity('Agent AI', 'Przypomnienie', `Wysłano monit do ${client.name}`);
    }
  } catch (e) {
    console.error("Błąd przy dodawaniu aktywności:", e);
  }
  
// 4. Profesjonalny dymek dla księgowego
  toast.success(
    <div>
      <p className="font-bold text-xs text-blue-600">Agent AI wysłał monit:</p>
      <p className="text-sm italic">"{aiMessage}"</p>
    </div>,
    {
      icon: '📩',
      duration: 5000,
      style: { borderRadius: '12px', border: '1px solid #e2e8f0' }
    }
  );

  // 5. WYSYŁKA DO n8n (Dodajemy to!)
  try {
    // Tutaj wklejasz URL Webhooka z n8n (najlepiej TEST URL na początek)
    const webhookUrl = 'https://n8n.srv1151721.hstgr.cloud/webhook-test/smart-nudge'; 

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: client.id,
        clientName: client.name,
        action: 'nudge_clicked',
        timestamp: new Date().toISOString()
      }),
    });
    
    console.log('n8n odebrało sygnał dla:', client.name);
  } catch (error) {
    console.error('Problem z połączeniem z n8n:', error);
  }

  // 5. Reset powiadomienia "Wysłano" po 2 sekundach
  setTimeout(() => setCopiedId(null), 2000);
};

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const editingClient = clients.find(c => c.id === editingClientId);

  const handleSmartNudge = (record: OCRRecord) => {
  const aiMessage = `Pani Krysiu, to zdjęcie z plaży, a nie faktura za prąd! Proszę o właściwy dokument. 😉`;

  // 1. Ślad w historii (widoczny dla księgowego)
  addActivity(
    'Agent AI', 
    'Humorystyczny Monit', 
    `Wysłano: "${aiMessage}" do ${record.clientName}`
  );

  // 2. Profesjonalny Toast z podglądem treści
  toast.success(
    <div>
      <p className="font-bold">Agent AI wysłał wiadomość:</p>
      <p className="text-sm italic">"{aiMessage}"</p>
    </div>,
    {
      icon: '🤖',
      duration: 10000, // Dłużej, żeby zdążył przeczytać i się uśmiechnąć
      style: { borderRadius: '15px', border: '1px solid #713abe' }
  });

  // 3. Opcjonalnie wysyłka do n8n (jeśli chcesz mieć podpięty e-mail/whatsapp)
  // fetch('TWOJ_WEBHOOK_N8N', { method: 'POST', body: JSON.stringify(record) });
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
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">BRAKOMAT</h1>
          <p className="text-slate-500 text-lg">Panel administracyjny biura rachunkowego</p>
          <div className="flex gap-2 mb-4">
          <button onClick={() => i18n.changeLanguage('pl')} className="px-2 py-1 bg-slate-200 rounded text-xs">PL</button>
          <button onClick={() => i18n.changeLanguage('en')} className="px-2 py-1 bg-slate-200 rounded text-xs">EN</button>
        </div>
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

      {/* Sekcja listy klientów - Responsywna */}
      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto lg:overflow-visible">
          <table className="w-full text-left border-collapse">
            {/* Nagłówek widoczny tylko na dużych ekranach */}
            <thead className="hidden lg:table-header-group bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider">Klient</th>
                <th className="px-6 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider">Statusy dokumentów</th>
                <th className="px-8 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider text-right">Akcje</th>
              </tr>
            </thead>
            
            {/* Body tabeli - na mobilkach wiersze stają się kartami */}
            <tbody className="divide-y divide-slate-50 block lg:table-row-group">
              {filteredClients.map((client) => (
                <motion.tr 
                  key={client.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col lg:table-row hover:bg-slate-50/30 transition-colors p-4 lg:p-0 border-b lg:border-none"
                >
                  {/* KOLUMNA KLIENTA */}
                  <td className="px-4 py-2 lg:px-8 lg:py-6 block lg:table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-base lg:text-lg flex items-center gap-2 flex-wrap">
                          <span className="truncate">{client.name}</span>
                          {client.locked && <Lock className="w-4 h-4 text-emerald-600 shrink-0" />}
                        </div>
                        <div className="text-xs lg:text-sm text-slate-400 font-medium flex items-center gap-2">
                          {client.month}
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <a 
                            href={`https://drive.google.com/drive/search?q=${encodeURIComponent(client.name)}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-500 hover:text-blue-700 transition-colors"
                          >
                            <Folder className="w-3 h-3" />
                            Dysk
                          </a>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  {/* KOLUMNA STATUSÓW */}
                  <td className="px-4 py-3 lg:px-6 lg:py-6 block lg:table-cell">
                    <div className="flex flex-wrap gap-1.5 lg:gap-2">
                      {client.documents.map((doc) => (
                        <div key={doc.id} className="relative">
                          <button 
                            onClick={() => doc.status === 'W toku' ? setViewingFilesDocId(viewingFilesDocId === `${client.id}-${doc.id}` ? null : `${client.id}-${doc.id}`) : null}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] lg:text-[11px] font-bold uppercase tracking-tight border transition-all ${STATUS_COLORS[doc.status]} ${doc.status === 'W toku' ? 'cursor-pointer hover:shadow-sm' : 'cursor-default'}`}
                          >
                            {doc.label}
                            {doc.files.length > 0 && <span className="bg-white/30 px-1 rounded-sm text-[9px]">{doc.files.length}</span>}
                            {doc.status === 'W toku' && <ChevronDown className={`w-3 h-3 ${viewingFilesDocId === `${client.id}-${doc.id}` ? 'rotate-180' : ''}`} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* KOLUMNA AKCJI */}
                  <td className="px-4 py-2 lg:px-8 lg:py-6 block lg:table-cell">
                    <div className="flex items-center justify-between lg:justify-end gap-1 sm:gap-2">
                      {/* Narzędzia pomocnicze */}
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        <button
                          onClick={() => toggleLockClient(client.id)}
                          className={`p-2 rounded-xl transition-all ${client.locked ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:bg-blue-50'}`}
                        >
                          {client.locked ? <Lock className="w-4 h-4 lg:w-5 lg:h-5" /> : <Unlock className="w-4 h-4 lg:w-5 lg:h-5" />}
                        </button>

                        <button
                          onClick={() => setEditingClientId(client.id)}
                          className="p-2 text-slate-400 hover:bg-blue-50 rounded-xl transition-all"
                        >
                          <Settings2 className="w-4 h-4 lg:w-5 lg:h-5" />
                        </button>

                        <Link 
                          to={`/client/${client.id}`}
                          className="p-2 text-slate-400 hover:bg-blue-50 rounded-xl transition-all"
                        >
                          <ExternalLink className="w-4 h-4 lg:w-5 lg:h-5" />
                        </Link>
                      </div>

                      {/* Główny przycisk Nudge */}
                      <button
                        onClick={() => handleNudge(client)}
                        className={`flex items-center gap-2 px-3 py-1.5 lg:px-4 lg:py-2 rounded-xl text-xs lg:text-sm font-bold transition-all shrink-0 ${
                          copiedId === client.id 
                            ? 'bg-green-500 text-white shadow-lg shadow-green-200' 
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        }`}
                      >
                        {copiedId === client.id ? (
                          <><Check className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> <span className="hidden xs:inline">Wysłano</span></>
                        ) : (
                          <><Bell className="w-3.5 h-3.5 lg:w-4 lg:h-4" />Wyślij</>
                        )}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredClients.length === 0 && (
          <div className="py-20 text-center">
            <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">Nie znaleziono klientów.</p>
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
      <div className="w-full mt-12 px-0">
        <div className={`w-full bg-white rounded-[2rem] p-4 lg:p-8 shadow-sm border border-slate-100 mb-12 transition-all duration-500 ${subscriptionTier === '1' ? 'opacity-40 pointer-events-none select-none blur-[2px]' : ''}`}>
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{t('dashboard.title')}</h2>
                <p className="text-slate-500">{t('dashboard.subtitle')}</p>
              </div>
            </div>
            <button 
              onClick={() => alert('Symulacja eksportu do Excel (.xlsx)...')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-bold hover:bg-emerald-100 transition-all shadow-sm w-full sm:w-auto"
            >
              <Download className="w-5 h-5" />
              Eksport do Excel
            </button>
          </div>

          <div className="w-full overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="hidden lg:table-row border-b border-slate-50">
                  <th className="pb-4 font-semibold text-slate-400 text-xs uppercase tracking-wider">Klient/Dokument</th>
                  <th className="pb-4 font-semibold text-slate-400 text-xs uppercase tracking-wider text-right px-8">Szczegóły i Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 block lg:table-row-group w-full">
                {ocrRecords.length === 0 ? (
                  <tr className="block lg:table-row w-full">
                    <td colSpan={5} className="py-20 text-center text-slate-400 block lg:table-cell font-medium italic w-full">
                      <div className="flex flex-col items-center gap-3 w-full">
                        <Search className="w-10 h-10 opacity-20" />
                        <p>Oczekiwanie na pierwsze dokumenty do analizy...</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  ocrRecords.map((record) => (
                    <motion.tr 
                      key={record.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-full flex flex-col lg:table-row bg-white hover:bg-slate-50/50 transition-colors p-5 lg:p-0 mb-6 lg:mb-0 border lg:border-none rounded-[2rem] lg:rounded-none shadow-sm lg:shadow-none min-w-full"
                    >
                      {/* 1. KLIENT I NUMER - Pełna szerokość kontenera */}
                      <td className="w-full py-2 lg:py-6 lg:px-6 block lg:table-cell">
                        <div className="w-full flex justify-between items-start lg:block">
                          <div className="w-full">
                            <div className="font-black text-slate-900 text-lg lg:text-base leading-tight break-words">{record.clientName}</div>
                            {record.status !== 'Oczekiwanie' && (
                              <button 
                                onClick={() => setPreviewDoc(record)}
                                className="text-blue-600 text-sm font-bold hover:underline flex items-center gap-1 mt-2 lg:mt-0.5"
                              >
                                {record.invoiceNumber} <Eye className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. DANE DOKUMENTU - Rozciągnięte do krawędzi */}
                      <td className="w-full py-4 lg:py-6 lg:px-6 block lg:table-cell border-t lg:border-none mt-2 lg:mt-0">
                        {record.status !== 'Oczekiwanie' && (
                          <div className="w-full grid grid-cols-1 gap-4">
                            <div className="w-full">
                              <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Typ dokumentu:</div>
                              <div className="text-sm text-slate-700 font-bold">{record.documentType}</div>
                            </div>
                            <div className="w-full">
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                <div className="text-sm text-slate-600 font-medium">{record.issueDate}</div>
                                <div className="text-xs text-slate-500 font-mono font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{record.sellerNip}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 3. KWOTY I STATUS - Pełne wyrównanie */}
                      <td className="w-full py-4 lg:py-6 lg:px-8 block lg:table-cell">
                        <div className="w-full flex flex-col lg:items-end gap-4">
                          {record.status !== 'Oczekiwanie' && (
                            <div className="w-full lg:w-48 bg-slate-50 p-4 rounded-2xl flex justify-between items-center lg:block lg:text-right border border-slate-100">
                              <div className="lg:hidden text-[10px] text-slate-400 font-black uppercase">Wartość:</div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-slate-900">{record.netAmount.toLocaleString()} zł</div>
                                <div className="text-[10px] text-slate-400 font-bold">VAT: {record.vatAmount.toLocaleString()} zł</div>
                                <div className="text-base font-black text-blue-600 mt-1">{record.grossAmount.toLocaleString()} zł</div>
                              </div>
                            </div>
                          )}

                          <div className="w-full lg:w-auto">
                            {record.status === 'Oczekiwanie' ? (
                              <button 
                                onClick={() => analyzeDocument(record.id)}
                                className="w-full px-8 py-4 lg:py-2.5 bg-indigo-600 text-white rounded-2xl lg:rounded-xl font-black text-sm lg:text-xs hover:bg-indigo-700 transition-all shadow-lg uppercase tracking-wider"
                              >
                                <Search className="w-5 h-5 lg:w-4 lg:h-4 mr-2 inline" /> Analizuj
                              </button>
                            ) : (
                              <div className="flex flex-col gap-2 w-full lg:w-auto">
                                <button 
                                  onClick={() => record.status !== 'Zweryfikowano' && updateOCRStatus(record.id, record.status === 'Odrzucone' ? 'Do weryfikacji' : 'Zweryfikowano')}
                                  className={`w-full px-6 py-3 lg:py-1.5 rounded-xl text-xs font-black transition-all border-2 ${
                                    record.status === 'Zweryfikowano' 
                                      ? 'bg-green-50 text-green-700 border-green-100' 
                                      : record.status === 'Odrzucone' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                                  }`}
                                >
                                  {record.status.toUpperCase()}
                                </button>
                                {record.status === 'Odrzucone' && (
                                  <button 
                                    onClick={() => handleSmartNudge(record)}
                                    className="py-2 text-[10px] text-blue-600 font-black bg-blue-50/50 rounded-lg flex items-center justify-center gap-2"
                                  >
                                    <Bell className="w-3.5 h-3.5" /> SMART NUDGE
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </motion.tr>
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
                      <p className="font-bold text-slate-900">Symulacja podglądu</p>
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
    
    // Dodajemy wpis do paska aktywności
    addActivity(
      'Agent AI', 
      'System', 
      `Odrzucono dokument i powiadomiono: ${previewDoc.clientName}`
    );

    // Toast zamiast alertu
    toast.error('Dokument odrzucony. Klient otrzymał powiadomienie.', {
      icon: '📩'
    });

    setPreviewDoc(null);
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
