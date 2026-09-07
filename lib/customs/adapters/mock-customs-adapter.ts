import type { CustomsAdapter } from './customs-adapter.interface';
import type {
  BillOfEntryFilingPayload,
  CustomsFilingResponse,
  CustomsStatusQuery,
  CustomsStatusResponse,
  EsanchitUploadPayload,
  EsanchitUploadResponse,
  GatewayPingResult,
} from '../types';

export interface MockAdapterOptions {
  simulatedLatencyMs?: number;
  shouldFail?: boolean;
  failureErrorMessage?: string;
  forceStatus?: 'PENDING' | 'ASSESSED' | 'DUTY_PAID' | 'EXAMINED' | 'OUT_OF_CHARGE' | 'REJECTED';
}

/**
 * Enterprise Mock / Sandbox adapter for ICEGATE, DGFT & e-Sanchit.
 * Used for local development, CI/CD testing, and environments without Class 3 DSC hardware.
 */
export class MockCustomsAdapter implements CustomsAdapter {
  public readonly serviceName = 'ICEGATE_SANDBOX';
  private options: MockAdapterOptions;

  constructor(options: MockAdapterOptions = {}) {
    this.options = {
      simulatedLatencyMs: options.simulatedLatencyMs ?? 50,
      shouldFail: options.shouldFail ?? false,
      failureErrorMessage: options.failureErrorMessage ?? 'Simulated Customs Gateway Timeout (HTTP 504)',
      forceStatus: options.forceStatus,
    };
  }

  public setOptions(options: Partial<MockAdapterOptions>): void {
    this.options = { ...this.options, ...options };
  }

  private async simulateNetwork(): Promise<void> {
    if (this.options.simulatedLatencyMs && this.options.simulatedLatencyMs > 0) {
      await new Promise((res) => setTimeout(res, this.options.simulatedLatencyMs));
    }
    if (this.options.shouldFail) {
      throw new Error(this.options.failureErrorMessage);
    }
  }

  public async fileBillOfEntry(payload: BillOfEntryFilingPayload): Promise<CustomsFilingResponse> {
    await this.simulateNetwork();

    const timestamp = new Date().toISOString();
    const year = new Date().getFullYear();
    const randomSeq = Math.floor(10000 + Math.random() * 90000);
    const filingRefNumber = `REF-SS-${Date.now()}-${randomSeq}`;
    const ackNumber = `ACK-ICEGATE-${year}-${randomSeq}`;

    return {
      success: true,
      service: 'ICEGATE',
      filingRefNumber,
      ackNumber,
      submissionTimestamp: timestamp,
      status: 'ACKNOWLEDGED',
      message: `Bill of Entry ${payload.beNumber} successfully acknowledged by ICEGATE Sandbox.`,
      rawResponse: {
        gateway: 'ICEGATE-SANDBOX-v2',
        beNumber: payload.beNumber,
        ackNumber,
        iecCode: payload.importerIEC,
        portCode: payload.portOfImport,
        totalDuty: payload.dutyPayable,
        validationStatus: 'PASSED',
        dscSignatureStatus: 'VERIFIED_TEST_CERTIFICATE',
      },
    };
  }

  public async checkFilingStatus(query: CustomsStatusQuery): Promise<CustomsStatusResponse> {
    await this.simulateNetwork();

    const status = this.options.forceStatus ?? 'ASSESSED';

    return {
      service: query.service,
      status,
      shipmentStatus: status === 'ASSESSED' ? 'ASSESSED' : 'BOE_FILED',
      ackNumber: query.ackNumber || `ACK-ICEGATE-${new Date().getFullYear()}-55441`,
      beNumber: query.beNumber,
      assessmentDate: new Date().toISOString(),
      remarks: 'Assessment completed automatically under RMS (Risk Management System).',
      rawResponse: {
        appraisingGroup: 'GROUP_5A',
        examinationOrder: 'FIRST_CHECK_NOT_REQUIRED',
        status,
      },
    };
  }

  public async uploadSupportingDocument(payload: EsanchitUploadPayload): Promise<EsanchitUploadResponse> {
    await this.simulateNetwork();

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    const irnNumber = `IRN-${dateStr}-${randomHex}`;

    return {
      success: true,
      irnNumber,
      docTypeCode: payload.docTypeCode,
      fileName: payload.fileName,
      uploadedAt: now.toISOString(),
      signatureVerified: true,
      message: `Document successfully uploaded to e-Sanchit Sandbox. IRN generated: ${irnNumber}`,
    };
  }

  public async ping(): Promise<GatewayPingResult> {
    const start = Date.now();
    try {
      await this.simulateNetwork();
      const latencyMs = Date.now() - start;
      return {
        service: 'ICEGATE',
        healthy: true,
        latencyMs,
        environment: 'SANDBOX',
        message: 'ICEGATE Sandbox Gateway is reachable and operational.',
      };
    } catch (error: any) {
      const latencyMs = Date.now() - start;
      return {
        service: 'ICEGATE',
        healthy: false,
        latencyMs,
        environment: 'SANDBOX',
        message: error?.message || 'Gateway Ping Failed',
      };
    }
  }
}
