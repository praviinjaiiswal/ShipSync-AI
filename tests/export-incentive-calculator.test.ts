import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateExportIncentives } from '@/lib/export-incentive-calculator';
import { prisma } from '@/app/lib/prisma';

vi.mock('@/app/lib/prisma', () => ({
  prisma: {
    dutyIncentiveRate: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/cache', () => ({
  getCached: vi.fn(() => null),
  setCached: vi.fn(),
  tenantCacheKey: vi.fn((companyId, type, key) => `${companyId}:${type}:${key}`),
  CACHE_TTL: { DUTY_RATE: 300000 },
}));

describe('lib/export-incentive-calculator.ts — FTP Export Incentives (RoDTEP & Drawback)', () => {
  const companyId = 'tenant-export-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Calculates standard uncapped RoDTEP and Duty Drawback', async () => {
    // Known Good Example:
    // FOB Value = ₹1,000,000
    // RoDTEP Rate = 2.5% -> ₹25,000
    // Drawback Rate = 1.5% -> ₹15,000
    // Export Duty = 0% -> ₹0
    // Total Incentive = ₹25,000 + ₹15,000 = ₹40,000
    (prisma.dutyIncentiveRate.findUnique as any).mockResolvedValueOnce({
      hsCode: '61091000',
      rodtepRate: 2.5,
      dutyDrawbackRate: 1.5,
      exportDutyRate: 0.0,
      rodtepCapPerUnit: null,
      source: 'DGFT RoDTEP Schedule Appendix 4R',
      updatedAt: new Date('2026-08-10'),
    });

    const result = await calculateExportIncentives(companyId, '61091000', 1000000, 'INR');

    expect(result.fobValue).toBe(1000000);
    expect(result.rodtepRate).toBe(0.025);
    expect(result.rodtepAmount).toBe(25000);
    expect(result.isRoDTEPCapped).toBe(false);
    expect(result.drawbackRate).toBe(0.015);
    expect(result.drawbackAmount).toBe(15000);
    expect(result.exportDutyAmount).toBe(0);
    expect(result.totalIncentiveAmount).toBe(40000);
  });

  it('Correctly caps RoDTEP benefit when per-unit cap ceiling is exceeded', async () => {
    // Known Good Capping Example:
    // FOB Value = ₹1,000,000
    // Quantity = 1,000 pieces
    // Cap per unit = ₹15.00 -> Max RoDTEP = 1,000 * 15 = ₹15,000
    // Raw RoDTEP (2.5%) = ₹25,000 (> ₹15,000 cap)
    // Capped RoDTEP Amount = ₹15,000
    // Drawback (1.5%) = ₹15,000
    // Total Net Benefit = ₹30,000
    (prisma.dutyIncentiveRate.findUnique as any).mockResolvedValueOnce({
      hsCode: '62046200',
      rodtepRate: 2.5,
      dutyDrawbackRate: 1.5,
      exportDutyRate: 0.0,
      rodtepCapPerUnit: 15.0,
      source: 'DGFT RoDTEP Schedule Appendix 4R',
      updatedAt: new Date('2026-08-10'),
    });

    const result = await calculateExportIncentives(
      companyId,
      '62046200',
      1000000,
      'INR',
      1000 // quantity
    );

    expect(result.rodtepAmount).toBe(15000);
    expect(result.isRoDTEPCapped).toBe(true);
    expect(result.drawbackAmount).toBe(15000);
    expect(result.totalIncentiveAmount).toBe(30000);
  });

  it('Deducts export duty when applicable, flooring net incentive at zero', async () => {
    // FOB = ₹500,000
    // RoDTEP = 2.0% (₹10,000)
    // Drawback = 1.0% (₹5,000)
    // Export Duty = 10.0% (₹50,000)
    // Net Incentive = max(0, 10,000 + 5,000 - 50,000) = 0
    (prisma.dutyIncentiveRate.findUnique as any).mockResolvedValueOnce({
      hsCode: '26011100', // Iron ore subject to export duty
      rodtepRate: 2.0,
      dutyDrawbackRate: 1.0,
      exportDutyRate: 10.0,
      rodtepCapPerUnit: null,
      source: 'Customs Export Tariff',
      updatedAt: new Date('2026-08-10'),
    });

    const result = await calculateExportIncentives(companyId, '26011100', 500000, 'INR');

    expect(result.rodtepAmount).toBe(10000);
    expect(result.drawbackAmount).toBe(5000);
    expect(result.exportDutyAmount).toBe(50000);
    expect(result.totalIncentiveAmount).toBe(0);
  });
});
