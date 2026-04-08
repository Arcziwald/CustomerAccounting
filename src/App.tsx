/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ClientView from './components/ClientView';
import { Client, DocumentStatus, UploadedFile, ActivityEntry, ClientTier, OCRRecord } from './types';

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
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
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
  // 1. Blokada limitu w Demo
  if (OFFICE_SUBSCRIPTION === 'demo' && ocrRecords.filter(r => r.status !== 'Oczekiwanie' && !r.id.startsWith('demo')).length >= 2) {
    alert("W wersji DEMO możesz przeanalizować tylko 2 własne dokumenty. Kup Pakiet 2, aby zdjąć limity!");
    return;
  }

  setOcrRecords(prev => prev.map(record => {
    if (record.id === recordId) {
      // LOGIKA DEMO - USTAWIONE SCENARIUSZE
      if (record.id === 'demo-1') {
        return {
          ...record,
          invoiceNumber: 'FV/2026/102/AB',
          issueDate: '2026-03-15',
          sellerNip: 'PL5260001234',
          netAmount: 2500.00,
          vatAmount: 575.00,
          grossAmount: 3075.00,
          status: 'Do weryfikacji',
          documentType: 'Faktura',
        };
      }

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

      // LOGIKA DLA REALNYCH PLIKÓW (Twoje losowanie)
      const isInvoice = Math.random() > 0.3; // Zwiększyłem szansę na sukces do 70%
      const net = Math.floor(Math.random() * 5000) + 100;
      const vat = Math.round(net * 0.23);
      
      return {
        ...record,
        invoiceNumber: isInvoice ? `FV/2026/${Math.floor(Math.random() * 1000)}` : '---',
        issueDate: isInvoice ? new Date().toISOString().split('T')[0] : '---',
        sellerNip: isInvoice ? 'PL' + Math.floor(Math.random() * 1000000000) : '---',
        netAmount: isInvoice ? net : 0,
        vatAmount: isInvoice ? vat : 0,
        grossAmount: isInvoice ? net + vat : 0,
        status: isInvoice ? 'Do weryfikacji' : 'Odrzucone',
        documentType: isInvoice ? 'Faktura' : 'Nieznany',
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
      const newActivity: ActivityEntry = {
        id: Date.now().toString(),
        clientName: client.name,
        docLabel: doc.label,
        fileName: file.name,
        timestamp: file.timestamp
      };
      setActivities(prev => [newActivity, ...prev].slice(0, 10));

      // POŁĄCZENIE Z n8n
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
          console.log("Wysłano do n8n:", file.name);
        } catch (error) {
          console.error("Błąd Webhooka:", error);
        }
      }

      // Create a pending OCR record
      if (doc.label.includes('Faktury')) {
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
          documentType: 'Oczekiwanie',
          fileName: file.name
        };
        setOcrRecords(prev => [newOCRRecord, ...prev]);
      }
    }

    setClients(prev => prev.map(client => 
      client.id === clientId 
        ? { 
            ...client, 
            documents: client.documents.map(doc => 
              doc.id === docId 
                ? { 
                    ...doc, 
                    files: [...doc.files, file],
                    status: 'W toku' 
                  } 
                : doc
            ) 
          }
        : client
    ));
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
