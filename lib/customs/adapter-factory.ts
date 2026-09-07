import { prisma } from '@/app/lib/prisma';
import { decryptCustomsData } from '@/lib/crypto/customs-crypto';
import type { CustomsAdapter } from './adapters/customs-adapter.interface';
import { MockCustomsAdapter } from './adapters/mock-customs-adapter';
import { IcegateAdapter } from './adapters/icegate-adapter';
import { EsanchitAdapter } from './adapters/esanchit-adapter';
import { DgftAdapter } from './adapters/dgft-adapter';
import type { CustomsCredentialsConfig } from './types';
import type { CustomsServiceType } from '@prisma/client';

/**
 * Resolves the appropriate Customs Adapter for a company.
 */
export async function getCustomsAdapter(
  companyId: string,
  service: CustomsServiceType = 'ICEGATE'
): Promise<CustomsAdapter> {
  // Check global environment override
  const forcedMode = process.env.CUSTOMS_ADAPTER_MODE; // 'MOCK' | 'LIVE'
  if (forcedMode === 'MOCK') {
    return new MockCustomsAdapter();
  }

  // Fetch company's customs credentials
  const credential = await prisma.customsCredential.findFirst({
    where: {
      companyId,
      service,
      isActive: true,
    },
  });

  if (!credential) {
    // Default to Sandbox Mock adapter when no credentials configured
    return new MockCustomsAdapter();
  }

  // Decrypt credentials
  let decryptedSecrets: Record<string, any> = {};
  try {
    decryptedSecrets = decryptCustomsData({
      encryptedData: credential.encryptedData,
      iv: credential.iv,
      authTag: credential.authTag,
    });
  } catch (err) {
    console.error(`Failed to decrypt customs credential for company ${companyId}`, err);
    return new MockCustomsAdapter();
  }

  const config: CustomsCredentialsConfig = {
    icegateId: credential.icegateId || undefined,
    iecCode: credential.iecCode || undefined,
    portCode: credential.portCode || undefined,
    password: decryptedSecrets.password,
    dscPin: decryptedSecrets.dscPin,
    certificateData: decryptedSecrets.certificateData,
    environment: credential.environment,
  };

  if (credential.environment === 'SANDBOX') {
    return new MockCustomsAdapter();
  }

  // In PRODUCTION:
  if (service === 'ICEGATE') {
    return new IcegateAdapter(config);
  } else if (service === 'ESANCHIT') {
    // Return wrapped adapter satisfying CustomsAdapter interface
    const esanchit = new EsanchitAdapter(config);
    return {
      serviceName: 'ESANCHIT_PRODUCTION',
      fileBillOfEntry: () => {
        throw new Error('Bill of Entry must be filed via ICEGATE, not e-Sanchit.');
      },
      checkFilingStatus: () => {
        throw new Error('Status queries must be routed to ICEGATE.');
      },
      uploadSupportingDocument: (p) => esanchit.uploadSupportingDocument(p),
      ping: () => esanchit.ping(),
    };
  }

  return new MockCustomsAdapter();
}

/**
 * Helper to get the DGFT adapter for a company.
 */
export async function getDgftAdapter(companyId: string): Promise<DgftAdapter> {
  const credential = await prisma.customsCredential.findFirst({
    where: { companyId, service: 'DGFT', isActive: true },
  });

  if (!credential || credential.environment === 'SANDBOX') {
    return new DgftAdapter({ environment: 'SANDBOX' });
  }

  let secrets: any = {};
  try {
    secrets = decryptCustomsData({
      encryptedData: credential.encryptedData,
      iv: credential.iv,
      authTag: credential.authTag,
    });
  } catch {
    // Fallback to sandbox
  }

  return new DgftAdapter({
    iecCode: credential.iecCode || undefined,
    password: secrets.apiKey,
    environment: credential.environment,
  });
}
