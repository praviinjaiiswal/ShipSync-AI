import type {
  BillOfEntryFilingPayload,
  CustomsFilingResponse,
  CustomsStatusQuery,
  CustomsStatusResponse,
  EsanchitUploadPayload,
  EsanchitUploadResponse,
  GatewayPingResult,
} from '../types';

/**
 * Standard contract for all Customs Gateway adapters (ICEGATE, DGFT, e-Sanchit, Mock).
 */
export interface CustomsAdapter {
  readonly serviceName: string;

  /**
   * Transmits a Bill of Entry to customs gateway.
   */
  fileBillOfEntry(payload: BillOfEntryFilingPayload): Promise<CustomsFilingResponse>;

  /**
   * Queries status of a previously filed declaration.
   */
  checkFilingStatus(query: CustomsStatusQuery): Promise<CustomsStatusResponse>;

  /**
   * Uploads a supporting document to e-Sanchit and obtains an IRN.
   */
  uploadSupportingDocument(payload: EsanchitUploadPayload): Promise<EsanchitUploadResponse>;

  /**
   * Verifies gateway connectivity and measures latency.
   */
  ping(): Promise<GatewayPingResult>;
}
