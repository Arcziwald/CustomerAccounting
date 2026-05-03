import React, { useEffect, useState } from 'react';
import { Client, STATUS_COLORS, DocumentStatus, OCRRecord } from '../types';
import { Bell, Copy, Check, ExternalLink, Search, Settings2, Plus, Trash2, X, Users, Clock, AlertTriangle, Folder, Lock, Unlock, History, ChevronDown, Download, Eye, FileText, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ActivityEntry } from '../types';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Tooltip from './Tooltip';


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
  addActivity: (clientName: string, action: string, detail: string) => void;
  
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



// Używamy prostego stanu bez funkcji sprawdzającej wewnątrz useState
  const [showWelcome, setShowWelcome] = useState(false);

  // Sprawdzamy sesję TYLKO RAZ po pełnym załadowaniu komponentu
  useEffect(() => {
    const isDone = sessionStorage.getItem('brakomat_done');
    if (!isDone) {
      setShowWelcome(true);
    }
  }, []);

  // Funkcja, która fizycznie "ubija" okno i zapisuje ślad
  const handleFinalClose = () => {
    sessionStorage.setItem('brakomat_done', 'true');
    setShowWelcome(false);
  };


  const handleNudge = async (client: any) => {
// 1. Treść wiadomości od Agenta
  const aiMessage = t('ai.nudge_msg', { name: client.name });

  // 2. Logika wizualna (to co już masz)
  setCopiedId(client.id);
  // 3. Dodanie do paska (bezpieczne wywołanie)
  try {
    if (typeof addActivity === 'function') {
      // WYSYŁAMY KLUCZE, NIE TŁUMACZENIA
      addActivity(
        'Agent AI', 
        'ai.nudge_type_system', 
        `activities.nudge_sent_to|${client.name}`
      );
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
  // 1. Pobieramy treść z i18n
  const aiMessage = t('ai.beach_photo_msg');

  // 2. Ślad w historii (też używamy t())
  addActivity(
  'Agent AI', 
  t('ai.nudge_type_humor'), 
  t('activities.ai_nudge_sent', { msg: aiMessage, client: record.clientName })
);

  // 3. Profesjonalny Toast
  toast.success(
    <div>
      <p className="font-bold">{t('ai.toast_header')}:</p>
      <p className="text-sm italic">"{aiMessage}"</p>
    </div>,
    {
      icon: '🤖',
      duration: 10000,
      style: { borderRadius: '15px', border: '1px solid #713abe' }
    }
  );


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
    <div className="min-h-screen bg-[#F8FAFC] max-w-7xl mx-auto px-4 py-8">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
  <div>
    <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">{t('header.app_name')}</h1>
    <p className="text-slate-500 text-lg">{t('header.description')}</p>
    
    {/* Powiększony i wyraźniejszy przełącznik języków */}
    <div className="flex p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200/50 mt-6 mb-2">
      <button 
        onClick={() => i18n.changeLanguage('pl')} 
        className={`px-6 py-2 rounded-xl text-sm font-black transition-all duration-200 ${
          i18n.language === 'pl' 
            ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200' 
            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
        }`}
      >
        PL
      </button>
      <button 
        onClick={() => i18n.changeLanguage('en')} 
        className={`px-6 py-2 rounded-xl text-sm font-black transition-all duration-200 ${
          i18n.language === 'en' 
            ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200' 
            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
        }`}
      >
        EN
      </button>
    </div>
  </div>
  
  <div className="relative w-full md:w-80">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
  <input 
    type="text" 
    // POPRAWKA: Placeholder używa teraz klucza z i18next
    placeholder={t('common.search_placeholder', { defaultValue: 'Search client...' })} 
    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
</div>
</header>

      {/* Stats Section */}
      <div className="flex flex-col lg:flex-row gap-8 mb-8 items-start">
        {/* Lewa strona: Karty Statystyk (5 kart) */}
        <div className="w-full lg:w-3/4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {[
  { label: t('stats.all'), value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'hover:border-blue-400' },
  { label: t('stats.complete'), value: stats.complete, icon: Check, color: 'text-green-600', bg: 'bg-green-50', border: 'hover:border-green-400' },
  { label: t('stats.missing'), value: stats.missing, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', border: 'hover:border-orange-400' },
  { label: t('stats.late'), value: stats.late, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'hover:border-red-400' },
  { label: t('stats.to_correct'), value: stats.toCorrect, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'hover:border-red-400' }
].map((item, idx) => (
  <motion.div 
    key={idx} 
    whileHover={{ y: -5, scale: 1.02 }}
    className={`bg-white/70 backdrop-blur-md p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col h-44 transition-all ${item.border} hover:shadow-xl hover:shadow-slate-200/50 cursor-default`}
  >
    <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-xl flex items-center justify-center mb-4 shrink-0 shadow-inner`}>
      <item.icon className="w-5 h-5" />
    </div>
    <div className="flex flex-col flex-grow justify-start">
      <div className="text-3xl font-black text-slate-900 leading-none mb-2">{item.value}</div>
      <div className="text-[11px] leading-snug text-slate-500 font-bold uppercase tracking-tight break-words">
        {item.label}
      </div>
    </div>
  </motion.div>
))}
        </div>

        {/* Prawa strona: Historia zdarzeń (Pełna treść bez ucinania) */}
        <div className="w-full lg:w-1/4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col h-[450px]">
          <div className="flex items-center gap-2 mb-4 text-slate-900 font-bold shrink-0">
            <History className="w-5 h-5 text-blue-600" />
            <span>{t('stats.history')}</span>
          </div>
          <div className="space-y-4 overflow-y-auto pr-2 scrollbar-hide">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                {t('activities.no_activities')}
              </p>
            ) : (
              // Filtracja duplikatów: jeśli ten sam klient dodał to samo w tym samym czasie
              activities
  .filter((v, i, a) => a.findIndex(t => t.timestamp === v.timestamp && t.clientName === v.clientName) === i)
  .map(activity => (
    <div key={activity.id} className="text-xs border-l-2 border-blue-500/30 pl-4 py-2 bg-slate-50/50 rounded-r-xl group hover:border-blue-500 transition-all">
      <div className="font-bold text-slate-800 mb-1">{activity.clientName}</div>
      <div className="text-slate-600 leading-relaxed break-words">
        {(() => {
          // 1. Obsługa typu akcji (lewa strona dwukropka)
          // 1. Obsługa typu akcji (lewa strona dwukropka)
const actionLabel = (() => {
  if (activity.action === 'common.all' || activity.action === 'System') {
    return t('activities.system_action', { defaultValue: 'System' });
  }
  return activity.action.includes('.') ? t(activity.action) : activity.action;
})();
          
          // 2. Obsługa detali (prawa strona dwukropka)
          let detailContent = activity.detail;
          
          if (activity.detail.includes('|')) {
            // Obsługa formatu: klucz|wartość
            const [key, val] = activity.detail.split('|');
            detailContent = t(key, { name: val, fileName: val });
          } else if (activity.detail.includes('.')) {
            // Jeśli to nazwa pliku (np. image.jpg), nie próbujemy jej tłumaczyć jako klucza
            // Chyba że to jawny klucz zaczynający się od "activities." lub "status."
            if (activity.detail.startsWith('activities.') || activity.detail.startsWith('status.')) {
              detailContent = t(activity.detail);
            } else {
              // To jest nazwa pliku - dodajemy przedrostek "Przesłano:"
              detailContent = `${t('activities.file_label', { defaultValue: 'Plik' })}: ${activity.detail}`;
            }
          }

          return (
            <>
              <span className="font-medium text-blue-600/70">{actionLabel}:</span>{' '}
              <span className="text-slate-500">{detailContent}</span>
            </>
          );
        })()}
      </div>
      <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 font-medium italic">
        <Clock className="w-3 h-3" />
        {activity.timestamp && !isNaN(Date.parse(activity.timestamp)) 
          ? new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : t('common.just_now', { defaultValue: 'Właśnie teraz' })}
      </div>
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
                <th className="px-8 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider">{t('table.client')}</th>
                <th className="px-6 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider">{t('table.doc_statuses')}</th>
                <th className="px-8 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider text-right">{t('table.actions')}</th>
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
              {t(`months.${client.month.toLowerCase().replace(/ /g, '_')}`)}
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <Tooltip text={t('tooltips.drive')}>
            <a 
              href={`https://drive.google.com/drive/search?q=${encodeURIComponent(client.name)}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-500 hover:text-blue-700 transition-colors"
              >
            <Folder className="w-3 h-3" />
              {t('common.drive')}
              </a>
              </Tooltip>
            </div>
          </div>
        </div>
      </td>
      
      {/* KOLUMNA STATUSÓW */}
<td className="px-4 py-3 lg:px-6 lg:py-6 block lg:table-cell">
  <div className="flex flex-wrap gap-1.5 lg:gap-2">
    {client.documents.map((doc) => (
      <div key={doc.id} className="relative">
        
        <Tooltip text={`${t('tooltips.status_info')}: ${doc.files.length > 0 ? t('tooltips.files_uploaded') : t('tooltips.no_files')}`}>
  <button 
    onClick={() => doc.status === 'W toku' ? setViewingFilesDocId(viewingFilesDocId === `${client.id}-${doc.id}` ? null : `${client.id}-${doc.id}`) : null}
    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] lg:text-[11px] font-bold uppercase tracking-tight border transition-all ${STATUS_COLORS[doc.status]} ${doc.status === 'W toku' ? 'cursor-pointer hover:shadow-sm' : 'cursor-default'}`}
  >
    {/* POPRAWIONA LINIA PONIŻEJ: czyści polskie znaki i spacje */}
    {t(`labels.${doc.label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ /g, '_')}`)}
    
    {doc.files.length > 0 && <span className="bg-white/30 px-1 rounded-sm text-[9px]">{doc.files.length}</span>}
    {doc.status === 'W toku' && <ChevronDown className={`w-3 h-3 ${viewingFilesDocId === `${client.id}-${doc.id}` ? 'rotate-180' : ''}`} />}
  </button>
</Tooltip>
      </div>
    ))}
  </div>
</td>

      {/* KOLUMNA AKCJI */}
      <td className="px-4 py-2 lg:px-8 lg:py-6 block lg:table-cell">
        <div className="flex items-center justify-between lg:justify-end gap-1 sm:gap-2">
          {/* Narzędzia pomocnicze */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <Tooltip text={t('tooltips.lock')}>
  <button
    onClick={() => toggleLockClient(client.id)}
    className={`p-2 rounded-xl transition-all ${client.locked ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:bg-blue-50'}`}
  >
    {client.locked ? <Lock className="w-4 h-4 lg:w-5 lg:h-5" /> : <Unlock className="w-4 h-4 lg:w-5 lg:h-5" />}
  </button>
</Tooltip>

            <Tooltip text={t('tooltips.settings')}>
  <button
    onClick={() => setEditingClientId(client.id)}
    className="p-2 text-slate-400 hover:bg-blue-50 rounded-xl transition-all"
  >
    <Settings2 className="w-4 h-4 lg:w-5 lg:h-5" />
  </button>
</Tooltip>

            <Tooltip text={t('tooltips.client_view')}>
  <Link 
    to={`/client/${client.id}`}
    className="p-2 text-slate-400 hover:bg-blue-50 rounded-xl transition-all"
  >
    <ExternalLink className="w-4 h-4 lg:w-5 lg:h-5" />
  </Link>
</Tooltip>
          </div>

          {/* Główny przycisk Nudge */}
          <Tooltip text={t('tooltips.nudge')}>
  <button
    onClick={() => handleNudge(client)}
    className={`flex items-center gap-2 px-3 py-1.5 lg:px-4 lg:py-2 rounded-xl text-xs lg:text-sm font-bold transition-all shrink-0 ${
      copiedId === client.id 
        ? 'bg-green-500 text-white shadow-lg shadow-green-200' 
        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
    }`}
  >
    {copiedId === client.id ? (
      <><Check className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> <span className="hidden xs:inline">{t('actions.sent')}</span></>
    ) : (
      <><Bell className="w-3.5 h-3.5 lg:w-4 lg:h-4" />{t('actions.send')}</>
    )}
  </button>
</Tooltip>
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
            <p className="text-slate-500 text-lg">{t('common.no_results')}</p>
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
                  <h3 className="text-2xl font-bold text-slate-900">{t('modal.edit_title')}</h3>
                  <button onClick={() => setEditingClientId(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>
                
                <p className="text-slate-500 mb-6 font-medium">{editingClient.name}</p>

                <div className="space-y-3 mb-8 max-h-[300px] overflow-y-auto pr-2">
  {editingClient.documents.map(doc => (
    <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
      <span className="font-semibold text-slate-700">
        {/* POPRAWKA: Tłumaczenie dynamiczne etykiet wewnątrz modala */}
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
      </span>
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
    /* POPRAWKA: Usunięty cudzysłów, zostawiamy same klamry */
    placeholder={t('actions.new_doc_placeholder')} 
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
            <Tooltip text={t('tooltips.export')}>
  <button 
    onClick={() => alert('Symulacja eksportu do Excel (.xlsx)...')}
    className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-bold hover:bg-emerald-100 transition-all shadow-sm w-full sm:w-auto"
  >
    <Download className="w-5 h-5" />
    {t('common.export')}
  </button>
</Tooltip>
          </div>

          <div className="w-full overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
  <tr className="hidden lg:table-row bg-slate-50/50 border-b border-slate-100">
    <th className="px-8 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider">
      {t('table.client')}
    </th>
    <th className="px-6 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider">
      {t('table.doc_statuses')}
    </th>
    <th className="px-8 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider text-right">
      {t('table.actions')}
    </th>
  </tr>
</thead>
              <tbody className="divide-y divide-slate-100 block lg:table-row-group w-full">
  {ocrRecords.length === 0 ? (
    <tr className="block lg:table-row w-full">
      <td colSpan={5} className="py-20 text-center text-slate-400 block lg:table-cell font-medium italic w-full">
        <div className="flex flex-col items-center gap-3 w-full">
          <Search className="w-10 h-10 opacity-20" />
          <p>{t('ocr.waiting_msg')}</p>
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
        {/* 1. KLIENT I NUMER */}
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

        {/* 2. DANE DOKUMENTU */}
        <td className="w-full py-4 lg:py-6 lg:px-6 block lg:table-cell border-t lg:border-none mt-2 lg:mt-0">
          {record.status !== 'Oczekiwanie' && (
            <div className="w-full grid grid-cols-1 gap-4">
              <div className="w-full">
                <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">
                  {t('ocr.doc_type')}:
                </div>
                <div className="text-sm text-slate-700 font-bold">
                  {/* Tłumaczenie typu dokumentu (Faktura/ZUS itd.) */}
                  {t(`labels.${record.documentType.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '_')}`)}
                </div>
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

        {/* 3. KWOTY I STATUS */}
        <td className="w-full py-4 lg:py-6 lg:px-8 block lg:table-cell">
          <div className="w-full flex flex-col lg:items-end gap-4">
            {record.status !== 'Oczekiwanie' && (
              <div className="w-full lg:w-48 bg-slate-50 p-4 rounded-2xl flex justify-between items-center lg:block lg:text-right border border-slate-100">
                <div className="lg:hidden text-[10px] text-slate-400 font-black uppercase">{t('ocr.value')}:</div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">
                    {record.netAmount.toLocaleString()} {i18n.language === 'en' ? '€' : 'zł'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold">
                    {t('ocr.vat')}: {record.vatAmount.toLocaleString()} {i18n.language === 'en' ? '€' : 'zł'}
                  </div>
                  <div className="text-base font-black text-blue-600 mt-1">
                    {record.grossAmount.toLocaleString()} {i18n.language === 'en' ? '€' : 'zł'}
                  </div>
                </div>
              </div>
            )}

            <div className="w-full lg:w-auto">
              {record.status === 'Oczekiwanie' ? (
                <Tooltip text={t('tooltips.ocr_analyze')}>
  <button 
    onClick={() => analyzeDocument(record.id)}
    className="w-full px-8 py-4 lg:py-2.5 bg-indigo-600 text-white rounded-2xl lg:rounded-xl font-black text-sm lg:text-xs hover:bg-indigo-700 transition-all shadow-lg uppercase tracking-wider"
  >
    <Search className="w-5 h-5 lg:w-4 lg:h-4 mr-2 inline" /> {t('ocr.analyze_btn')}
  </button>
</Tooltip>
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
                    {t(`status.${record.status.toLowerCase().replace(/ /g, '_')}`).toUpperCase()}
                  </button>
                  {record.status === 'Odrzucone' && (
                    <Tooltip text={t('tooltips.ocr_smart_nudge')}>
                  <button 
                  onClick={() => handleSmartNudge(record)}
                  className="py-2 px-4 text-[10px] text-blue-600 font-black bg-blue-50/50 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors w-full lg:w-auto"
                  >
                <Bell className="w-3.5 h-3.5" /> {t('ocr.smart_nudge')}
                </button>
                </Tooltip>
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
            <h3 className="text-xl font-bold text-slate-900">{t('ocr.preview_title')}</h3>
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
              alt={t('ocr.preview_title')} 
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px]">
              <div className="p-4 bg-white rounded-2xl shadow-xl flex flex-col items-center gap-3">
                <FileText className="w-12 h-12 text-blue-500" />
                <p className="font-bold text-slate-900">{t('ocr.simulation_title')}</p>
                <div className="text-xs text-slate-500 text-center space-y-1">
                  <p>{t('ocr.file')}: {previewDoc.fileName}</p>
                  <p>{t('ocr.size')}: 1.2 MB</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            onClick={() => {
              updateOCRStatus(previewDoc.id, 'Odrzucone');
              
              addActivity(
                'Agent AI', 
                'System', 
                `${t('status.rejected')}: ${previewDoc.clientName}`
              );

              toast.error(t('ocr.toast_rejected_msg'), {
                icon: '📩'
              });

              setPreviewDoc(null);
            }}
            className="px-6 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold hover:bg-red-100 transition-all"
          >
            {t('ocr.reject_btn')}
          </button>
          <button 
            onClick={() => {
              updateOCRStatus(previewDoc.id, 'Zweryfikowano');
              setPreviewDoc(null);
            }}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            {t('ocr.approve_btn')}
          </button>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>

      <footer className="mt-12 text-center text-slate-400 text-sm">
        &copy; ArtWebCraft 2026 | {t('footer.system_name')} - {t('footer.system_description')}
      </footer>
    </div>

<AnimatePresence>
  {showWelcome && (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 overflow-hidden"
    >
      {/* Dynamiczne tło Aurora w ruchu */}
      <div className="absolute inset-0 bg-[#0f172a]" />
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{ duration: 20, repeat: Infinity }}
        className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-blue-600/30 rounded-full blur-[120px]"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          rotate: [0, -90, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, delay: 2 }}
        className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px]"
      />

      <motion.div 
        initial={{ y: 50, opacity: 0, scale: 0.8, rotateX: 20 }}
        animate={{ y: 0, opacity: 1, scale: 1, rotateX: 0 }}
        exit={{ y: -50, opacity: 0, scale: 1.1 }}
        transition={{ type: "spring", damping: 20 }}
        className="relative max-w-2xl w-full bg-white/10 backdrop-blur-[40px] p-12 rounded-[4rem] shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/20 text-center"
        style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
      >
        {/* Pływający element 3D (Ikona) */}
        <motion.div 
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-[0_20px_50px_rgba(37,99,235,0.4)] border border-white/30"
        >
          <div className="text-4xl">🚀</div>
        </motion.div>
        
        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
          Witaj w <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Przyszłości Księgowości</span>
        </h2>
        
        <div className="space-y-6 text-blue-100/80 text-lg leading-relaxed mb-10">
          <p>
            Właśnie uruchomiłeś wersję demonstracyjną <span className="text-white font-bold text-xl uppercase tracking-widest">Brakomatu</span>.
          </p>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-sm text-left italic">
            <span className="text-blue-400 font-bold">Info:</span> W pełnej wersji systemu, w tym miejscu znajduje się bezpieczny 
            panel logowania z weryfikacją biometryczną, oddzielny dla Twojej Kancelarii oraz dedykowany Twoim Klientom.
          </div>
          <p className="text-base">
            Przygotowaliśmy dla Ciebie symulację realnych procesów: automatyczne monity, analizę OCR AI oraz inteligentne blokady okresów.
          </p>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleFinalClose} // <--- TO MUSI BYĆ TA NAZWA
          className="group relative px-12 py-5 bg-blue-600 text-white rounded-full font-black text-xl shadow-xl"
        >
          URUCHOM SILNIK DEMO
        </motion.button>

        <p className="mt-8 text-[10px] text-white/30 uppercase tracking-[0.3em]">
          Powered by ArtWebCraft AI Engine 2026
        </p>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

</div>
);
}