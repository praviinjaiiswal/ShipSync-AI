import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runComplianceRules } from '@/lib/compliance/rule-engine';
import { prisma } from '@/app/lib/prisma';
import type { Shipment, Company } from '@prisma/client';

vi.mock('@/app/lib/prisma', () => ({
  prisma: {
    license: {
      findFirst: vi.fn(),
    },
    tariffSchedule: {
      findFirst: vi.fn(),
    },
    sanctionsCheck: {
      findFirst: vi.fn(),
    },
    document: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/cache', () => ({
  getCached: vi.fn(() => null),
  setCached: vi.fn(),
  globalCacheKey: vi.fn((prefix, key) => `${prefix}:${key}`),
}));

describe('lib/compliance/rule-engine.ts — Statutory Compliance Engine', () => {
  const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  const IEC_REGEX = /^[A-Z0-9]{10}$/i;

  const validCompany: Company = {
    id: 'comp-1',
    name: 'Bharat Exports Pvt Ltd',
    ieCode: '0512345678',
    gstNumber: '27AAPFU0939F1ZV',
    panNumber: 'AAPFU0939F',
    address: '101 Export Plaza, Mumbai',
    plan: 'FREE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const validShipment: Shipment = {
    id: 'ship-1',
    companyId: 'comp-1',
    userId: 'user-1',
    buyerName: 'Global Trade Corp Ltd',
    buyerCountry: 'AE',
    buyerEmail: 'ops@globaltrade.ae',
    productDesc: '100% Cotton Knitted T-Shirts',
    hsCode: '6109.10.00',
    value: 50000,
    currency: 'USD',
    incoterm: 'FOB',
    portOfLoading: 'INNSA1',
    portOfDischarge: 'AEJEA',
    status: 'UNDER_REVIEW',
    isLocked: false,
    complianceScore: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Statutory Format Validation: IEC (Importer Exporter Code)', () => {
    it('accepts valid 10-character alphanumeric IECs', () => {
      const validCodes = ['0512345678', 'AAAPB1234C', '0123456789', 'B1C2D3E4F5', '0308012345'];
      for (const code of validCodes) {
        expect(IEC_REGEX.test(code)).toBe(true);
      }
    });

    it('rejects invalid IECs (wrong lengths, special chars, whitespace)', () => {
      const invalidCodes = [
        '051234567', // 9 chars (too short)
        '05123456789', // 11 chars (too long)
        '05-1234567', // hyphen
        '05123 4567', // space
        '051234567@', // symbol
        '', // empty
      ];
      for (const code of invalidCodes) {
        expect(IEC_REGEX.test(code)).toBe(false);
      }
    });
  });

  describe('Statutory Format Validation: GSTIN (15-character Goods & Services Tax Number)', () => {
    it('accepts valid statutory 15-character GSTINs', () => {
      const validGSTINs = [
        '27AAPFU0939F1ZV', // Maharashtra
        '07AAAAA0000A1Z5', // Delhi
        '29ABCDE1234F1Z5', // Karnataka
        '36AAACB1234A1Z1', // Telangana
        '24AAACC1234D1ZQ', // Gujarat
      ];
      for (const gstin of validGSTINs) {
        expect(GSTIN_REGEX.test(gstin)).toBe(true);
      }
    });

    it('rejects invalid statutory GSTINs', () => {
      const invalidGSTINs = [
        '27AAPFU0939F1Z', // 14 chars (too short)
        '27AAPFU0939F1ZVV', // 16 chars (too long)
        'XXAAPFU0939F1ZV', // Non-numeric state code
        '27aapfu0939f1zv', // Lowercase
        '27AAPFU0939F1AV', // 14th char not 'Z'
        '27AAPFU0939F1Z@', // Symbol in check digit
        '',
      ];
      for (const gstin of invalidGSTINs) {
        expect(GSTIN_REGEX.test(gstin)).toBe(false);
      }
    });
  });

  describe('Deterministic Pass/Fail Rule Engine (runComplianceRules)', () => {
    it('passes completely when all 5 statutory criteria are met', async () => {
      (prisma.license.findFirst as any).mockResolvedValueOnce(null); // Company ieCode fallback used
      (prisma.tariffSchedule.findFirst as any).mockResolvedValueOnce({
        id: 'ts-1',
        hsCode: '61091000',
        description: 'T-shirts, singlets and other vests, of cotton, knitted or crocheted',
      });
      (prisma.sanctionsCheck.findFirst as any).mockResolvedValueOnce({
        id: 'sanc-1',
        matchFound: false,
      });
      (prisma.document.findMany as any).mockResolvedValueOnce([
        { docType: 'COMMERCIAL_INVOICE', fileUrl: 'https://cdn.test/inv.pdf' },
        { docType: 'PACKING_LIST', fileUrl: 'https://cdn.test/pl.pdf' },
      ]);

      const result = await runComplianceRules(validShipment, validCompany);

      expect(result.passed).toBe(true);
      expect(result.failedRules).toHaveLength(0);
      expect(result.passedRules).toHaveLength(5);
    });

    it('fails when IEC is invalid or absent', async () => {
      (prisma.license.findFirst as any).mockResolvedValueOnce(null);
      (prisma.tariffSchedule.findFirst as any).mockResolvedValueOnce({ hsCode: '61091000', description: 'Cotton' });
      (prisma.sanctionsCheck.findFirst as any).mockResolvedValueOnce({ matchFound: false });
      (prisma.document.findMany as any).mockResolvedValueOnce([
        { docType: 'COMMERCIAL_INVOICE', fileUrl: 'https://cdn.test/inv.pdf' },
        { docType: 'PACKING_LIST', fileUrl: 'https://cdn.test/pl.pdf' },
      ]);

      const invalidCompany = { ...validCompany, ieCode: 'INVALID-IEC' };
      const result = await runComplianceRules(validShipment, invalidCompany);

      expect(result.passed).toBe(false);
      expect(result.failedRules.some((r) => r.rule === 'RULE_IEC_VALID' && r.severity === 'BLOCKING')).toBe(true);
    });

    it('fails when HS Code is not grounded in the TariffSchedule', async () => {
      (prisma.license.findFirst as any).mockResolvedValueOnce(null);
      (prisma.tariffSchedule.findFirst as any).mockResolvedValueOnce(null); // Not in database
      (prisma.sanctionsCheck.findFirst as any).mockResolvedValueOnce({ matchFound: false });
      (prisma.document.findMany as any).mockResolvedValueOnce([
        { docType: 'COMMERCIAL_INVOICE', fileUrl: 'https://cdn.test/inv.pdf' },
        { docType: 'PACKING_LIST', fileUrl: 'https://cdn.test/pl.pdf' },
      ]);

      const ungroundedShipment = { ...validShipment, hsCode: '9999.99.99' };
      const result = await runComplianceRules(ungroundedShipment, validCompany);

      expect(result.passed).toBe(false);
      expect(result.failedRules.some((r) => r.rule === 'RULE_HS_TARIFF_GROUNDED')).toBe(true);
    });

    it('fails when Buyer has not cleared sanctions screening or has a match', async () => {
      (prisma.license.findFirst as any).mockResolvedValueOnce(null);
      (prisma.tariffSchedule.findFirst as any).mockResolvedValueOnce({ hsCode: '61091000', description: 'Cotton' });
      // Sanctions check returned matchFound: true
      (prisma.sanctionsCheck.findFirst as any).mockResolvedValueOnce({
        id: 'sanc-2',
        matchFound: true,
      });
      (prisma.document.findMany as any).mockResolvedValueOnce([
        { docType: 'COMMERCIAL_INVOICE', fileUrl: 'https://cdn.test/inv.pdf' },
        { docType: 'PACKING_LIST', fileUrl: 'https://cdn.test/pl.pdf' },
      ]);

      const result = await runComplianceRules(validShipment, validCompany);

      expect(result.passed).toBe(false);
      expect(result.failedRules.some((r) => r.rule === 'RULE_SANCTIONS_CLEARED')).toBe(true);
    });

    it('fails when mandatory export documents (Invoice / Packing List) are missing', async () => {
      (prisma.license.findFirst as any).mockResolvedValueOnce(null);
      (prisma.tariffSchedule.findFirst as any).mockResolvedValueOnce({ hsCode: '61091000', description: 'Cotton' });
      (prisma.sanctionsCheck.findFirst as any).mockResolvedValueOnce({ matchFound: false });
      // Missing Packing List
      (prisma.document.findMany as any).mockResolvedValueOnce([
        { docType: 'COMMERCIAL_INVOICE', fileUrl: 'https://cdn.test/inv.pdf' },
      ]);

      const result = await runComplianceRules(validShipment, validCompany);

      expect(result.passed).toBe(false);
      expect(result.failedRules.some((r) => r.rule === 'RULE_MANDATORY_DOCUMENTS')).toBe(true);
    });
  });
});
