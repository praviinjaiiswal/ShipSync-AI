import {
  ExportRealisationStatus,
  DutyPaymentStatus,
  FinancialEntityType,
} from '@prisma/client';
import { prisma } from '@/app/lib/prisma';

/**
 * Standard RBI statutory realization period: 9 months (270 days)
 * under Foreign Exchange Management (Export of Goods and Services) Regulations.
 */
export const RBI_REALISATION_TIMELINE_MONTHS = 9;

/**
 * Calculate the RBI statutory overdue deadline from the export / shipping bill date.
 */
export function calculateBrcOverdueDate(
  exportDate: Date,
  timelineMonths: number = RBI_REALISATION_TIMELINE_MONTHS
): Date {
  const deadline = new Date(exportDate);
  deadline.setMonth(deadline.getMonth() + timelineMonths);
  return deadline;
}

/**
 * Evaluate the realization status and overdue flag based on invoice value vs amount realised.
 */
export function evaluateRealisationStatus(
  invoiceValue: number,
  amountRealised: number,
  overdueDate: Date,
  currentStatus?: ExportRealisationStatus
): { status: ExportRealisationStatus; isOverdue: boolean } {
  const now = new Date();
  const isPastDeadline = now.getTime() > overdueDate.getTime();

  // If already confirmed as fully realised, maintain it
  if (amountRealised >= invoiceValue && invoiceValue > 0) {
    return {
      status: 'FULLY_REALISED',
      isOverdue: false,
    };
  }

  if (isPastDeadline) {
    return {
      status: 'OVERDUE',
      isOverdue: true,
    };
  }

  if (amountRealised > 0) {
    return {
      status: 'PARTIALLY_REALISED',
      isOverdue: false,
    };
  }

  return {
    status: currentStatus || 'PENDING',
    isOverdue: false,
  };
}

/**
 * Validate duty payment amount against the calculated duty from Bill of Entry.
 * Allows a minor rounding tolerance of ₹1.00.
 */
export function validateDutyPaymentAgainstBoE(
  totalDutyPayable: number,
  amountPaid: number
): {
  isMatch: boolean;
  difference: number;
  status: DutyPaymentStatus;
  discrepancyReason?: string;
} {
  const difference = Number((amountPaid - totalDutyPayable).toFixed(2));
  const tolerance = 1.0; // ₹1 tolerance for rounding

  if (Math.abs(difference) <= tolerance) {
    return {
      isMatch: true,
      difference,
      status: 'VERIFIED',
    };
  }

  const discrepancyReason =
    difference < 0
      ? `Short payment detected: Paid ₹${amountPaid.toLocaleString('en-IN')} vs Calculated ₹${totalDutyPayable.toLocaleString('en-IN')} (Difference: ₹${Math.abs(difference).toLocaleString('en-IN')})`
      : `Excess payment recorded: Paid ₹${amountPaid.toLocaleString('en-IN')} vs Calculated ₹${totalDutyPayable.toLocaleString('en-IN')} (Surplus: ₹${difference.toLocaleString('en-IN')})`;

  return {
    isMatch: false,
    difference,
    status: 'MISMATCH',
    discrepancyReason,
  };
}

/**
 * Verify statutory precondition gate checks before an Incentive Claim can be filed:
 * 1. Shipment status must be SHIPPED, CUSTOMS_CLEARED, or DELIVERED.
 * 2. Export Realisation (BRC) must exist and NOT be OVERDUE.
 * 3. Required export documents (Commercial Invoice, Packing List, Shipping Bill) must be present.
 */
export function verifyIncentiveClaimPreconditions(
  shipment: {
    status: string;
    documents?: { docType: string }[];
    exportRealisations?: { status: ExportRealisationStatus; isOverdue: boolean }[];
  }
): { isEligible: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Gate Check 1: Shipment status
  const eligibleStatuses = ['SHIPPED', 'CUSTOMS_CLEARED', 'GATE_IN', 'DELIVERED'];
  if (!eligibleStatuses.includes(shipment.status)) {
    reasons.push(
      `Shipment status '${shipment.status}' is not eligible for incentive filing. Must be SHIPPED or CUSTOMS_CLEARED.`
    );
  }

  // Gate Check 2: BRC Realisation
  const realisations = shipment.exportRealisations || [];
  const hasOverdue = realisations.some((r) => r.isOverdue || r.status === 'OVERDUE');
  if (hasOverdue) {
    reasons.push(
      'Export foreign exchange realization is OVERDUE per RBI 9-month guidelines. Claim cannot be filed with overdue BRC.'
    );
  }

  // Gate Check 3: Essential Document Presence
  const docs = shipment.documents || [];
  const docTypes = new Set(docs.map((d) => d.docType));
  if (!docTypes.has('COMMERCIAL_INVOICE')) {
    reasons.push('Missing statutory Commercial Invoice document.');
  }
  if (!docTypes.has('SHIPPING_BILL')) {
    reasons.push('Missing statutory Shipping Bill document.');
  }

  return {
    isEligible: reasons.length === 0,
    reasons,
  };
}

/**
 * Record an immutable append-only financial audit log entry.
 */
export async function recordFinancialAudit(
  companyId: string,
  params: {
    entityType: FinancialEntityType;
    entityId: string;
    action: string;
    previousValue?: any;
    newValue: any;
    performedBy: string;
    reason?: string;
  }
) {
  return prisma.financialAuditLog.create({
    data: {
      companyId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      previousValue: params.previousValue ? JSON.parse(JSON.stringify(params.previousValue)) : undefined,
      newValue: JSON.parse(JSON.stringify(params.newValue)),
      performedBy: params.performedBy,
      reason: params.reason,
    },
  });
}
