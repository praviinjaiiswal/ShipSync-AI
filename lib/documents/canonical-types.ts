import type { DocType, DocumentStatus } from '@prisma/client';

export interface CanonicalInvoiceItem {
  hsCode?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
}

export interface CanonicalInvoiceData {
  invoiceNumber: string;
  invoiceDate: string; // ISO date string
  sellerName: string;
  sellerAddress?: string;
  buyerName: string;
  buyerAddress?: string;
  currency: string;
  totalAmount: number;
  incoterm?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  items: CanonicalInvoiceItem[];
  totalQuantity: number;
}

export interface CanonicalPackingListItem {
  description: string;
  quantity: number;
  packages?: number;
  netWeightKg?: number;
  grossWeightKg?: number;
}

export interface CanonicalPackingListData {
  packingListNumber: string;
  packingListDate?: string;
  sellerName?: string;
  buyerName?: string;
  grossWeightKg: number;
  netWeightKg: number;
  totalPackages: number;
  packageType?: string; // e.g. CARTONS, PALLETS, DRUMS, BAGS
  containerNumbers?: string[];
  items: CanonicalPackingListItem[];
}

export interface CanonicalBillOfLadingData {
  blNumber: string;
  issueDate?: string;
  shipperName?: string;
  consigneeName?: string;
  notifyParty?: string;
  vesselName?: string;
  voyageNumber?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  grossWeightKg?: number;
  totalPackages?: number;
  containerNumbers?: string[];
}

export type CanonicalExtractedData =
  | { type: 'COMMERCIAL_INVOICE'; data: CanonicalInvoiceData }
  | { type: 'PACKING_LIST'; data: CanonicalPackingListData }
  | { type: 'BILL_OF_LADING'; data: CanonicalBillOfLadingData }
  | { type: 'OTHER'; data: Record<string, any> };

export type DiscrepancySeverity = 'ERROR' | 'WARNING';

export interface DiscrepancyItem {
  type: 'WEIGHT' | 'VALUE' | 'CURRENCY' | 'QUANTITY' | 'HS_CODE' | 'PARTY' | 'PORT';
  severity: DiscrepancySeverity;
  field: string;
  expected: any;
  actual: any;
  message: string;
  docSources: string[];
}

export interface DiscrepancyReport {
  hasBlockingErrors: boolean;
  totalDiscrepancies: number;
  errorCount: number;
  warningCount: number;
  discrepancies: DiscrepancyItem[];
  checkedAt: string;
}

export interface EsanchitValidationResult {
  ready: boolean;
  docTypeCode: string;
  docTypeName: string;
  fileSize: number;
  mimeType: string;
  errors: string[];
  warnings: string[];
}
