import { ReactNode } from 'react';

export type DocumentStatus = 'OK' | 'Brak' | 'Spóźnione' | 'W toku' | 'Zatwierdzone';
export type ClientTier = '1' | '2' | '3' | 'demo';

export interface UploadedFile {
  name: string;
  timestamp: string;
  rawFile?: File;
  isApproved?: boolean;
}

export interface ActivityEntry {
  id: string;
  clientName: string;
  action: string;    // Tylko te nazwy zostawiamy
  detail: string;    // Żadnych ReactI18NextChildren
  timestamp: string;
}

export interface OCRRecord {
  id: string;
  clientName: string;
  invoiceNumber: string;
  issueDate: string;
  sellerNip: string;
  sellerName?: string;
  buyerName?: string;
  buyerNip?: string;
  subject?: string;
  saleDate?: string;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  status: 'Oczekiwanie' | 'Do weryfikacji' | 'Zweryfikowano' | 'Odrzucone';
  documentType: 'Faktura' | 'Nieznany' | 'Oczekiwanie';
  fileName: string;
  wrongCategory?: boolean;
  suggestedCategory?: string;
}

export interface DocumentItem {
  id: string;
  label: string;
  status: DocumentStatus;
  files: UploadedFile[];
}

export interface DocumentGroup {
  id: string;
  label: string;
  status: DocumentStatus;
  files: UploadedFile[];
  rejectionReason?: string; // powód odrzucenia widoczny dla klienta w portalu (Fala 2, pkt 9)
}

export interface Client {
  id: string;
  name: string;
  month: string;
  tier: ClientTier;
  documents: DocumentGroup[];
  locked?: boolean;
  email?: string;
  uploadToken?: string;
  isFinished?: boolean; // klient kliknął „Zakończ przesyłanie" w portalu → badge „KLIENT SKOŃCZYŁ" w panelu
}

export const STATUS_COLORS: Record<string, string> = {
  // Stan: Brak / Do przesłania (Subtelny pomarańcz zamiast żółtego)
  'Brak': 'bg-amber-50 text-amber-500 border-amber-100',
  
  // Stan: W toku / Do weryfikacji
  'W toku': 'bg-sky-50 text-sky-500 border-sky-100',
  'Do weryfikacji': 'bg-violet-50 text-violet-500 border-violet-100',
  
  // Stan: Spóźnione (Delikatny róż/czerwień)
  'Spóźnione': 'bg-rose-50 text-rose-400 border-rose-100',
  'Odrzucone': 'bg-pink-50 text-pink-400 border-pink-100',
  
  // Stan: OK (Pastelowa zieleń)
  'OK': 'bg-teal-50 text-teal-600 border-teal-100',
  
  // STANY FINALNE - Tutaj zostawiamy mocniejszy akcent
  'Zatwierdzone': 'bg-teal-100 text-teal-700 border-teal-200',
  'Zweryfikowano': 'bg-sky-100 text-sky-700 border-sky-200'
};