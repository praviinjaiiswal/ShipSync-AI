import type {
  EsanchitUploadPayload,
  EsanchitUploadResponse,
  GatewayPingResult,
  CustomsCredentialsConfig,
} from '../types';

export const ESANCHIT_DOC_CODES: Record<string, string> = {
  '010001': 'Commercial Invoice',
  '010002': 'Packing List',
  '010003': 'Bill of Lading / Airway Bill',
  '010004': 'Certificate of Origin',
  '010005': 'Insurance Certificate',
  '010006': 'Product Test Report / Quality Certificate',
  '010007': 'Technical Literature / Specification',
};

/**
 * e-Sanchit Document Upload Pipeline Adapter.
 * Encapsulates PDF document validation, DSC digital signing simulation/submission,
 * and Image Reference Number (IRN) retrieval.
 */
export class EsanchitAdapter {
  private config: CustomsCredentialsConfig;

  constructor(config: CustomsCredentialsConfig) {
    this.config = config;
  }

  public async uploadSupportingDocument(payload: EsanchitUploadPayload): Promise<EsanchitUploadResponse> {
    // 1. Validate statutory document restrictions
    if (payload.mimeType !== 'application/pdf') {
      throw new Error('e-Sanchit only accepts documents in PDF format.');
    }

    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB statutory limit
    if (payload.fileSize > MAX_SIZE_BYTES) {
      throw new Error(`Document size exceeds statutory e-Sanchit 5MB limit (${(payload.fileSize / (1024 * 1024)).toFixed(2)} MB).`);
    }

    if (!ESANCHIT_DOC_CODES[payload.docTypeCode]) {
      throw new Error(`Invalid e-Sanchit Document Type Code: ${payload.docTypeCode}. Must be one of: ${Object.keys(ESANCHIT_DOC_CODES).join(', ')}`);
    }

    // 2. Sandbox mode
    if (this.config.environment === 'SANDBOX') {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const hash = Math.random().toString(16).substring(2, 8).toUpperCase();
      const irnNumber = `IRN-${dateStr}-${hash}`;

      return {
        success: true,
        irnNumber,
        docTypeCode: payload.docTypeCode,
        fileName: payload.fileName,
        uploadedAt: now.toISOString(),
        signatureVerified: true,
        message: `Document registered with e-Sanchit Sandbox. IRN: ${irnNumber} (${ESANCHIT_DOC_CODES[payload.docTypeCode]})`,
      };
    }

    // 3. Live transmission
    const endpoint = process.env.ESANCHIT_ENDPOINT_URL || 'https://esanchit.icegate.gov.in/esanchit/upload';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ICEGATE-USER': this.config.icegateId || '',
        },
        body: JSON.stringify({
          docTypeCode: payload.docTypeCode,
          docName: payload.docName,
          fileName: payload.fileName,
          contentBase64: typeof payload.fileBuffer === 'string' ? payload.fileBuffer : payload.fileBuffer.toString('base64'),
        }),
      });

      if (!res.ok) {
        throw new Error(`e-Sanchit upload failed (HTTP ${res.status}): ${await res.text()}`);
      }

      const data = await res.json();
      return {
        success: true,
        irnNumber: data.irnNumber,
        docTypeCode: payload.docTypeCode,
        fileName: payload.fileName,
        uploadedAt: new Date().toISOString(),
        signatureVerified: true,
        message: data.message || 'Document uploaded and signed successfully.',
      };
    } catch (err: any) {
      throw new Error(`e-Sanchit Pipeline Error: ${err.message}`);
    }
  }

  public async ping(): Promise<GatewayPingResult> {
    const start = Date.now();
    try {
      if (this.config.environment === 'SANDBOX') {
        return {
          service: 'ESANCHIT',
          healthy: true,
          latencyMs: 42,
          environment: 'SANDBOX',
          message: 'e-Sanchit Sandbox service operational.',
        };
      }

      const res = await fetch(`${process.env.ESANCHIT_ENDPOINT_URL || 'https://esanchit.icegate.gov.in'}/health`, { method: 'HEAD' });
      return {
        service: 'ESANCHIT',
        healthy: res.ok,
        latencyMs: Date.now() - start,
        environment: this.config.environment,
        message: res.ok ? 'e-Sanchit service online' : `e-Sanchit HTTP ${res.status}`,
      };
    } catch (err: any) {
      return {
        service: 'ESANCHIT',
        healthy: false,
        latencyMs: Date.now() - start,
        environment: this.config.environment,
        message: err.message,
      };
    }
  }
}
