import { ReactNode } from 'react';

export type DocumentStatus = 'OK' | 'Brak' | 'Spóźnione' | 'W toku' | 'Zatwierdzone';
export type ClientTier = '1' | '2' | '3' | 'demo';

export interface UploadedFile {
  name: string;
  timestamp: string;
  rawFile?: File;
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

export const STATUS_COLORS: Record<DocumentStatus, string> = {
  'OK': 'bg-green-100 text-green-700 border-green-200',
  'Brak': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Spóźnione': 'bg-red-100 text-red-700 border-red-200',
  'W toku': 'bg-blue-100 text-blue-700 border-blue-200',
  'Zatwierdzone': 'bg-emerald-600 text-white border-emerald-700',
};