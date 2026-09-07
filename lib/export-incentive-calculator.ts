import { prisma } from '@/app/lib/prisma';
import { getCached, setCached, tenantCacheKey, CACHE_TTL } from '@/lib/cache';

export interface ExportIncentiveBreakdown {
  hsCode: string;
  fobValue: number;
  currency: string;
  quantity?: number;
  rodtepRate: number;      // e.g. 0.025 for 2.5%
  rodtepAmount: number;
  rodtepCapPerUnit?: number | null;
  isRoDTEPCapped: boolean;
  drawbackRate: number;    // e.g. 0.015 for 1.5%
  drawbackAmount: number;
  exportDutyRate: number;  // e.g. 0.0 for exempt, 0.20 for 20%
  exportDutyAmount: number;
  totalIncentiveAmount: number;
  sourceNotification: string;
}

/**
 * Calculates statutory Indian export incentives (RoDTEP & Duty Drawback)
 * under Foreign Trade Policy (FTP).
 */
export async function calculateExportIncentives(
  companyId: string,
  hsCode: string,
  fobValue: number,
  currency = 'USD',
  quantity?: number
): Promise<ExportIncentiveBreakdown> {
  const normalizedHs = hsCode.replace(/\s+/g, '');
  const cacheKey = tenantCacheKey(
    companyId,
    'export-incentive',
    `${normalizedHs}:${fobValue}:${quantity || 0}`
  );

  const cached = getCached<ExportIncentiveBreakdown>(cacheKey);
  if (cached) {
    return cached;
  }

  // 1. Fetch official statutory rate from DutyIncentiveRate table
  const rateRecord = await prisma.dutyIncentiveRate.findUnique({
    where: { hsCode: normalizedHs },
  });

  // Handle rates: normalize to fraction (rates in DB stored as percentages e.g. 2.5% or 1.0%)
  const rawRodtep = rateRecord?.rodtepRate ?? 2.0; // Default 2.0%
  const rodtepRate = rawRodtep >= 1 ? rawRodtep / 100 : rawRodtep;

  const rawDrawback = rateRecord?.dutyDrawbackRate ?? 1.5; // Default 1.5%
  const drawbackRate = rawDrawback >= 1 ? rawDrawback / 100 : rawDrawback;

  const rawExportDuty = rateRecord?.exportDutyRate ?? 0.0;
  const exportDutyRate = rawExportDuty >= 1 ? rawExportDuty / 100 : rawExportDuty;

  const rodtepCapPerUnit = rateRecord?.rodtepCapPerUnit ?? null;

  // 2. Compute RoDTEP amount
  let rodtepAmount = Math.round(fobValue * rodtepRate * 100) / 100;
  let isRoDTEPCapped = false;

  if (rodtepCapPerUnit && quantity && quantity > 0) {
    const totalCap = Math.round(quantity * rodtepCapPerUnit * 100) / 100;
    if (rodtepAmount > totalCap) {
      rodtepAmount = totalCap;
      isRoDTEPCapped = true;
    }
  }

  // 3. Compute Duty Drawback amount
  const drawbackAmount = Math.round(fobValue * drawbackRate * 100) / 100;

  // 4. Compute Export Duty (if applicable)
  const exportDutyAmount = Math.round(fobValue * exportDutyRate * 100) / 100;

  // 5. Total Net Incentive Benefit
  const totalIncentiveAmount = Math.max(
    0,
    Math.round((rodtepAmount + drawbackAmount - exportDutyAmount) * 100) / 100
  );

  const breakdown: ExportIncentiveBreakdown = {
    hsCode: normalizedHs,
    fobValue,
    currency,
    quantity,
    rodtepRate,
    rodtepAmount,
    rodtepCapPerUnit,
    isRoDTEPCapped,
    drawbackRate,
    drawbackAmount,
    exportDutyRate,
    exportDutyAmount,
    totalIncentiveAmount,
    sourceNotification: rateRecord?.source || 'DGFT Notification No. 19/2015-2020 (RoDTEP Schedule)',
  };

  // Cache for 5 minutes
  setCached(cacheKey, breakdown, CACHE_TTL.DUTY_RATE);

  return breakdown;
}
