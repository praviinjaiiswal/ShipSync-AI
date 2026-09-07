import type { CustomsAdapter } from './customs-adapter.interface';
import type {
  BillOfEntryFilingPayload,
  CustomsFilingResponse,
  CustomsStatusQuery,
  CustomsStatusResponse,
  EsanchitUploadPayload,
  EsanchitUploadResponse,
  GatewayPingResult,
  CustomsCredentialsConfig,
} from '../types';
import { redactSensitiveData } from '@/lib/crypto/customs-crypto';

/**
 * Official ICEGATE Gateway Adapter.
 * Integrates with CBIC ICEGATE 2.0 electronic transmission endpoints.
 */
export class IcegateAdapter implements CustomsAdapter {
  public readonly serviceName = 'ICEGATE_PRODUCTION';
  private config: CustomsCredentialsConfig;

  constructor(config: CustomsCredentialsConfig) {
    this.config = config;
  }

  public async fileBillOfEntry(payload: BillOfEntryFilingPayload): Promise<CustomsFilingResponse> {
    const timestamp = new Date().toISOString();
    const endpoint = process.env.ICEGATE_ENDPOINT_URL || 'https://www.icegate.gov.in/services/be-filing';

    if (!this.config.icegateId) {
      throw new Error('ICEGATE ID is required for live customs filing.');
    }

    // Build statutory ICEGATE flat/JSON document payload
    const transmissionPayload = {
      header: {
        senderId: this.config.icegateId,
        receiverId: 'ICEGATE_CUSTOMS',
        messageType: 'BILL_OF_ENTRY',
        version: 'ICES1_5',
        timestamp,
      },
      declaration: {
        beNumber: payload.beNumber,
        iecCode: payload.importerIEC,
        portCode: payload.portOfImport,
        igmNumber: payload.igmNumber,
        blNumber: payload.blOrAwbNumber,
        hsCode: payload.hsCode,
        invoiceValue: payload.invoiceValue,
        currency: payload.currency,
        assessableValue: payload.assessableValue,
        totalDuty: payload.dutyPayable,
        dutyBreakdown: payload.dutyBreakdown,
      },
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ICEGATE-USER': this.config.icegateId,
          'X-PORT-CODE': this.config.portCode || 'INNSA1',
        },
        body: JSON.stringify(transmissionPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ICEGATE Transmission Failed (HTTP ${response.status}): ${errorText}`);
      }

      const resData = await response.json();
      return {
        success: true,
        service: 'ICEGATE',
        filingRefNumber: resData.filingRefNumber || `REF-ICE-${Date.now()}`,
        ackNumber: resData.ackNumber,
        submissionTimestamp: timestamp,
        status: resData.ackNumber ? 'ACKNOWLEDGED' : 'SUBMITTED',
        message: resData.message || 'Bill of Entry filed successfully with ICEGATE.',
        rawResponse: redactSensitiveData(resData),
      };
    } catch (err: any) {
      // Re-throw to be caught by filing queue and circuit breaker
      throw new Error(`ICEGATE Filing Error: ${err.message}`);
    }
  }

  public async checkFilingStatus(query: CustomsStatusQuery): Promise<CustomsStatusResponse> {
    const endpoint = `${process.env.ICEGATE_ENDPOINT_URL || 'https://www.icegate.gov.in/services'}/status?beNumber=${encodeURIComponent(query.beNumber || '')}&port=${encodeURIComponent(query.portCode || '')}`;

    try {
      const response = await fetch(endpoint, {
        headers: {
          'X-ICEGATE-USER': this.config.icegateId || '',
        },
      });

      if (!response.ok) {
        throw new Error(`ICEGATE Status Query Failed (HTTP ${response.status})`);
      }

      const resData = await response.json();
      return {
        service: 'ICEGATE',
        status: resData.status || 'PENDING',
        ackNumber: resData.ackNumber,
        beNumber: query.beNumber,
        assessmentDate: resData.assessmentDate,
        dutyPayable: resData.dutyPayable,
        remarks: resData.remarks,
        rawResponse: redactSensitiveData(resData),
      };
    } catch (err: any) {
      throw new Error(`ICEGATE Status Query Error: ${err.message}`);
    }
  }

  public async uploadSupportingDocument(_payload: EsanchitUploadPayload): Promise<EsanchitUploadResponse> {
    throw new Error('Supporting documents must be uploaded through the e-Sanchit adapter.');
  }

  public async ping(): Promise<GatewayPingResult> {
    const start = Date.now();
    const endpoint = `${process.env.ICEGATE_ENDPOINT_URL || 'https://www.icegate.gov.in/services'}/health`;

    try {
      const res = await fetch(endpoint, { method: 'HEAD' });
      const latencyMs = Date.now() - start;
      return {
        service: 'ICEGATE',
        healthy: res.ok,
        latencyMs,
        environment: this.config.environment,
        message: res.ok ? 'ICEGATE Gateway online' : `Gateway responded with HTTP ${res.status}`,
      };
    } catch (err: any) {
      return {
        service: 'ICEGATE',
        healthy: false,
        latencyMs: Date.now() - start,
        environment: this.config.environment,
        message: `ICEGATE connection failed: ${err.message}`,
      };
    }
  }
}
