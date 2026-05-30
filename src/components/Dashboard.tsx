import React, { useEffect, useState } from 'react';
import { Client, STATUS_COLORS, DocumentStatus, OCRRecord } from '../types';
// DODANE IKONY: FileText, Download, X (były już w Twoim kodzie, ale upewniam się, że są użyte)
import { Bell, Copy, Check, ExternalLink, Search, Settings2, Plus, Trash2, X, Users, Clock, AlertTriangle, Folder, Lock, Unlock, History, ChevronDown, Download, Eye, FileText, Info, Zap, MessageSquare, Users2, Archive, BarChart3, ShieldCheck, ChevronRight, Sparkles, Paperclip } from 'lucide-react';
import LeadModal from './LeadModal';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'late' | 'missing' | 'correction' | 'locked'>('all');
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [newDocLabel, setNewDocLabel] = useState('');
  const [viewingFilesDocId, setViewingFilesDocId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<OCRRecord | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [approvedFiles, setApprovedFiles] = useState<Set<string>>(new Set());
  const [rejectedFiles, setRejectedFiles] = useState<Set<string>>(new Set());
  const [addedScans, setAddedScans] = useState<Record<string, string[]>>({});
  const [verifyingClientId, setVerifyingClientId] = useState<string | null>(null);

  useEffect(() => {
    const isDone = sessionStorage.getItem('brakomat_done');
    if (!isDone) {
      setShowWelcome(true);
    }
  }, []);

  const handleFinalClose = () => {
    sessionStorage.setItem('brakomat_done', 'true');
    setShowWelcome(false);
  };


  const handleNudge = async (client: any) => {
    const aiMessage = t('ai.nudge_msg', { name: client.name });
    setCopiedId(client.id);
    try {
      if (typeof addActivity === 'function') {
        addActivity(
          'Agent AI', 
          'ai.nudge_type_system', 
          `activities.nudge_sent_to|${client.name}`
        );
      }
    } catch (e) {
      console.error("Błąd przy dodawaniu aktywności:", e);
    }
    
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

    try {
      const webhookUrl = 'https://n8n.srv1151721.hstgr.cloud/webhook-test/smart-nudge'; 
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          clientName: client.name,
          action: 'nudge_clicked',
          timestamp: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.error('Problem z połączeniem z n8n:', error);
    }

    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAnalyzeDocument = (recordId: string) => {
    analyzeDocument(recordId);
  };

  const handleToggleLock = (clientId: string) => {
    toggleLockClient(clientId);
  };

  const editingClient = clients.find(c => c.id === editingClientId);

  const isFileApproved = (clientId: string, docId: string, idx: number, initialApproved?: boolean) => {
    const key = `${clientId}-${docId}-${idx}`;
    return (initialApproved && !rejectedFiles.has(key)) || approvedFiles.has(key);
  };
  const isFileRejected = (clientId: string, docId: string, idx: number) =>
    rejectedFiles.has(`${clientId}-${docId}-${idx}`);

  const toggleApproveFile = (key: string) => {
    setApprovedFiles(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
    setRejectedFiles(prev => { const n = new Set(prev); n.delete(key); return n; });
  };
  const toggleRejectFile = (key: string, fileName: string) => {
    const wasRejected = rejectedFiles.has(key);
    setRejectedFiles(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
    setApprovedFiles(prev => { const n = new Set(prev); n.delete(key); return n; });
    if (!wasRejected) toast(`Odrzucono: ${fileName} — klient zostanie powiadomiony`, { icon: '📩', duration: 2500 });
  };

  const handleAddScan = (clientId: string, docId: string, docLabel: string) => {
    const key = `${clientId}-${docId}`;
    const n = (addedScans[key]?.length ?? 0) + 1;
    const name = `skan_biuro_${new Date().toISOString().slice(5,10).replace('-','')}_${n}.pdf`;
    setAddedScans(prev => ({ ...prev, [key]: [...(prev[key] ?? []), name] }));
    toast.success(`Skan dodany do: ${docLabel} → kolejka OCR`, { icon: '📎' });
    addActivity('Biuro', 'Skan dodany', name);
  };

  const getDocFiles = (clientId: string, docId: string, baseFiles: {name: string; timestamp: string; isApproved?: boolean}[]) => {
    const extra = (addedScans[`${clientId}-${docId}`] ?? []).map(name => ({ name, timestamp: 'teraz', isApproved: false }));
    return [...baseFiles, ...extra];
  };

  const handleSmartNudge = (record: OCRRecord) => {
    const aiMessage = t('ai.beach_photo_msg');
    addActivity(
      'Agent AI', 
      t('ai.nudge_type_humor'), 
      t('activities.ai_nudge_sent', { msg: aiMessage, client: record.clientName })
    );

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
  };

 const stats = {
    total: clients.length,
    complete: clients.filter(c => c.documents.every(d => d.status === 'OK' || d.status === 'Zatwierdzone')).length,
    // SPÓŹNIONE: Klient ma przynajmniej jeden dokument "Spóźnione"
    late: clients.filter(c => c.documents.some(d => d.status === 'Spóźnione')).length,
    // BRAKUJĄCE: Klient nie ma spóźnień, ale ma przynajmniej jeden dokument "Brak"
    missing: clients.filter(c => 
      !c.documents.some(d => d.status === 'Spóźnione') && 
      c.documents.some(d => d.status === 'Brak')
    ).length,
    // DO POPRAWKI: Dokumenty odrzucone w OCR dla tego klienta
    toCorrect: clients.filter(c => ocrRecords.some(r => r.clientName === c.name && r.status === 'Odrzucone')).length
  };

  // Procent postępu: stosunek klientów zatwierdzonych (z kłódką) do wszystkich
  const progressPercent = stats.total > 0 
    ? Math.round((clients.filter(c => c.locked).length / stats.total) * 100) 
    : 0;

    const filters = [
  { id: 'all', label: t('stats.all'), icon: Users, activeClass: 'bg-blue-600 border-blue-600 shadow-blue-100' },
  { id: 'ready', label: t('stats.ready'), icon: Bell, activeClass: 'bg-indigo-600 border-indigo-600 shadow-indigo-100' },
  { id: 'late', label: t('stats.late'), icon: AlertTriangle, activeClass: 'bg-red-600 border-red-600 shadow-red-100' },
  { id: 'missing', label: t('stats.missing'), icon: Clock, activeClass: 'bg-orange-600 border-orange-600 shadow-orange-100' },
  { id: 'correction', label: t('stats.correction'), icon: AlertTriangle, activeClass: 'bg-rose-600 border-rose-600 shadow-rose-100' },
  { id: 'locked', label: t('stats.locked'), icon: Lock, activeClass: 'bg-emerald-600 border-emerald-600 shadow-emerald-100' }
];

  // Logika filtrowania (wykorzystuje statusFilter)
  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'ready') return matchesSearch && (c as any).isFinished && !c.locked;
    if (statusFilter === 'late') return matchesSearch && c.documents.some(d => d.status === 'Spóźnione');
    if (statusFilter === 'missing') return matchesSearch && !c.documents.some(d => d.status === 'Spóźnione') && c.documents.some(d => d.status === 'Brak');
    if (statusFilter === 'correction') return matchesSearch && ocrRecords.some(r => r.clientName === c.name && r.status === 'Odrzucone');
    if (statusFilter === 'locked') return matchesSearch && c.locked;
    
    return matchesSearch;
  });

   return (
    <>
    {/* DEMO BANNER — sticky, full-width */}
    <div className="sticky top-0 z-[100] bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white px-4 py-2.5 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2.5">
        <span className="bg-white/20 text-white text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md shrink-0">DEMO</span>
        <span className="text-xs font-medium text-blue-100 hidden sm:block">Wersja demonstracyjna — dane są fikcyjne. Odkryj pełne możliwości Brakomatu.</span>
        <span className="text-xs font-medium text-blue-100 sm:hidden">Wersja demonstracyjna</span>
      </div>
      <button
        onClick={() => setShowLeadModal(true)}
        className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-blue-700 rounded-lg font-black text-[11px] uppercase tracking-wider hover:bg-blue-50 transition-all shadow-sm whitespace-nowrap shrink-0"
      >
        <Sparkles className="w-3 h-3" />
        Chcę Brakomat →
      </button>
    </div>

    <div className="min-h-screen bg-[#F8FAFC] max-w-7xl mx-auto px-4 py-8">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">

      
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">{t('header.app_name')}</h1>
          <p className="text-slate-500 text-lg">{t('header.description')}</p>
          <div className="flex p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200/50 mt-6 mb-2">
            <button onClick={() => i18n.changeLanguage('pl')} className={`px-6 py-2 rounded-xl text-sm font-black transition-all duration-200 ${i18n.language === 'pl' ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}>PL</button>
            <button onClick={() => i18n.changeLanguage('en')} className={`px-6 py-2 rounded-xl text-sm font-black transition-all duration-200 ${i18n.language === 'en' ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}>EN</button>
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input type="text" placeholder={t('common.search_placeholder', { defaultValue: 'Search client...' })} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </header>



      
    {/* GŁÓWNY UKŁAD GÓRNY: STATYSTYKI + POWITANIE + HISTORIA */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 mb-10">
        
        {/* LEWA KOLUMNA: POWITANIE I KARTY (8 kolumn na desktop) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Nagłówek powitalny (Wypełniacz desktopowy) - JUŻ Z TRANSLACJĄ */}
<div className="hidden lg:flex items-end justify-between bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm overflow-hidden relative group">
    <div className="relative z-10">
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">
        {/* Dynamiczne powitanie zależne od godziny i języka */}
        {new Date().getHours() < 12 ? t('dashboard.welcome_morning') : t('dashboard.welcome_evening')}, 
        <span className="text-blue-600"> Admin</span>
      </h1>
      <p className="text-slate-500 font-medium mt-1">
        {t('dashboard.welcome_sub')}
      </p>
    </div>
    <div className="text-right relative z-10">
      <div className="text-4xl font-black text-slate-200 uppercase tracking-tighter tabular-nums leading-none">
        {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
      </div>
      <div className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] mt-1">
        {/* Dynamiczny format daty zależny od i18n.language */}
        {new Date().toLocaleDateString(i18n.language === 'pl' ? 'pl-PL' : 'en-US', {weekday: 'long', day: 'numeric', month: 'long'})}
      </div>
    </div>
    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-50 transition-opacity" />
</div>

          {/* GRID KART - Naprawiona szerokość i responsywność */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
            {[
  { id: 'all', label: t('stats.all'), value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', tip: t('tooltips_stats.all') },
  { id: 'ready', label: t('stats.complete'), value: stats.complete, icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-50', tip: t('tooltips_stats.ready') },
  { id: 'missing', label: t('stats.missing'), value: stats.missing, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', tip: t('tooltips_stats.missing') },
  { id: 'late', label: t('stats.late'), value: stats.late, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', tip: t('tooltips_stats.late') },
  { id: 'correction', label: t('stats.to_correct'), value: stats.toCorrect, icon: Info, color: 'text-rose-600', bg: 'bg-rose-50', tip: t('tooltips_stats.correction') }
].map((item) => (
  <Tooltip key={item.id} text={item.tip}>
    <motion.div
      whileHover={{ y: -4 }}
      onClick={() => setStatusFilter(item.id as any)}
      className={`cursor-pointer bg-white p-4 md:p-5 rounded-[2rem] border transition-all hover:shadow-md flex flex-col justify-between min-h-[120px] md:min-h-[150px] w-full ${
        statusFilter === item.id 
          ? 'border-blue-500 ring-2 ring-blue-500/10 shadow-lg shadow-blue-50' 
          : 'border-slate-100 shadow-sm'
      }`}
    >
      <div className={`p-2 rounded-xl w-fit ${item.bg} ${item.color}`}>
        <item.icon className="w-5 h-5 md:w-6 md:h-6" />
      </div>
      <div className="mt-4">
        <div className="text-2xl md:text-3xl font-black text-slate-900 leading-none">
          {item.value}
        </div>
        <div className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 leading-tight break-words">
          {item.label}
        </div>
      </div>
    </motion.div>
  </Tooltip>
))}
          </div>
        </div>

        {/* PRAWA KOLUMNA: HISTORIA - Naprawiona wysokość */}
        <div className="lg:col-span-4 h-full">
           <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm flex flex-col h-full lg:max-h-[350px]">
              <div className="flex items-center gap-3 mb-6 shrink-0">
                 <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><History className="w-5 h-5" /></div>
                 <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">{t('stats.history')}</h3>
              </div>
              
              {/* Tutaj dzieje się magia: overflow-y-auto sprawia, że lista się nie rozciąga */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar focus:outline-none">
                 {activities.length === 0 ? (
                   <p className="text-xs text-slate-400 italic">{t('activities.no_activities')}</p>
                 ) : (
                   activities.map((activity) => (
                    <div key={activity.id} className="text-[10px] md:text-[11px] border-l-2 border-blue-500/30 pl-3 py-2 bg-slate-50/50 rounded-r-xl group hover:border-blue-500 transition-all">
                       <div className="font-bold text-slate-800 leading-tight">{activity.clientName}</div>
                       <div className="text-slate-500 leading-snug mt-0.5">
                          {(() => {
                            const actionLabel = activity.action.includes('.') ? t(activity.action) : activity.action;
                            let detailContent = activity.detail;
                            
                            if (detailContent.includes('|')) {
                              const [key, val] = detailContent.split('|');
                              detailContent = t(key, { name: val, fileName: val });
                            } else if (detailContent.includes('.')) {
                              if (!detailContent.includes('activities.')) {
                                detailContent = `${t('activities.file_label', { defaultValue: 'Plik' })}: ${detailContent}`;
                              } else { detailContent = t(detailContent); }
                            } else if (detailContent.includes('labels.')) {
                              detailContent = t(detailContent);
                            }

                            return (
                              <>
                                <span className="font-semibold text-blue-600/80">{actionLabel}:</span>{' '}
                                <span className="opacity-90">{detailContent}</span>
                              </>
                            );
                          })()}
                       </div>
                       <div className="text-[9px] text-slate-400 mt-1 flex items-center gap-1 font-medium italic">
                          <Clock className="w-2.5 h-2.5" /> 
                          {t('common.just_now')}
                       </div>
                    </div>
                   ))
                 )}
              </div>
           </div>
        </div>
      </div>
      {/* SEKCJA POSTĘPU BIURA */}
      <div className="mb-10 bg-white/50 backdrop-blur-md rounded-[2.5rem] p-8 border border-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              {t('dashboard.progress_title') || 'Postęp księgowania'}
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              {t('dashboard.progress_subtitle', { count: stats.total - clients.filter(c => c.locked).length }) || `Pozostało ${stats.total - clients.filter(c => c.locked).length} firm do zamknięcia`}
            </p>
          </div>
          <div className="text-right">
            <span className="text-4xl font-black text-blue-600 italic">
              {progressPercent}%
            </span>
          </div>
        </div>
        
        {/* Główny pasek postępu */}
        <div className="h-4 w-full bg-slate-200/50 rounded-full overflow-hidden p-1 border border-slate-100 shadow-inner">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"
          />
        </div>

        {/* Małe znaczniki pod paskiem */}
        <div className="flex justify-between mt-3 px-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Start</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter text-center flex-1 mx-2 border-x border-slate-200">
            {t('dashboard.work_in_progress') || 'W trakcie'}
          </span>
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Finał</span>
        </div>
      </div>
{/* KONTENER NAD TABELĄ */}
<div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 px-4">
  
  {/* LEWA: Przyciski Filtrów */}
  <div className="flex flex-wrap gap-2">
    {filters.map((f) => (
      <button
        key={f.id}
        onClick={() => setStatusFilter(f.id as any)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border ${
          statusFilter === f.id 
            ? `${f.activeClass} text-white shadow-lg` 
            : 'bg-white text-slate-500 border-slate-100 hover:border-blue-400 shadow-sm'
        }`}
      >
        <f.icon className="w-3.5 h-3.5" />
        {f.label}
        {statusFilter === f.id && (
           <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-[9px]">{filteredClients.length}</span>
        )}
      </button>
    ))}
    {statusFilter !== 'all' && (
      <button onClick={() => setStatusFilter('all')} className="text-[10px] font-black text-slate-400 hover:text-red-500 px-2 uppercase">
        Wyczyść
      </button>
    )}
  </div>

  {/* PRAWA: Czarny Przycisk Nudge All */}
  <motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  onClick={() => {
    // Nudge wysyłamy do WSZYSTKICH spóźnionych, nie tylko tych przefiltrowanych
    const clientsWithLateDocs = clients.filter(c => 
      c.documents.some(d => d.status === 'Spóźnione')
    );
    
    if (clientsWithLateDocs.length > 0) {
      clientsWithLateDocs.forEach(c => handleNudge(c));
      toast.success(`${t('ai.nudge_sent')}: ${clientsWithLateDocs.length}`);
    } else {
      toast.error("Brak spóźnionych klientów");
    }
  }}
  className="flex items-center gap-3 px-6 py-3 bg-[#1e293b] text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] shadow-xl hover:bg-slate-800 transition-all border border-slate-700"
>
  <Bell className="w-4 h-4 text-yellow-400 animate-pulse" />
  <span>
    {t('ai.nudge_all')} ({stats.late})
  </span>
</motion.button>
</div>
      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto lg:overflow-visible">
          <table className="w-full text-left border-collapse">
            <thead className="hidden lg:table-header-group bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider">{t('table.client')}</th>
                <th className="px-6 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider">{t('table.doc_statuses')}</th>
                <th className="px-8 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider text-right">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 block lg:table-row-group">
              {filteredClients.map((client) => (
                <motion.tr key={client.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex flex-col lg:table-row transition-colors p-4 lg:p-0 border-b lg:border-none ${client.locked ? 'bg-emerald-50/30' : 'hover:bg-slate-50/30'}`}>
                  <td className="px-4 py-2 lg:px-8 lg:py-6 block lg:table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center text-slate-500 shrink-0"><Users className="w-5 h-5" /></div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-base lg:text-lg flex items-center gap-2 flex-wrap">
                          <span className="truncate">{client.name}</span>
                          {(client as any).isFinished && !client.locked && (
                            <motion.div initial={{ scale: 0.9 }} animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200">
                              <Bell className="w-3 h-3 fill-white" /> {t('status.client_finished', { defaultValue: 'KLIENT SKOŃCZYŁ' })}
                            </motion.div>
                          )}
                          {client.locked && (<div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm"><Check className="w-3 h-3 stroke-[3px]" /> {t('status.ready', { defaultValue: 'GOTOWE' })}</div>)}
                          {client.locked && <Lock className="w-4 h-4 text-emerald-600 shrink-0" />}
                        </div>
                        <div className="text-xs lg:text-sm text-slate-400 font-medium flex items-center gap-2">
                          {t(`months.${client.month.toLowerCase().replace(/ /g, '_')}`)}
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <Tooltip text={t('tooltips.drive')}><a href={`https://drive.google.com/drive/search?q=${encodeURIComponent(client.name)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:text-blue-700 transition-colors"><Folder className="w-3 h-3" />{t('common.drive')}</a></Tooltip>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  {/* --- POPRAWIONA KOLUMNA STATUSÓW Z PODGLĄDEM PLIKÓW --- */}
                  <td className="px-4 py-3 lg:px-6 lg:py-6 block lg:table-cell">
                    <div className="flex flex-wrap gap-1.5 lg:gap-2">
                      {client.documents.map((doc) => (
                        <div key={doc.id} className="relative">
                          <Tooltip text={`${t('tooltips.status_info')}: ${doc.files.length > 0 ? t('tooltips.files_uploaded') : t('tooltips.no_files')}`}>
<button 
  onClick={() => {
    const uniqueId = `${client.id}-${doc.id}`;
    setViewingFilesDocId(viewingFilesDocId === uniqueId ? null : uniqueId);
  }}
  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight border transition-all ${STATUS_COLORS[doc.status] || 'bg-slate-50 text-slate-400 border-slate-100'}`}
>
  {(() => {
    // 1. Przygotowujemy techniczny klucz (małe litery, bez spacji)
    const technicalKey = doc.label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ /g, '_');
    const translationKey = `labels.${technicalKey}`;
    
    // 2. Sprawdzamy czy tłumaczenie istnieje w i18n
    const translated = t(translationKey);
    
    // 3. Jeśli t() zwróciło klucz (czyli brak tłumaczenia), pokazujemy oryginalny label
    return translated === translationKey ? doc.label : translated;
  })()}
  
  {doc.files.length > 0 && <span className="bg-white/30 px-1 rounded-sm text-[9px]">{doc.files.length}</span>}
</button>
                          </Tooltip>

                          {/* SZKLANY PANEL PODGLĄDU PLIKÓW */}
                          <AnimatePresence>
                            {viewingFilesDocId === `${client.id}-${doc.id}` && (() => {
                              const allFiles = getDocFiles(client.id, doc.id, doc.files);
                              return (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 5 }} exit={{ opacity: 0, y: -10 }}
                                className="absolute left-0 top-full z-[50] mt-2 w-72 bg-white/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 p-3"
                              >
                                <div className="flex items-center justify-between mb-3 px-1">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pliki ({allFiles.length})</span>
                                  <button onClick={() => setViewingFilesDocId(null)} className="text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>
                                </div>

                                {allFiles.length === 0 ? (
                                  <div className="py-4 text-center">
                                    <p className="text-[11px] text-slate-400 font-medium">Brak przesłanych plików</p>
                                    <p className="text-[10px] text-slate-300 mt-0.5">Klient przesyła przez portal</p>
                                  </div>
                                ) : (
                                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                                    {allFiles.map((file, fIdx) => {
                                      const key = `${client.id}-${doc.id}-${fIdx}`;
                                      const approved = isFileApproved(client.id, doc.id, fIdx, file.isApproved);
                                      const rejected = isFileRejected(client.id, doc.id, fIdx);
                                      return (
                                        <div key={fIdx} className={`flex items-center justify-between p-2 rounded-xl border transition-colors ${approved ? 'bg-emerald-50/70 border-emerald-100' : rejected ? 'bg-red-50/70 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <FileText className={`w-3.5 h-3.5 shrink-0 ${approved ? 'text-emerald-500' : rejected ? 'text-red-400' : 'text-blue-500'}`} />
                                            <div className="min-w-0">
                                              <span className="text-[11px] font-bold text-slate-700 truncate block w-28">{file.name}</span>
                                              {file.timestamp && <span className="text-[9px] text-slate-400">{file.timestamp}</span>}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-0.5 shrink-0">
                                            <button onClick={() => toggleApproveFile(key)} title="Zatwierdź" className={`p-1.5 rounded-lg transition-all ${approved ? 'bg-emerald-100 text-emerald-600' : 'text-slate-300 hover:text-emerald-500 hover:bg-emerald-50'}`}>
                                              <Check className="w-3 h-3" />
                                            </button>
                                            <button onClick={() => toggleRejectFile(key, file.name)} title="Odrzuć" className={`p-1.5 rounded-lg transition-all ${rejected ? 'bg-red-100 text-red-500' : 'text-slate-300 hover:text-red-400 hover:bg-red-50'}`}>
                                              <X className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                <div className="mt-2.5 pt-2.5 border-t border-slate-100">
                                  <button
                                    onClick={() => handleAddScan(client.id, doc.id, doc.label)}
                                    className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-[11px] font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                                  >
                                    <Paperclip className="w-3 h-3" /> Dodaj skan
                                  </button>
                                </div>
                              </motion.div>
                              );
                            })()}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="px-4 py-2 lg:px-8 lg:py-6 block lg:table-cell">
                    <div className="flex items-center justify-between lg:justify-end gap-1 sm:gap-2">
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        <Tooltip text={t('tooltips.lock')}><button onClick={() => handleToggleLock(client.id)} className={`p-2 rounded-xl transition-all ${client.locked ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:bg-blue-50'}`}>{client.locked ? <Lock className="w-4 h-4 lg:w-5 lg:h-5" /> : <Unlock className="w-4 h-4 lg:w-5 lg:h-5" />}</button></Tooltip>
                        <Tooltip text={t('tooltips.settings')}><button onClick={() => setEditingClientId(client.id)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all"><Settings2 className="w-4 h-4 lg:w-5 lg:h-5" /></button></Tooltip>
                        <Tooltip text="Weryfikuj dokumenty klienta"><button onClick={() => setVerifyingClientId(client.id)} className="p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all"><Eye className="w-4 h-4 lg:w-5 lg:h-5" /></button></Tooltip>
                        <Tooltip text={t('tooltips.client_view')}><button onClick={() => toast('Portal klienta — w pełnej wersji klient loguje się przez dedykowany link 🔗', { icon: '👤', duration: 3000 })} className="p-2 text-slate-400 hover:bg-blue-50 rounded-xl transition-all"><ExternalLink className="w-4 h-4 lg:w-5 lg:h-5" /></button></Tooltip>
                      </div>
                      <Tooltip text={t('tooltips.nudge')}><button onClick={() => handleNudge(client)} className={`flex items-center gap-2 px-3 py-1.5 lg:px-4 lg:py-2 rounded-xl text-xs lg:text-sm font-bold transition-all shrink-0 ${copiedId === client.id ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>{copiedId === client.id ? (<><Check className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> <span className="hidden xs:inline">{t('actions.sent')}</span></>) : (<><Bell className="w-3.5 h-3.5 lg:w-4 lg:h-4" />{t('actions.send')}</>)}</button></Tooltip>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      

      {/* Edit List Modal */}
      <AnimatePresence>
        {editingClientId && editingClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingClientId(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-slate-900">{t('modal.edit_title')}</h3>
                  <button onClick={() => setEditingClientId(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
                </div>
                <p className="text-slate-500 mb-6 font-medium">{editingClient.name}</p>
                <div className="space-y-3 mb-8 max-h-[300px] overflow-y-auto pr-2">
                  {editingClient.documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="font-semibold text-slate-700">{(() => { const labelMap: { [key: string]: string } = { 'Faktury Kosztowe': 'faktury_kosztowe', 'Faktury Przychodowe': 'faktury_przychodowe', 'Wyciągi': 'wyciagi', 'ZUS': 'zus', 'Kadry': 'kadry' }; const key = labelMap[doc.label] || doc.label.toLowerCase().replace(/ /g, '_'); return t(`labels.${key}`); })()}</span>
                      <button onClick={() => removeDocument(editingClient.id, doc.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder={t('actions.new_doc_placeholder')} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" value={newDocLabel} onChange={(e) => setNewDocLabel(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && newDocLabel.trim()) { addDocument(editingClient.id, newDocLabel.trim()); setNewDocLabel(''); } }} />
                  <button onClick={() => { if (newDocLabel.trim()) { addDocument(editingClient.id, newDocLabel.trim()); setNewDocLabel(''); } }} className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"><Plus className="w-6 h-6" /></button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* MODAL WERYFIKACJI DOKUMENTÓW */}
      <AnimatePresence>
        {verifyingClientId && (() => {
          const vClient = clients.find(c => c.id === verifyingClientId);
          if (!vClient) return null;
          const totalFiles = vClient.documents.reduce((sum, d) => sum + getDocFiles(vClient.id, d.id, d.files).length, 0);
          const totalApproved = vClient.documents.reduce((sum, d) =>
            sum + getDocFiles(vClient.id, d.id, d.files).filter((f, idx) => isFileApproved(vClient.id, d.id, idx, f.isApproved)).length, 0);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setVerifyingClientId(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{vClient.name}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">Weryfikacja dokumentów • {vClient.month} • <span className="font-semibold text-blue-600">{totalApproved}/{totalFiles} zatwierdzonych</span></p>
                  </div>
                  <button onClick={() => setVerifyingClientId(null)} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-600 shadow-sm"><X className="w-5 h-5" /></button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                  {vClient.documents.map(doc => {
                    const allFiles = getDocFiles(vClient.id, doc.id, doc.files);
                    const appCount = allFiles.filter((f, i) => isFileApproved(vClient.id, doc.id, i, f.isApproved)).length;
                    return (
                      <div key={doc.id}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4 text-slate-400" />
                            <span className="font-bold text-slate-800 text-sm">{doc.label}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${STATUS_COLORS[doc.status] || 'bg-slate-50 text-slate-400 border-slate-100'}`}>{doc.status}</span>
                          </div>
                          {allFiles.length > 0 && (
                            <span className="text-[10px] text-slate-400 font-medium">{appCount}/{allFiles.length} zatw.</span>
                          )}
                        </div>
                        {allFiles.length === 0 ? (
                          <p className="text-[11px] text-slate-300 italic pl-6 py-2">Brak przesłanych plików</p>
                        ) : (
                          <div className="space-y-2 pl-6">
                            {allFiles.map((file, fIdx) => {
                              const key = `${vClient.id}-${doc.id}-${fIdx}`;
                              const approved = isFileApproved(vClient.id, doc.id, fIdx, file.isApproved);
                              const rejected = isFileRejected(vClient.id, doc.id, fIdx);
                              return (
                                <div key={fIdx} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${approved ? 'bg-emerald-50 border-emerald-100' : rejected ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100 hover:bg-blue-50/30'}`}>
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <FileText className={`w-4 h-4 shrink-0 ${approved ? 'text-emerald-500' : rejected ? 'text-red-400' : 'text-blue-500'}`} />
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
                                      {file.timestamp && <p className="text-[10px] text-slate-400">{file.timestamp}</p>}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0 ml-3">
                                    <button onClick={() => toast('Podgląd — w pełnej wersji otwiera oryginalny plik', { icon: '👁', duration: 2000 })} className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all">
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => toggleApproveFile(key)} title="Zatwierdź" className={`p-1.5 rounded-lg transition-all ${approved ? 'bg-emerald-100 text-emerald-600' : 'text-slate-300 hover:text-emerald-500 hover:bg-emerald-50'}`}>
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => toggleRejectFile(key, file.name)} title="Odrzuć" className={`p-1.5 rounded-lg transition-all ${rejected ? 'bg-red-100 text-red-500' : 'text-slate-300 hover:text-red-400 hover:bg-red-50'}`}>
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-100 bg-slate-50/50 shrink-0 flex items-center justify-between">
                  <p className="text-[11px] text-slate-400">✓ Zatwierdź — ✕ Odrzuć i powiadom klienta</p>
                  <button onClick={() => setVerifyingClientId(null)} className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 text-sm">
                    Zamknij
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      <div className="w-full mt-12 px-0">
        <div className={`w-full bg-white rounded-[2rem] p-4 lg:p-8 shadow-sm border border-slate-100 mb-12 transition-all duration-500 ${subscriptionTier === '1' ? 'opacity-40 pointer-events-none select-none blur-[2px]' : ''}`}>
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0"><FileText className="w-7 h-7" /></div>
              <div><h2 className="text-2xl font-bold text-slate-900">{t('dashboard.title')}</h2><p className="text-slate-500">{t('dashboard.subtitle')}</p></div>
            </div>
            <Tooltip text={t('tooltips.export')}><button onClick={() => toast('Eksport Excel — w pełnej wersji generuje arkusz ze wszystkimi danymi OCR 📊', { icon: '📥', duration: 3000 })} className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-bold hover:bg-emerald-100 transition-all shadow-sm w-full sm:w-auto"><Download className="w-5 h-5" />{t('common.export')}</button></Tooltip>
          </div>

          <div className="w-full overflow-hidden">
            <table className="w-full border-collapse">
              <thead><tr className="hidden lg:table-row bg-slate-50/50 border-b border-slate-100"><th className="px-8 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider">{t('table.client')}</th><th className="px-6 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider">{t('table.doc_statuses')}</th><th className="px-8 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider text-right">{t('table.actions')}</th></tr></thead>
              <tbody className="divide-y divide-slate-100 block lg:table-row-group w-full">
                {ocrRecords.length === 0 ? (<tr className="block lg:table-row w-full"><td colSpan={5} className="py-20 text-center text-slate-400 block lg:table-cell font-medium italic w-full"><div className="flex flex-col items-center gap-3 w-full"><Search className="w-10 h-10 opacity-20" /><p>{t('ocr.waiting_msg')}</p></div></td></tr>) : (
                  ocrRecords.map((record) => (
                    <motion.tr key={record.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col lg:table-row bg-white hover:bg-slate-50/50 transition-colors p-5 lg:p-0 mb-6 lg:mb-0 border lg:border-none rounded-[2rem] lg:rounded-none shadow-sm lg:shadow-none min-w-full">
                      <td className="w-full py-2 lg:py-6 lg:px-6 block lg:table-cell"><div className="w-full flex justify-between items-start lg:block"><div className="w-full"><div className="font-black text-slate-900 text-lg lg:text-base leading-tight break-words">{record.clientName}</div>{record.status !== 'Oczekiwanie' && (<button onClick={() => setPreviewDoc(record)} className="text-blue-600 text-sm font-bold hover:underline flex items-center gap-1 mt-2 lg:mt-0.5">{record.invoiceNumber} <Eye className="w-4 h-4" /></button>)}</div></div></td>
                      <td className="w-full py-4 lg:py-6 lg:px-6 block lg:table-cell border-t lg:border-none mt-2 lg:mt-0">{record.status !== 'Oczekiwanie' && (<div className="w-full grid grid-cols-1 gap-4"><div className="w-full"><div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">{t('ocr.doc_type')}:</div><div className="text-sm text-slate-700 font-bold">{t(`labels.${record.documentType.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '_')}`)}</div></div><div className="w-full"><div className="flex flex-wrap items-center gap-x-4 gap-y-2"><div className="text-sm text-slate-600 font-medium">{record.issueDate}</div><div className="text-xs text-slate-500 font-mono font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{record.sellerNip}</div></div></div></div>)}</td>
                      <td className="w-full py-4 lg:py-6 lg:px-8 block lg:table-cell"><div className="w-full flex flex-col lg:items-end gap-4">{record.status !== 'Oczekiwanie' && (<div className="w-full lg:w-48 bg-slate-50 p-4 rounded-2xl flex justify-between items-center lg:block lg:text-right border border-slate-100"><div className="lg:hidden text-[10px] text-slate-400 font-black uppercase">{t('ocr.value')}:</div><div className="text-right"><div className="text-sm font-bold text-slate-900">{record.netAmount.toLocaleString()} {i18n.language === 'en' ? '€' : 'zł'}</div><div className="text-[10px] text-slate-400 font-bold">{t('ocr.vat')}: {record.vatAmount.toLocaleString()} {i18n.language === 'en' ? '€' : 'zł'}</div><div className="text-base font-black text-blue-600 mt-1">{record.grossAmount.toLocaleString()} {i18n.language === 'en' ? '€' : 'zł'}</div></div></div>)}<div className="w-full lg:w-auto">{record.status === 'Oczekiwanie' ? (<Tooltip text={t('tooltips.ocr_analyze')}><button onClick={() => handleAnalyzeDocument(record.id)} className="w-full px-8 py-4 lg:py-2.5 bg-indigo-600 text-white rounded-2xl lg:rounded-xl font-black text-sm lg:text-xs hover:bg-indigo-700 transition-all shadow-lg uppercase tracking-wider"><Search className="w-5 h-5 lg:w-4 lg:h-4 mr-2 inline" /> {t('ocr.analyze_btn')}</button></Tooltip>) : (<div className="flex flex-col gap-2 w-full lg:w-auto"><button onClick={() => record.status !== 'Zweryfikowano' && updateOCRStatus(record.id, record.status === 'Odrzucone' ? 'Do weryfikacji' : 'Zweryfikowano')} className={`w-full px-6 py-3 lg:py-1.5 rounded-xl text-xs font-black transition-all border-2 ${record.status === 'Zweryfikowano' ? 'bg-green-50 text-green-700 border-green-100' : record.status === 'Odrzucone' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>{t(`status.${record.status.toLowerCase().replace(/ /g, '_')}`).toUpperCase()}</button>{record.status === 'Odrzucone' && (<Tooltip text={t('tooltips.ocr_smart_nudge')}><button onClick={() => handleSmartNudge(record)} className="py-2 px-4 text-[10px] text-blue-600 font-black bg-blue-50/50 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors w-full lg:w-auto"><Bell className="w-3.5 h-3.5" /> {t('ocr.smart_nudge')}</button></Tooltip>)}</div>)}</div></div></td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <AnimatePresence>
          {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewDoc(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              // DODANO: max-h-[90vh] oraz flex-col, aby stopka była zawsze na dole okna
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Pasek górny - mniejszy padding, żeby oszczędzić miejsce */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{t('ocr.preview_title')}</h3>
                  <p className="text-sm text-slate-500">{previewDoc.invoiceNumber} • {previewDoc.clientName}</p>
                </div>
                <button onClick={() => setPreviewDoc(null)} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-600 shadow-sm"><X className="w-6 h-6" /></button>
              </div>

              {/* Obszar zdjęcia - DODANO: overflow-y-auto oraz ograniczenie wysokości obrazka */}
              <div className="p-4 md:p-8 overflow-y-auto bg-slate-100 flex-1 flex items-center justify-center">
                <div className="w-full h-full min-h-[300px] bg-white rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200 overflow-hidden relative group">
                  <img 
                    src={`https://picsum.photos/seed/${previewDoc.id}/800/1200`} 
                    alt={t('ocr.preview_title')} 
                    // DODANO: max-h-full i object-contain, żeby nie rozpychało modala
                    className="max-w-full max-h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" 
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

              {/* Dolny pasek - Zawsze widoczny (shrink-0) */}
              <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button 
                  onClick={() => { 
                    updateOCRStatus(previewDoc.id, 'Odrzucone'); 
                    addActivity('Agent AI', 'System', `${t('status.rejected')}: ${previewDoc.clientName}`); 
                    toast.error(t('ocr.toast_rejected_msg'), { icon: '📩' }); 
                    setPreviewDoc(null); 
                  }} 
                  className="px-6 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold hover:bg-red-100 transition-all text-sm"
                >
                  {t('ocr.reject_btn')}
                </button>
                <button 
                  onClick={() => { 
                    updateOCRStatus(previewDoc.id, 'Zweryfikowano'); 
                    setPreviewDoc(null); 
                  }} 
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 text-sm"
                >
                  {t('ocr.approve_btn')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
        </AnimatePresence>
        {/* SEKCJA PREMIUM FEATURES */}
        <div className="mt-16 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 px-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-5 h-5 text-amber-500" />
                <h2 className="text-xl font-black text-slate-900">Pełna wersja Brakomatu</h2>
              </div>
              <p className="text-sm text-slate-500">Funkcje dostępne po wdrożeniu dla Twojego biura rachunkowego</p>
            </div>
            <button
              onClick={() => setShowLeadModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              Uzyskaj dostęp →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Zap,
                color: 'text-amber-600', bg: 'bg-amber-50',
                title: 'Integracja KSeF',
                desc: 'Faktury elektroniczne pobierane automatycznie z Krajowego Systemu e-Faktur co dobę. Zero ręcznej pracy.',
              },
              {
                icon: ShieldCheck,
                color: 'text-emerald-600', bg: 'bg-emerald-50',
                title: 'VIES & Biała lista VAT',
                desc: 'Każdy kontrahent weryfikowany automatycznie w VIES i Białej liście MF — z podglądem rachunku bankowego.',
              },
              {
                icon: Users2,
                color: 'text-blue-600', bg: 'bg-blue-50',
                title: 'Portal klienta',
                desc: 'Twoi klienci logują się na własną podstronę i sami wgrywają dokumenty. Ty tylko zatwierdzasz.',
              },
              {
                icon: MessageSquare,
                color: 'text-violet-600', bg: 'bg-violet-50',
                title: 'Auto-przypomnienia (cron)',
                desc: 'System sam wysyła przypomnienia email/SMS/WhatsApp według Twoich reguł — bez klikania.',
              },
              {
                icon: Archive,
                color: 'text-rose-600', bg: 'bg-rose-50',
                title: 'Archiwum miesięcy',
                desc: 'Pełna historia dokumentów z każdego zamkniętego miesiąca. Szybkie przeszukiwanie i pobieranie.',
              },
              {
                icon: BarChart3,
                color: 'text-indigo-600', bg: 'bg-indigo-50',
                title: 'Zarządzanie zespołem',
                desc: 'Dodaj pracowników biura, przydzielaj im klientów i śledź postęp pracy całego zespołu.',
              },
            ].map((feature) => (
              <motion.div
                key={feature.title}
                whileHover={{ y: -3 }}
                onClick={() => setShowLeadModal(true)}
                className="relative cursor-pointer bg-white rounded-[1.75rem] border border-slate-100 shadow-sm p-6 hover:shadow-md hover:border-blue-200 transition-all group overflow-hidden"
              >
                <div className="absolute top-4 right-4">
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[9px] font-black uppercase tracking-wider">
                    <Lock className="w-2.5 h-2.5" /> Pełna wersja
                  </span>
                </div>
                <div className={`p-3 rounded-2xl w-fit ${feature.bg} ${feature.color} mb-4`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-black text-slate-900 mb-2 pr-8">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-blue-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  Dowiedz się więcej <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <footer className="mt-12 text-center text-slate-400 text-sm">&copy; ArtWebCraft 2026 | {t('footer.system_name')} - {t('footer.system_description')}</footer>
      </div>

      {/* STICKY BOTTOM CTA */}
      <div className="sticky bottom-0 z-[90] w-full">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            transition={{ delay: 3, duration: 0.5, ease: 'easeOut' }}
            className="mb-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl shadow-2xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-700"
          >
            <div className="text-center sm:text-left">
              <p className="font-black text-sm">Podoba Ci się Brakomat?</p>
              <p className="text-slate-400 text-xs">Wdrożymy go dla Twojego biura rachunkowego — z Twoimi danymi i logo.</p>
            </div>
            <button
              onClick={() => setShowLeadModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-blue-500 transition-all shadow-lg whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              Chcę Brakomat dla swojego biura →
            </button>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
  {showWelcome && (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] flex items-center justify-center p-2 sm:p-4 md:p-8 overflow-hidden"
    >
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md" />
      
      <motion.div 
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        className="relative w-full max-w-2xl max-h-[95vh] flex flex-col bg-white/5 backdrop-blur-2xl p-6 md:p-12 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl border border-white/10 text-center"
      >
        {/* Scrollowalna treść, aby przycisk był zawsze na dole, jeśli ekran jest za mały */}
        <div className="overflow-y-auto custom-scrollbar pr-1 flex-1">
          
          {/* SEKCJA FLAG */}
          <div className="flex justify-center gap-6 mb-6 md:mb-10 pt-2">
            {[
              { lang: 'pl', flag: '/flaga_pl.png' },
              { lang: 'en', flag: '/flaga_en.png' }
            ].map((item) => (
              <button
                key={item.lang}
                onClick={() => i18n.changeLanguage(item.lang)}
                className={`relative transition-all ${i18n.language === item.lang ? 'opacity-100 scale-110' : 'opacity-30'}`}
              >
                <img src={item.flag} alt={item.lang} className="w-12 md:w-16 h-auto drop-shadow-md" />
                {i18n.language === item.lang && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* TYTUŁ */}
          <h2 className="text-2xl md:text-4xl font-black text-white mb-3 md:mb-4 tracking-tight leading-tight px-2">
            {t('welcome.title')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              {t('welcome.highlight')}
            </span>
          </h2>
          <p className="text-blue-100/70 text-sm md:text-base mb-6 md:mb-8 px-1">{t('welcome.intro')}</p>

          {/* PAIN STATS */}
          <div className="grid grid-cols-3 gap-3 mb-6 md:mb-8 px-1">
            {[
              { value: '8h', label: t('welcome.stat1_label') },
              { value: '1/4', label: t('welcome.stat2_label') },
              { value: '0', label: t('welcome.stat3_label') },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-3 md:p-4 text-center">
                <div className="text-2xl md:text-3xl font-black text-white">{stat.value}</div>
                <div className="text-[9px] md:text-[10px] text-blue-300/80 uppercase tracking-wider mt-1 leading-tight">{stat.label}</div>
              </div>
            ))}
          </div>

          <p className="text-xs text-white/40 px-1 mb-2">{t('welcome.description')}</p>
        </div>

        {/* PRZYCISK */}
        <div className="mt-4 pt-2 space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleFinalClose}
            className="w-full px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-base shadow-xl hover:bg-blue-700 transition-all uppercase tracking-widest"
          >
            {t('welcome.button')}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => { handleFinalClose(); setTimeout(() => setShowLeadModal(true), 300); }}
            className="w-full px-8 py-3 bg-white/10 text-white rounded-2xl font-bold text-sm border border-white/20 hover:bg-white/15 transition-all"
          >
            {t('welcome.cta_button')}
          </motion.button>

          <p className="text-[8px] md:text-[9px] text-white/20 uppercase tracking-[0.3em] text-center pt-2">
            ArtWebCraft Digital Experience 2026
          </p>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
    </div>

    <LeadModal isOpen={showLeadModal} onClose={() => setShowLeadModal(false)} />
    </>
  );
}