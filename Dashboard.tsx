/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ClientView from './components/ClientView';
import { Client, DocumentStatus, UploadedFile, ActivityEntry, OCRRecord } from './types';

const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'Tech Solutions Sp. z o.o.',
    month: 'Marzec 2026',
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
    documents: [
      { id: 'f-koszt', label: 'Faktury Kosztowe', status: 'Spóźnione', files: [] },
      { id: 'f-przych', label: 'Faktury Przychodowe', status: 'Spóźnione', files: [] },
      { id: 'wyciagi', label: 'Wyciągi', status: 'OK', files: [] },
      { id: 'zus', label: 'ZUS', status: 'Brak', files: [] },
      { id: 'kadry', label: 'Kadry', status: 'Brak', files: [] }
    ]
  }
];

export default function App() {
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [ocrRecords, setOcrRecords] = useState<OCRRecord[]>([]);

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
    setOcrRecords(prev => prev.map(record => {
      if (record.id === recordId) {
        const isInvoice = Math.random() > 0.5; // 50/50 chance
        const net = Math.floor(Math.random() * 5000) + 100;
        const vat = Math.round(net * 0.23);
        
        return {
          ...record,
          invoiceNumber: isInvoice ? `FV/${new Date().getFullYear()}/${Math.floor(Math.random() * 1000)}` : '---',
          issueDate: isInvoice ? new Date().toISOString().split('T')[0] : '---',
          sellerNip: isInvoice ? 'PL' + Math.floor(Math.random() * 10000000000) : '---',
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
      // 1. Logika wizualna (to co już masz)
      const newActivity: ActivityEntry = {
        id: Date.now().toString(),
        clientName: client.name,
        docLabel: doc.label,
        fileName: file.name,
        timestamp: file.timestamp
      };
      setActivities(prev => [newActivity, ...prev].slice(0, 10));

      // 2. FIZYCZNE WYSYŁANIE DO n8n
      // Zakładamy, że 'file' zawiera obiekt File z przeglądarki (blob)
      if (file.rawFile) { 
        const formData = new FormData();
        formData.append('data', file.rawFile); // Klucz 'data' musi być taki sam jak w n8n
        formData.append('clientId', clientId);
        formData.append('clientName', client.name);

        try {
          // TU WPISZ SWÓJ ADRES WEBHOOKA
          fetch('https://n8n.srv1151721.hstgr.cloud/webhook-test/odbierz-dokument', {
            method: 'POST',
            body: formData,
          });
          // Nie czekamy na 'await', żeby nie blokować interfejsu (n8n i tak mieli to w tle)
        } catch (error) {
          console.error("Błąd wysyłki do n8n:", error);
        }
      }

      // 3. Reszta logiki OCR (to co już masz)
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

    // Aktualizacja stanu UI
    setClients(prev => prev.map(c => 
      c.id === clientId 
        ? { 
            ...c, 
            documents: c.documents.map(d => 
              d.id === docId ? { ...d, files: [...d.files, file], status: 'W toku' } : d
            ) 
          }
        : c
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
