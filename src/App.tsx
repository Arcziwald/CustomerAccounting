/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ClientView from './components/ClientView';
import { Client, DocumentStatus, UploadedFile, ActivityEntry, ClientTier, OCRRecord } from './types';
import { Toaster } from 'react-hot-toast';
import { toast } from 'react-hot-toast'; // Dodaj to
import i18n from './i18n/config'; // Dodaj to (upewnij się, że ścieżka jest poprawna)

const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'Tech Solutions Sp. z o.o.',
    month: 'Marzec 2026',
    tier: '2',
    documents: [
      { id: 'f-koszt', label: 'Faktury Kosztowe', status: 'OK', files: [
        { name: 'FV_MediaMarkt_032026.pdf', timestamp: '08:12', isApproved: false },
        { name: 'FV_T-Mobile_032026.pdf', timestamp: '08:14', isApproved: false },
        { name: 'FV_OVH_hosting_marzec.pdf', timestamp: '09:02', isApproved: false },
      ]},
      { id: 'f-przych', label: 'Faktury Przychodowe', status: 'Brak', files: [] },
      { id: 'wyciagi', label: 'Wyciągi', status: 'Brak', files: [] },
      { id: 'zus', label: 'ZUS', status: 'OK', files: [
        { name: 'ZUS_DRA_2026_03.pdf', timestamp: '07:55', isApproved: true },
      ]},
      { id: 'kadry', label: 'Kadry', status: 'OK', files: [
        { name: 'lista_plac_032026.xlsx', timestamp: '07:50', isApproved: true },
      ]},
      { id: 'inne', label: 'Inne', status: 'Brak', files: [] },
    ]
  },
  {
    id: '2',
    name: 'Kawiarnia "Pod Chmurką"',
    month: 'Marzec 2026',
    tier: '1',
    documents: [
      { id: 'f-koszt', label: 'Faktury Kosztowe', status: 'Spóźnione', files: [] },
      { id: 'f-przych', label: 'Faktury Przychodowe', status: 'Brak', files: [] },
      { id: 'wyciagi', label: 'Wyciągi', status: 'Spóźnione', files: [] },
      { id: 'zus', label: 'ZUS', status: 'Spóźnione', files: [] },
      { id: 'kadry', label: 'Kadry', status: 'OK', files: [
        { name: 'umowy_pracownicy_marzec.pdf', timestamp: '10:30', isApproved: true },
      ]},
      { id: 'inne', label: 'Inne', status: 'Brak', files: [] }
    ]
  },
  {
    id: '3',
    name: 'Jan Kowalski – Usługi IT',
    month: 'Marzec 2026',
    tier: '2',
    locked: true,
    documents: [
      { id: 'f-koszt', label: 'Faktury Kosztowe', status: 'Zatwierdzone', files: [
        { name: 'FV_2026_023_hosting.pdf', timestamp: '14:22', isApproved: true },
        { name: 'FV_2026_024_sprint.pdf', timestamp: '14:23', isApproved: true },
      ]},
      { id: 'f-przych', label: 'Faktury Przychodowe', status: 'Zatwierdzone', files: [
        { name: 'FV_SPRZED_2026_011.pdf', timestamp: '14:15', isApproved: true },
        { name: 'FV_SPRZED_2026_012.pdf', timestamp: '14:16', isApproved: true },
      ]},
      { id: 'wyciagi', label: 'Wyciągi', status: 'Zatwierdzone', files: [
        { name: 'wyciag_mBank_03_2026.pdf', timestamp: '13:50', isApproved: true },
      ]},
      { id: 'zus', label: 'ZUS', status: 'Zatwierdzone', files: [
        { name: 'ZUS_DRA_032026.pdf', timestamp: '13:45', isApproved: true },
      ]},
      { id: 'kadry', label: 'Kadry', status: 'Zatwierdzone', files: [
        { name: 'lista_plac_032026.pdf', timestamp: '13:40', isApproved: true },
      ]},
    ]
  },
  {
    id: '4',
    name: 'Eko-Budownictwo S.A.',
    month: 'Marzec 2026',
    tier: '2',
    documents: [
      { id: 'f-koszt', label: 'Faktury Kosztowe', status: 'Spóźnione', files: [
        { name: 'FV_material_bud_001.pdf', timestamp: '11:05', isApproved: false },
      ]},
      { id: 'f-przych', label: 'Faktury Przychodowe', status: 'Spóźnione', files: [] },
      { id: 'wyciagi', label: 'Wyciągi', status: 'Brak', files: [] },
      { id: 'zus', label: 'ZUS', status: 'Brak', files: [] },
      { id: 'kadry', label: 'Kadry', status: 'Brak', files: [] },
    ]
  },
  {
    id: '5',
    name: 'Restauracja "Złota Rybka" s.j.',
    month: 'Marzec 2026',
    tier: '1',
    documents: [
      { id: 'f-koszt', label: 'Faktury Kosztowe', status: 'Brak', files: [] },
      { id: 'f-przych', label: 'Faktury Przychodowe', status: 'Brak', files: [] },
      { id: 'wyciagi', label: 'Wyciągi', status: 'Brak', files: [] },
      { id: 'zus', label: 'ZUS', status: 'Brak', files: [] },
      { id: 'kadry', label: 'Kadry', status: 'Brak', files: [] },
    ]
  },
  {
    id: '6',
    name: 'MedCare Clinic Sp. z o.o.',
    month: 'Marzec 2026',
    tier: '2',
    documents: [
      { id: 'f-koszt', label: 'Faktury Kosztowe', status: 'W toku', files: [
        { name: 'FV_sprzet_med_032026.pdf', timestamp: '09:40', isApproved: false },
        { name: 'FV_Medicover_032026.pdf', timestamp: '09:42', isApproved: false },
      ]},
      { id: 'f-przych', label: 'Faktury Przychodowe', status: 'OK', files: [
        { name: 'FV_NFZ_032026_01.pdf', timestamp: '08:30', isApproved: false },
        { name: 'FV_NFZ_032026_02.pdf', timestamp: '08:31', isApproved: false },
        { name: 'FV_pacjent_prywatny.pdf', timestamp: '08:35', isApproved: false },
      ]},
      { id: 'wyciagi', label: 'Wyciągi', status: 'W toku', files: [
        { name: 'wyciag_PKO_032026.pdf', timestamp: '09:20', isApproved: false },
      ]},
      { id: 'zus', label: 'ZUS', status: 'OK', files: [
        { name: 'ZUS_DRA_032026.pdf', timestamp: '07:45', isApproved: true },
      ]},
      { id: 'kadry', label: 'Kadry', status: 'OK', files: [
        { name: 'lista_plac_032026.pdf', timestamp: '07:40', isApproved: true },
        { name: 'umowa_zlecenie_dr_nowak.pdf', timestamp: '07:42', isApproved: false },
      ]},
    ]
  },
  {
    id: '7',
    name: 'Agencja Reklamowa "Pixel Plus"',
    month: 'Marzec 2026',
    tier: '1',
    documents: [
      { id: 'f-koszt', label: 'Faktury Kosztowe', status: 'OK', files: [
        { name: 'FV_Adobe_CC_032026.pdf', timestamp: '10:05', isApproved: true },
        { name: 'FV_Google_Ads_032026.pdf', timestamp: '10:07', isApproved: false },
        { name: 'FV_Canva_Pro_032026.pdf', timestamp: '10:09', isApproved: false },
      ]},
      { id: 'f-przych', label: 'Faktury Przychodowe', status: 'Spóźnione', files: [] },
      { id: 'wyciagi', label: 'Wyciągi', status: 'Brak', files: [] },
      { id: 'zus', label: 'ZUS', status: 'OK', files: [
        { name: 'ZUS_DRA_032026.pdf', timestamp: '07:30', isApproved: true },
      ]},
      { id: 'kadry', label: 'Kadry', status: 'Brak', files: [] },
    ]
  },
  {
    id: '8',
    name: 'AutoService Marek Nowak',
    month: 'Marzec 2026',
    tier: '2',
    documents: [
      { id: 'f-koszt', label: 'Faktury Kosztowe', status: 'OK', files: [
        { name: 'FV_034_ATE_czesc.pdf', timestamp: '09:15', isApproved: true },
        { name: 'FV_035_lakiernia.pdf', timestamp: '09:18', isApproved: false },
      ]},
      { id: 'f-przych', label: 'Faktury Przychodowe', status: 'OK', files: [
        { name: 'FV_SPRZED_089.pdf', timestamp: '09:00', isApproved: true },
        { name: 'FV_SPRZED_090.pdf', timestamp: '09:01', isApproved: true },
        { name: 'FV_SPRZED_091.pdf', timestamp: '09:03', isApproved: false },
      ]},
      { id: 'wyciagi', label: 'Wyciągi', status: 'W toku', files: [
        { name: 'wyciag_Santander_032026.pdf', timestamp: '10:20', isApproved: false },
      ]},
      { id: 'zus', label: 'ZUS', status: 'Brak', files: [] },
      { id: 'kadry', label: 'Kadry', status: 'Brak', files: [] },
      { id: 'paliwo', label: 'Paliwo', status: 'Brak', files: [] },
    ]
  },
  {
    id: '9',
    name: 'E-sklep "HomeGoods24" Sp. z o.o.',
    month: 'Marzec 2026',
    tier: '2',
    locked: true,
    documents: [
      { id: 'f-koszt', label: 'Faktury Kosztowe', status: 'Zatwierdzone', files: [
        { name: 'FV_Amazon_logistics_03.pdf', timestamp: '15:10', isApproved: true },
        { name: 'FV_DHL_032026.pdf', timestamp: '15:12', isApproved: true },
        { name: 'FV_Allegro_prowizja.pdf', timestamp: '15:14', isApproved: true },
      ]},
      { id: 'f-przych', label: 'Faktury Przychodowe', status: 'Zatwierdzone', files: [
        { name: 'FV_sklep_032026_zbiorowa.pdf', timestamp: '15:05', isApproved: true },
      ]},
      { id: 'wyciagi', label: 'Wyciągi', status: 'Zatwierdzone', files: [
        { name: 'wyciag_mBank_032026.pdf', timestamp: '14:55', isApproved: true },
      ]},
      { id: 'zus', label: 'ZUS', status: 'Zatwierdzone', files: [
        { name: 'ZUS_DRA_032026.pdf', timestamp: '14:50', isApproved: true },
      ]},
      { id: 'kadry', label: 'Kadry', status: 'Zatwierdzone', files: [
        { name: 'lista_plac_032026.xlsx', timestamp: '14:45', isApproved: true },
      ]},
    ]
  },
  {
    id: '10',
    name: 'Firma Transportowa Kowalczyk',
    month: 'Marzec 2026',
    tier: '1',
    documents: [
      { id: 'f-koszt', label: 'Faktury Kosztowe', status: 'Spóźnione', files: [] },
      { id: 'f-przych', label: 'Faktury Przychodowe', status: 'Brak', files: [] },
      { id: 'wyciagi', label: 'Wyciągi', status: 'Brak', files: [] },
      { id: 'zus', label: 'ZUS', status: 'Spóźnione', files: [] },
      { id: 'kadry', label: 'Kadry', status: 'Brak', files: [] },
    ]
  },
];

