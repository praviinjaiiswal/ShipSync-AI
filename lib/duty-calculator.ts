/**
 * Customs Duty Calculation Engine (CBIC Standard Formula)
 * 
 * Rules:
 * 1. Assessable Value = CIF Value + 1% Landing Charges
 * 2. BCD (Basic Customs Duty) = Assessable Value × bcdRate
 * 3. SWS (Social Welfare Surcharge) = BCD × 10%
 * 4. IGST (Integrated GST) = (Assessable Value + BCD + SWS) × igstRate
 * 5. Total Duty Payable = BCD + SWS + IGST + Cess
 * 
 * Caching: Results cached for 5 minutes (300,000ms) with tenant-safe keys.
 */

import { prisma } from '@/app/lib/prisma';
import { getCached, setCached, tenantCacheKey, CACHE_TTL } from '@/lib/cache';
import { NotFoundError } from '@/lib/errors';

export interface DutyCalculationBreakdown {
  hsCode: string;
  cifValue: number;
  landingCharges: number;
  assessableValue: number;
  bcdRate: number;
  bcdAmount: number;
  swsRate: number;
  swsAmount: number;
  igstRate: number;
  igstAmount: number;
  cessRate: number;
  cessAmount: number;
  totalDutyPayable: number;
  sourceNotificationRef: string;
  lastUpdatedDate?: string;
  isOlderThan90Days?: boolean;
  isCached?: boolean;
}

/**
 * Calculate full customs duty breakdown according to CBIC statutory formulas.
 */
export async function calculateCustomsDuty(
  companyId: string,
  hsCode: string,
  cifValue: number,
  landingChargePct: number = 0.01
): Promise<DutyCalculationBreakdown> {
  const roundedCif = Math.round(cifValue * 100) / 100;
  const landingCharges = Math.round(roundedCif * landingChargePct * 100) / 100;
  const assessableValue = Math.round((roundedCif + landingCharges) * 100) / 100;

  // Check 5-minute tenant-namespaced cache first
  const cacheKey = tenantCacheKey(companyId, 'duty_calc', hsCode, String(assessableValue));
  const cached = getCached<DutyCalculationBreakdown>(cacheKey);
  if (cached) {
    return { ...cached, isCached: true };
  }

  // Look up official duty rate from reference table
  const rateRecord = await prisma.importDutyRate.findUnique({
    where: { hsCode },
  });

  if (!rateRecord) {
    throw new NotFoundError(`No import duty rate found for HS Code ${hsCode}. Unknown codes must be maintained in the tariff schedule.`);
  }

  const bcdRate = rateRecord.bcdRate;
  const igstRate = rateRecord.igstRate;
  const cessRate = rateRecord.cessRate || 0.0;
  const swsRate = 0.10; // Statutory 10% of BCD

  const bcdAmount = Math.round(assessableValue * bcdRate * 100) / 100;
  const swsAmount = Math.round(bcdAmount * swsRate * 100) / 100;
  const igstBase = assessableValue + bcdAmount + swsAmount;
  const igstAmount = Math.round(igstBase * igstRate * 100) / 100;
  const cessAmount = Math.round(assessableValue * cessRate * 100) / 100;

  const totalDutyPayable = Math.round((bcdAmount + swsAmount + igstAmount + cessAmount) * 100) / 100;

  const updatedAt = rateRecord.updatedAt || rateRecord.createdAt || new Date();
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const isOlderThan90Days = updatedAt < ninetyDaysAgo;
  const lastUpdatedDate = updatedAt.toISOString().split('T')[0];

  const result: DutyCalculationBreakdown = {
    hsCode,
    cifValue: roundedCif,
    landingCharges,
    assessableValue,
    bcdRate,
    bcdAmount,
    swsRate,
    swsAmount,
    igstRate,
    igstAmount,
    cessRate,
    cessAmount,
    totalDutyPayable,
    sourceNotificationRef: rateRecord.sourceNotificationRef || 'Customs Notification No. 50/2017-Customs',
    lastUpdatedDate,
    isOlderThan90Days,
    isCached: false,
  };

  // Cache for 5 minutes (form tweaking session)
  setCached(cacheKey, result, CACHE_TTL.DUTY_CALC);

  return result;
}
