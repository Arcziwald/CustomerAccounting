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

const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'Tech Solutions Sp. z o.o.',
    month: 'Marzec 2026',
    tier: '2', // Pakiet Kontrola (z OCR)
    documents: [
      { id: 'f-koszt', label: 'Faktury Kosztowe', status: 'OK', files: [] },
      { id: 'f-przych', label: 'Faktury Przychodowe', status: 'Brak', files: [] },
      { id: 'wyciagi', label: 'Wyciągi', status: 'Brak', files: [] },
      { id: 'zus', label: 'ZUS', status: 'OK', files: [] },
      { id: 'kadry', label: 'Kadry', status: 'OK', files: [] }
    ]
  },
  {
    id: '2',
    name: 'Kawiarnia "Pod Chmurką"',
    month: 'Marzec 2026',
    tier: '1', // Pakiet Porządek (bez OCR)
    documents: [
      { id: 'f-koszt', label: 'Faktury Kosztowe', status: 'Brak', files: [] },
      { id: 'f-przych', label: 'Faktury Przychodowe', status: 'Brak', files: [] },
      { id: 'wyciagi', label: 'Wyciągi', status: 'Brak', files: [] },
      { id: 'zus', label: 'ZUS', status: 'Spóźnione', files: [] },
      { id: 'kadry', label: 'Kadry', status: 'OK', files: [] }
    ]
  },
  {
    id: '3',
    name: 'Jan Kowalski - Usługi IT',
    month: 'Marzec 2026',
    tier: '2', // Pakiet Kontrola (z OCR)
    documents: [
      { id: 'f-koszt', label: 'Faktury Kosztowe', status: 'OK', files: [] },
      { id: 'f-przych', label: 'Faktury Przychodowe', status: 'OK', files: [] },
      { id: 'wyciagi', label: 'Wyciągi', status: 'OK', files: [] },
      { id: 'zus', label: 'ZUS', status: 'OK', files: [] },
      { id: 'kadry', label: 'Kadry', status: 'OK', files: [] }
    ]
  },
  {
    id: '4',
    name: 'Eko-Budownictwo S.A.',
    month: 'Marzec 2026',
    tier: '2', // Pakiet Kontrola (z OCR)
    documents: [
      { id: 'f-koszt', label: 'Faktury Kosztowe', status: 'Spóźnione', files: [] },
      { id: 'f-przych', label: 'Faktury Przychodowe', status: 'Spóźnione', files: [] },
      { id: 'wyciagi', label: 'Wyciągi', status: 'OK', files: [] },
      { id: 'zus', label: 'ZUS', status: 'Brak', files: [] },
      { id: 'kadry', label: 'Kadry', status: 'Brak', files: [] }
    ]
  }
];

const OFFICE_SUBSCRIPTION: ClientTier = 'demo'; // Tu zmieniasz pakiet dla całego biura (np. na '1' dla demo)

export default function App() {
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
 const [activities, setActivities] = useState<ActivityEntry[]>([
  {
    id: 'init-1',
    clientName: 'Tech Solutions Sp. z o.o.',
    docLabel: 'Faktury Kosztowe',
    fileName: 'faktura_serwer_marzec.pdf',
    timestamp: '10:15'
  },
  {
    id: 'init-2',
    clientName: 'Agent AI',
    docLabel: 'System',
    fileName: 'Pobrano wyciągi bankowe (API)',
    timestamp: '09:30'
  },
  {
    id: 'init-3',
    clientName: 'Eko-Budownictwo S.A.',
    docLabel: 'Kadry',
    fileName: 'Umowa_zlecenie_Nowak.pdf',
    timestamp: '08:45'
  }
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
  }
]);

const addActivity = (clientName: string, docLabel: string, fileName: string) => {
  const newActivity: ActivityEntry = {
    id: Date.now().toString(),
    clientName: clientName, // Dokładnie taka nazwa pola!
    docLabel: docLabel,     // Dokładnie taka nazwa pola!
    fileName: fileName,     // Dokładnie taka nazwa pola!
    timestamp: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
  };
  setActivities(prev => [newActivity, ...prev].slice(0, 10));
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

      // LOGIKA DLA TWOJEGO SCENARIUSZA "ODRZUCONE"
      if (record.id === 'demo-2') {
        return {
          ...record,
          invoiceNumber: '---',
          issueDate: '---',
          sellerNip: '---',
          netAmount: 0,
          vatAmount: 0,
          grossAmount: 0,
          status: 'Odrzucone',
          documentType: 'Nieznany',
        };
      }
      
      // A. OBSŁUGA DANYCH DEMO (sztywne ID)
      if (record.id.startsWith('demo')) {
        if (record.id === 'demo-1') {
          return { ...record, invoiceNumber: 'FV/2026/102/AB', issueDate: '2026-03-15', sellerNip: 'PL5260001234', netAmount: 2500.0, vatAmount: 575.0, grossAmount: 3075.0, status: 'Do weryfikacji', documentType: 'Faktura' };
        }
        return record;
      }

      // B. KLUCZOWA POPRAWKA: Jeśli to NIE JEST Faktura (czyli ZUS, Kadry, Wyciąg)
      // Sprawdzamy co siedzi w record.documentType, który nadałeś przy uploadzie
      if (record.documentType !== 'Faktura' && record.documentType !== 'Inny') {
        return {
          ...record,
          invoiceNumber: 'DOK/POTW/2026',
          issueDate: new Date().toISOString().split('T')[0],
          sellerNip: 'N/D',
          netAmount: 0,
          vatAmount: 0,
          grossAmount: 0,
          status: 'Do weryfikacji',
          // Tutaj NIE wpisujemy "Faktura" - zostawiamy to, co było:
          documentType: record.documentType 
        };
      }

      // C. DOMYŚLNA ŚCIEŻKA DLA FAKTUR (Losowanie danych)
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
        status: 'Do weryfikacji',
        documentType: 'Faktura' // Tu ustawiamy Fakturę tylko jeśli faktycznie nią była
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
    // 1. Logujemy aktywność (Pasek boczny)
    addActivity(
      client.name, 
      'Przesyłanie', 
      `Wgrano nowy dokument: ${file.name}`
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
    let detectedType = 'Inny';
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
        docLabel: 'Wszystkie',
        fileName: 'Zakończono przesyłanie',
        timestamp: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
      };
      setActivities(prev => [newActivity, ...prev].slice(0, 10));
    }

    setClients(prev => prev.map(client => 
      client.id === clientId 
        ? { 
            ...client, 
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
            />
          } />
        </Routes>
      </div>
    </Router>
  );
}
