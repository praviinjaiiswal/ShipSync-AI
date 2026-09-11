import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateCustomsDuty } from '@/lib/duty-calculator';
import { NotFoundError } from '@/lib/errors';
import { prisma } from '@/app/lib/prisma';

vi.mock('@/app/lib/prisma', () => ({
  prisma: {
    importDutyRate: {
      findUnique: vi.fn(),
    },
  },
}));

// Bypass caching for pure deterministic math calculation tests
vi.mock('@/lib/cache', () => ({
  getCached: vi.fn(() => null),
  setCached: vi.fn(),
  tenantCacheKey: vi.fn((companyId, type, hs, val) => `${companyId}:${type}:${hs}:${val}`),
  CACHE_TTL: { DUTY_CALC: 300000 },
}));

describe('lib/duty-calculator.ts — CBIC Statutory Customs Duty Formula', () => {
  const companyId = 'test-tenant-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Example 1: Calculates standard industrial goods (BCD 7.5%, SWS 10%, IGST 18%)', async () => {
    // Known Example:
    // CIF = ₹1,000,000
    // Landing Charges (1%) = ₹10,000
    // Assessable Value = ₹1,010,000
    // BCD (7.5%) = ₹75,750
    // SWS (10% of BCD) = ₹7,575
    // IGST Base = Assessable Value + BCD + SWS = ₹1,093,325
    // IGST (18%) = ₹196,798.50
    // Total Duty Payable = 75,750 + 7,575 + 196,798.50 = ₹280,123.50
    (prisma.importDutyRate.findUnique as any).mockResolvedValueOnce({
      hsCode: '84713010',
      bcdRate: 0.075,
      igstRate: 0.18,
      cessRate: 0.0,
      sourceNotificationRef: 'Notif 50/2017-Customs',
      updatedAt: new Date('2026-08-01'),
    });

    const result = await calculateCustomsDuty(companyId, '84713010', 1000000);

    expect(result.cifValue).toBe(1000000);
    expect(result.landingCharges).toBe(10000);
    expect(result.assessableValue).toBe(1010000);
    expect(result.bcdRate).toBe(0.075);
    expect(result.bcdAmount).toBe(75750);
    expect(result.swsRate).toBe(0.10);
    expect(result.swsAmount).toBe(7575);
    expect(result.igstRate).toBe(0.18);
    expect(result.igstAmount).toBe(196798.50);
    expect(result.cessAmount).toBe(0);
    expect(result.totalDutyPayable).toBe(280123.50);
  });

  it('Example 2: Calculates zero-BCD capital goods (BCD 0%, SWS 0%, IGST 18%)', async () => {
    // Known Example:
    // CIF = ₹500,000
    // Landing Charges (1%) = ₹5,000
    // Assessable Value = ₹505,000
    // BCD (0%) = ₹0
    // SWS (10% of 0) = ₹0
    // IGST Base = Assessable Value = ₹505,000
    // IGST (18%) = ₹90,900
    // Total Duty Payable = ₹90,900
    (prisma.importDutyRate.findUnique as any).mockResolvedValueOnce({
      hsCode: '84715000',
      bcdRate: 0.0,
      igstRate: 0.18,
      cessRate: 0.0,
      sourceNotificationRef: 'Notif 24/2005-Customs (ITA-1)',
      updatedAt: new Date('2026-08-15'),
    });

    const result = await calculateCustomsDuty(companyId, '84715000', 500000);

    expect(result.landingCharges).toBe(5000);
    expect(result.assessableValue).toBe(505000);
    expect(result.bcdAmount).toBe(0);
    expect(result.swsAmount).toBe(0);
    expect(result.igstAmount).toBe(90900);
    expect(result.totalDutyPayable).toBe(90900);
  });

  it('Example 3: Calculates luxury / auto with compensation cess (BCD 15%, SWS 10%, IGST 28%, Cess 15%)', async () => {
    // Known Example:
    // CIF = ₹2,000,000
    // Landing Charges (1%) = ₹20,000
    // Assessable Value = ₹2,020,000
    // BCD (15%) = 2,020,000 * 0.15 = ₹303,000
    // SWS (10% of BCD) = ₹30,300
    // IGST Base = 2,020,000 + 303,000 + 30,300 = ₹2,353,300
    // IGST (28%) = 2,353,300 * 0.28 = ₹658,924
    // Cess (15% on Assessable Value) = 2,020,000 * 0.15 = ₹303,000
    // Total Duty Payable = 303,000 + 30,300 + 658,924 + 303,000 = ₹1,295,224
    (prisma.importDutyRate.findUnique as any).mockResolvedValueOnce({
      hsCode: '87032300',
      bcdRate: 0.15,
      igstRate: 0.28,
      cessRate: 0.15,
      sourceNotificationRef: 'Notif 50/2017-Customs (Sch II)',
      updatedAt: new Date('2026-08-20'),
    });

    const result = await calculateCustomsDuty(companyId, '87032300', 2000000);

    expect(result.landingCharges).toBe(20000);
    expect(result.assessableValue).toBe(2020000);
    expect(result.bcdAmount).toBe(303000);
    expect(result.swsAmount).toBe(30300);
    expect(result.igstAmount).toBe(658924);
    expect(result.cessAmount).toBe(303000);
    expect(result.totalDutyPayable).toBe(1295224);
  });

  it('Example 4: Calculates decimal precision on odd figures (CIF ₹125,500 with BCD 10%, IGST 12%)', async () => {
    // Known Example:
    // CIF = ₹125,500
    // Landing Charges (1%) = ₹1,255
    // Assessable Value = ₹126,755
    // BCD (10%) = ₹12,675.50
    // SWS (10% of BCD) = ₹1,267.55
    // IGST Base = 126,755 + 12,675.50 + 1,267.55 = ₹140,698.05
    // IGST (12%) = 140,698.05 * 0.12 = ₹16,883.77 (rounded)
    // Total Duty Payable = 12,675.50 + 1,267.55 + 16,883.77 = ₹30,826.82
    (prisma.importDutyRate.findUnique as any).mockResolvedValueOnce({
      hsCode: '90278090',
      bcdRate: 0.10,
      igstRate: 0.12,
      cessRate: 0.0,
      sourceNotificationRef: 'Notif 50/2017-Customs',
      updatedAt: new Date('2026-09-01'),
    });

    const result = await calculateCustomsDuty(companyId, '90278090', 125500);

    expect(result.landingCharges).toBe(1255);
    expect(result.assessableValue).toBe(126755);
    expect(result.bcdAmount).toBe(12675.50);
    expect(result.swsAmount).toBe(1267.55);
    expect(result.igstAmount).toBe(16883.77);
    expect(result.totalDutyPayable).toBe(30826.82);
  });

  it('Throws NotFoundError when tariff rate is missing', async () => {
    (prisma.importDutyRate.findUnique as any).mockResolvedValueOnce(null);

    await expect(calculateCustomsDuty(companyId, '99999999', 100000)).rejects.toThrow(
      NotFoundError
    );
  });
});