const OFFICE_SUBSCRIPTION: ClientTier = 'demo'; // Tu zmieniasz pakiet dla całego biura (np. na '1' dla demo)

export default function App() {
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
 const [activities, setActivities] = useState<ActivityEntry[]>([
  {
    id: 'init-1',
    clientName: 'Tech Solutions Sp. z o.o.',
    action: 'Faktury Kosztowe',
    detail: 'faktura_serwer_marzec.pdf',
    timestamp: '10:15'
  },
  {
    id: 'init-2',
    clientName: 'Agent AI',
    action: 'System',
    detail: 'Pobrano wyciągi bankowe (API)',
    timestamp: '09:30'
  },
  {
    id: 'init-3',
    clientName: 'MedCare Clinic Sp. z o.o.',
    action: 'Faktury Kosztowe',
    detail: 'faktury_koszt_02_2026.pdf',
    timestamp: '09:12'
  },
  {
    id: 'init-4',
    clientName: 'Agent AI',
    action: 'KSeF',
    detail: 'Pobrano 12 faktur z KSeF (AutoService)',
    timestamp: '08:55'
  },
  {
    id: 'init-5',
    clientName: 'Jan Kowalski – Usługi IT',
    action: 'System',
    detail: 'activities.finished',
    timestamp: '08:40'
  },
  {
    id: 'init-6',
    clientName: 'Agent AI',
    action: 'Systemowe Przypomnienie',
    detail: 'activities.nudge_sent_to|Kawiarnia "Pod Chmurką"',
    timestamp: '08:05'
  },
  {
    id: 'init-7',
    clientName: 'E-sklep "HomeGoods24" Sp. z o.o.',
    action: 'System',
    detail: 'activities.finished',
    timestamp: '07:50'
  },
]);
  const [ocrRecords, setOcrRecords] = useState<OCRRecord[]>([
  {
    id: 'demo-1',
    clientName: 'Tech Solutions Sp. z o.o.',
    invoiceNumber: 'FV/2026/001',
    issueDate: '2026-03-01',
    sellerNip: 'PL5260000000',
    netAmount: 1500.00,
    vatAmount: 345.00,
    grossAmount: 1845.00,
    status: 'Oczekiwanie',
    documentType: 'Faktura',
    fileName: 'faktura_serwer_marzec.pdf'
  },
  {
    id: 'demo-2',
    clientName: 'Kawiarnia "Pod Chmurką"',
    invoiceNumber: '---',
    issueDate: '---',
    sellerNip: '---',
    netAmount: 0,
    vatAmount: 0,
    grossAmount: 0,
    status: 'Oczekiwanie',
    documentType: 'Nieznany',
    fileName: 'zdjecie_z_wakacji.jpg'
  },
  {
    id: 'demo-3',
    clientName: 'MedCare Clinic Sp. z o.o.',
    invoiceNumber: 'FV/2026/0312',
    issueDate: '2026-03-08',
    saleDate: '2026-03-01',
    sellerNip: '7272800001',
    sellerName: 'Medicover Polska Sp. z o.o.',
    buyerName: 'MedCare Clinic Sp. z o.o.',
    buyerNip: '5213987654',
    subject: 'Pakiet medycyny pracy — 12 pracowników, marzec 2026',
    netAmount: 4200.00,
    vatAmount: 966.00,
    grossAmount: 5166.00,
    status: 'Do weryfikacji',
    documentType: 'Faktura',
    fileName: 'FV_sprzet_med_032026.pdf'
  },
  {
    id: 'demo-4',
    clientName: 'AutoService Marek Nowak',
    invoiceNumber: 'FV/2026/0089',
    issueDate: '2026-03-05',
    saleDate: '2026-03-04',
    sellerNip: '6760000012',
    sellerName: 'ATE Polska Sp. z o.o.',
    buyerName: 'AutoService Marek Nowak',
    buyerNip: '6340123456',
    subject: 'Części zamienne — zestaw filtrów silnikowych (36 szt.)',
    netAmount: 3850.00,
    vatAmount: 885.50,
    grossAmount: 4735.50,
    status: 'Zweryfikowano',
    documentType: 'Faktura',
    fileName: 'FV_034_ATE_czesc.pdf'
  },
  {
    id: 'demo-5',
    clientName: 'AutoService Marek Nowak',
    invoiceNumber: 'FV/2026/0090',
    issueDate: '2026-03-07',
    saleDate: '2026-03-06',
    sellerNip: '5240099887',
    sellerName: 'P.H. Lakiernia "Efekt"',
    buyerName: 'AutoService Marek Nowak',
    buyerNip: '6340123456',
    subject: 'Usługa lakierowania — 3 elementy karoserii',
    netAmount: 1200.00,
    vatAmount: 276.00,
    grossAmount: 1476.00,
    status: 'Do weryfikacji',
    documentType: 'Faktura',
    fileName: 'FV_035_lakiernia.pdf',
    wrongCategory: true,
    suggestedCategory: 'Usługi obce',
  },
  {
    id: 'demo-6',
    clientName: 'Agencja Reklamowa "Pixel Plus"',
    invoiceNumber: 'INV-2026-03-1847',
    issueDate: '2026-03-01',
    saleDate: '2026-03-01',
    sellerNip: 'IE6388047V',
    sellerName: 'Adobe Systems Software Ireland Ltd',
    buyerName: 'Agencja Reklamowa "Pixel Plus"',
    buyerNip: '5262012345',
    subject: 'Adobe Creative Cloud All Apps — 3 licencje, marzec 2026',
    netAmount: 890.00,
    vatAmount: 204.70,
    grossAmount: 1094.70,
    status: 'Oczekiwanie',
    documentType: 'Faktura',
    fileName: 'FV_Adobe_CC_032026.pdf'
  },
]);

const addActivity = (clientName: string, action: string, detail: string) => {
  const newActivity: ActivityEntry = {
    id: Math.random().toString(36).substr(2, 9),
    clientName, // to samo co clientName: clientName
    action,     // to samo co action: action
    detail,     // to samo co detail: detail
    timestamp: new Date().toISOString()
  };
  setActivities(prev => [newActivity, ...prev].slice(0, 20)); // trzymamy 20 ostatnich
};

  const toggleLockClient = (clientId: string) => {
    setClients(prev => prev.map(client => 
      client.id === clientId 
        ? { 
            ...client, 
            locked: !client.locked,
            documents: !client.locked 
              ? client.documents.map(doc => doc.status === 'W toku' || doc.status === 'OK' ? { ...doc, status: 'Zatwierdzone' as DocumentStatus } : doc)
              : client.documents.map(doc => doc.status === 'Zatwierdzone' ? { ...doc, status: 'OK' as DocumentStatus } : doc)
          }
        : client
    ));
  };

  const analyzeDocument = (recordId: string) => {
  // 1. Blokada limitu (bez zmian)
  if (OFFICE_SUBSCRIPTION === 'demo' && ocrRecords.filter(r => r.status !== 'Oczekiwanie' && !r.id.startsWith('demo')).length >= 2) {
    alert("W wersji DEMO możesz przeanalizować tylko 2 własne dokumenty. Kup Pakiet 2, aby zdjąć limity!");
    return;
  }

  setOcrRecords(prev => prev.map(record => {
    if (record.id === recordId) {

      // LOGIKA DLA TWOJEGO SCENARIUSZA "ODRZUCONE" (demo-2)
      if (record.id === 'demo-2') {
        return {
          ...record,
          invoiceNumber: '---', issueDate: '---', sellerNip: '---',
          sellerName: undefined, buyerName: undefined, subject: 'Nieczytelny dokument — brak danych faktury',
          netAmount: 0, vatAmount: 0, grossAmount: 0,
          status: 'Odrzucone' as any, documentType: 'Nieznany' as any,
        };
      }

      // A. OBSŁUGA DANYCH DEMO (demo-1)
      if (record.id === 'demo-1') {
        return {
          ...record,
          invoiceNumber: 'FV/2026/102/AB', issueDate: '2026-03-15', saleDate: '2026-03-15',
          sellerNip: '5260001234', sellerName: 'Microsoft Ireland Operations Ltd',
          buyerName: 'Tech Solutions Sp. z o.o.', buyerNip: '5213456789',
          subject: 'Microsoft 365 Business Premium — 5 licencji, marzec 2026',
          netAmount: 2500.0, vatAmount: 575.0, grossAmount: 3075.0,
          status: 'Do weryfikacji' as any, documentType: 'Faktura' as any
        };
      }

      // B. DOKUMENTY INNE NIŻ FAKTURA (ZUS, Kadry itp.)
      // Używamy as any dla documentType, żeby TS nie blokował porównania
      const currentType = record.documentType as any;
      if (currentType !== 'Faktura' && currentType !== 'Inny') {
        
        // Wywołujemy toast używając i18n.t bezpośrednio
        toast.success(
          <div className="flex flex-col gap-1">
            <p className="font-bold text-sm">{i18n.t('dashboard.title')}</p>
            <p className="text-xs">{i18n.t('ai.excel_toast')}</p>
          </div>,
          { duration: 7000, icon: '📊' }
        );

        return {
          ...record,
          invoiceNumber: 'DOK/POTW/2026',
          issueDate: new Date().toISOString().split('T')[0],
          sellerNip: 'N/D',
          netAmount: 0,
          vatAmount: 0,
          grossAmount: 0,
          status: 'Do weryfikacji' as any,
          documentType: currentType as any
        };
      }

      // C. DOMYŚLNA ŚCIEŻKA DLA FAKTUR
      const net = Math.floor(Math.random() * 3500) + 150;
      const vat = Math.round(net * 0.23);
      
      return {
        ...record,
        invoiceNumber: `FV/2026/${Math.floor(Math.random() * 800) + 100}`,
        issueDate: new Date().toISOString().split('T')[0],
        sellerNip: 'PL' + Math.floor(Math.random() * 9000000000 + 1000000000),
        netAmount: net,
        vatAmount: vat,
        grossAmount: net + vat,
        status: 'Do weryfikacji' as any,
        documentType: 'Faktura' as any
      };
    }
    return record;
  }));
};


  const updateOCRStatus = (recordId: string, newStatus: 'Oczekiwanie' | 'Do weryfikacji' | 'Zweryfikowano' | 'Odrzucone') => {
    setOcrRecords(prev => prev.map(record => 
      record.id === recordId ? { ...record, status: newStatus } : record
    ));
  };

  const updateClientStatus = (clientId: string, docId: string, newStatus: DocumentStatus) => {
    setClients(prev => prev.map(client => 
      client.id === clientId 
        ? { 
            ...client, 
            documents: client.documents.map(doc => 
              doc.id === docId ? { ...doc, status: newStatus } : doc
            ) 
          }
        : client
    ));
  };

  const addFileToDocument = async (clientId: string, docId: string, file: UploadedFile) => {
  const client = clients.find(c => c.id === clientId);
  const doc = client?.documents.find(d => d.id === docId);

  if (client && doc) {
    
addActivity(
      client.name, 
      'labels.upload', 
      file.name // Przekazujemy nazwę pliku jako detail
    );
    // 2. Połączenie z n8n (Webhook)
    if (file.rawFile) {
      const formData = new FormData();
      formData.append('data', file.rawFile);
      formData.append('clientId', clientId);
      formData.append('clientName', client.name);
      formData.append('docLabel', doc.label);

      try {
        fetch('https://n8n.srv1151721.hstgr.cloud/webhook-test/odbierz-dokument', {
          method: 'POST',
          body: formData,
        });
      } catch (error) {
        console.error("Błąd Webhooka:", error);
      }
    }

    // 3. Dodajemy rekord do Inteligentnego Rejestru (Tabela na dole)
    // Usunąłem warunek .includes(), żeby w celach DEMO każdy plik tam wpadał
    // Dynamiczne określanie typu dokumentu na podstawie sekcji
    let detectedType: any = 'Inny';
    if (doc.label.includes('Faktury')) detectedType = 'Faktura';
      else if (doc.label.includes('ZUS')) detectedType = 'ZUS';
      else if (doc.label.includes('Kadry')) detectedType = 'Kadry';
      else if (doc.label.includes('Wyciągi')) detectedType = 'Wyciąg';

    const newOCRRecord: OCRRecord = {
      id: Date.now().toString() + '-ocr',
      clientName: client.name,
      invoiceNumber: '---',
      issueDate: '---',
      sellerNip: '---',
      netAmount: 0,
      vatAmount: 0,
      grossAmount: 0,
      status: 'Oczekiwanie',
      documentType: detectedType,
      fileName: file.name
    };

    setOcrRecords(prev => [newOCRRecord, ...prev]);

    // 4. Aktualizacja stanu dokumentów u klienta
    setClients(prev => prev.map(c => 
      c.id === clientId 
        ? { 
            ...c, 
            documents: c.documents.map(d => 
              d.id === docId 
                ? { ...d, files: [...d.files, file], status: 'W toku' } 
                : d
            ) 
          }
        : c
    ));
  }
};

  const finishUploading = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      const newActivity: ActivityEntry = {
        id: Date.now().toString(),
        clientName: client.name,
        action: 'System', // Zamiast common.all, żeby nie śmieciło
        detail: i18n.t('activities.finished'),
        timestamp: new Date().toISOString()
      };
      setActivities(prev => [newActivity, ...prev].slice(0, 10));
    }

    setClients(prev => prev.map(client => 
      client.id === clientId 
        ? { 
            ...client, 
            isFinished: true, // TA LINIA JEST KLUCZOWA - flaga dla Dashboardu
            documents: client.documents.map(doc => 
              doc.status === 'W toku' ? { ...doc, status: 'OK' } : doc
            ) 
          }
        : client
    ));
  };
  const addDocument = (clientId: string, label: string) => {
    setClients(prev => prev.map(client => 
      client.id === clientId 
        ? { 
            ...client, 
            documents: [...client.documents, { id: Date.now().toString(), label, status: 'Brak', files: [] }] 
          }
        : client
    ));
  };

  const removeDocument = (clientId: string, docId: string) => {
    setClients(prev => prev.map(client => 
      client.id === clientId 
        ? { 
            ...client, 
            documents: client.documents.filter(doc => doc.id !== docId) 
          }
        : client
    ));
  };

  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="min-h-screen bg-slate-50">
        <Routes>
          <Route path="/" element={
            <Dashboard 
              clients={clients}
              subscriptionTier={OFFICE_SUBSCRIPTION}
              addDocument={addDocument} 
              removeDocument={removeDocument} 
              activities={activities}
              toggleLockClient={toggleLockClient}
              ocrRecords={ocrRecords}
              updateOCRStatus={updateOCRStatus}
              analyzeDocument={analyzeDocument}
              addActivity={addActivity}
            />
          } />
          <Route path="/client/:id" element={
            <ClientView 
              clients={clients} 
              updateClientStatus={updateClientStatus} 
              addFileToDocument={addFileToDocument} 
              finishUploading={finishUploading} 
              addActivity={addActivity}
            />
          } />
        </Routes>
      </div>
    </Router>
  );
}
