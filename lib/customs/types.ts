import type {
  CustomsServiceType,
  CustomsEnvironment,
  ImportShipmentStatus,
} from '@prisma/client';

export interface CustomsCredentialsConfig {
  icegateId?: string;
  iecCode?: string;
  portCode?: string;
  password?: string;
  dscPin?: string;
  certificateData?: string;
  environment: CustomsEnvironment;
}

export interface BillOfEntryFilingPayload {
  companyId: string;
  importShipmentId: string;
  importerIEC: string;
  importerName: string;
  portOfImport: string;
  igmNumber?: string | null;
  blOrAwbNumber?: string | null;
  hsCode: string;
  invoiceValue: number;
  currency: string;
  assessableValue: number;
  dutyPayable: number;
  dutyBreakdown: Record<string, any>;
  beNumber: string;
}

export interface CustomsFilingResponse {
  success: boolean;
  service: CustomsServiceType;
  filingRefNumber: string;
  ackNumber?: string;
  jobId?: string;
  submissionTimestamp: string;
  status: 'SUBMITTED' | 'ACKNOWLEDGED' | 'REJECTED';
  message: string;
  rawResponse?: Record<string, any>;
}

export interface CustomsStatusQuery {
  service: CustomsServiceType;
  filingRefNumber?: string;
  ackNumber?: string;
  beNumber?: string;
  portCode?: string;
}

export interface CustomsStatusResponse {
  service: CustomsServiceType;
  status: 'PENDING' | 'ASSESSED' | 'DUTY_PAID' | 'EXAMINED' | 'OUT_OF_CHARGE' | 'REJECTED';
  shipmentStatus?: ImportShipmentStatus;
  ackNumber?: string;
  beNumber?: string;
  assessmentDate?: string;
  dutyPayable?: number;
  remarks?: string;
  rawResponse?: Record<string, any>;
}

export interface EsanchitUploadPayload {
  companyId: string;
  importShipmentId: string;
  docTypeCode: string; // e.g. '010001' Invoice, '010002' Packing List
  docName: string;
  fileBuffer: Buffer | string; // Base64 or Buffer
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export interface EsanchitUploadResponse {
  success: boolean;
  irnNumber: string; // Image Reference Number e.g. IRN-2026-09-07-00123
  docTypeCode: string;
  fileName: string;
  uploadedAt: string;
  signatureVerified: boolean;
  message: string;
}

export interface GatewayPingResult {
  service: CustomsServiceType;
  healthy: boolean;
  latencyMs: number;
  environment: CustomsEnvironment;
  message: string;
}
