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
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  status: 'Oczekiwanie' | 'Do weryfikacji' | 'Zweryfikowano' | 'Odrzucone';
  documentType: 'Faktura' | 'Nieznany' | 'Oczekiwanie';
  fileName: string;
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
}

export interface Client {
  id: string;
  name: string;
  month: string;
  tier: ClientTier; 
  documents: DocumentGroup[];
  locked?: boolean;
}

export const STATUS_COLORS: Record<string, string> = {
  // Stan: Brak / Do przesłania (Subtelny pomarańcz zamiast żółtego)
  'Brak': 'bg-orange-50 text-orange-600 border-orange-100',
  
  // Stan: W toku / Do weryfikacji
  'W toku': 'bg-blue-50 text-blue-600 border-blue-100',
  'Do weryfikacji': 'bg-indigo-50 text-indigo-600 border-indigo-100',
  
  // Stan: Spóźnione (Delikatny róż/czerwień)
  'Spóźnione': 'bg-red-50 text-red-600 border-red-100',
  'Odrzucone': 'bg-rose-50 text-rose-600 border-rose-100',
  
  // Stan: OK (Pastelowa zieleń)
  'OK': 'bg-emerald-50 text-emerald-600 border-emerald-100',
  
  // STANY FINALNE - Tutaj zostawiamy mocniejszy akcent
  'Zatwierdzone': 'bg-emerald-500 text-white border-emerald-600 shadow-sm',
  'Zweryfikowano': 'bg-blue-500 text-white border-blue-600 shadow-sm'
};