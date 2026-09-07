import type {
  GatewayPingResult,
  CustomsCredentialsConfig,
} from '../types';

export interface DgftIecDetails {
  iec: string;
  entityName: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
  delStatus: boolean; // Denied Entity List
  pan: string;
  issueDate?: string;
  address?: string;
}

/**
 * DGFT (Directorate General of Foreign Trade) API Adapter.
 * Validates IEC, Denied Entity List (DEL) status, and EPCG/Advance Authorization licenses.
 */
export class DgftAdapter {
  private config: CustomsCredentialsConfig;

  constructor(config: CustomsCredentialsConfig) {
    this.config = config;
  }

  public async verifyIec(iec: string): Promise<DgftIecDetails> {
    if (this.config.environment === 'SANDBOX') {
      // Sandbox mock response
      return {
        iec,
        entityName: 'SHPSYNC TEST TRADING PRIVATE LIMITED',
        status: 'ACTIVE',
        delStatus: false,
        pan: 'AAACS1234F',
        issueDate: '2020-01-15',
        address: 'Nariman Point, Mumbai, Maharashtra 400021',
      };
    }

    const endpoint = `${process.env.DGFT_API_URL || 'https://dgft.gov.in/services'}/iec-status/${encodeURIComponent(iec)}`;
    try {
      const response = await fetch(endpoint, {
        headers: {
          'X-API-KEY': process.env.DGFT_API_KEY || '',
        },
      });

      if (!response.ok) {
        throw new Error(`DGFT IEC Verification Failed (HTTP ${response.status})`);
      }

      return await response.json();
    } catch (err: any) {
      throw new Error(`DGFT API Error: ${err.message}`);
    }
  }

  public async ping(): Promise<GatewayPingResult> {
    const start = Date.now();
    try {
      if (this.config.environment === 'SANDBOX') {
        return {
          service: 'DGFT',
          healthy: true,
          latencyMs: 35,
          environment: 'SANDBOX',
          message: 'DGFT Sandbox API is reachable.',
        };
      }

      const res = await fetch(`${process.env.DGFT_API_URL || 'https://dgft.gov.in'}/health`, { method: 'HEAD' });
      return {
        service: 'DGFT',
        healthy: res.ok,
        latencyMs: Date.now() - start,
        environment: this.config.environment,
        message: res.ok ? 'DGFT API online' : `DGFT returned HTTP ${res.status}`,
      };
    } catch (err: any) {
      return {
        service: 'DGFT',
        healthy: false,
        latencyMs: Date.now() - start,
        environment: this.config.environment,
        message: err.message,
      };
    }
  }
}
