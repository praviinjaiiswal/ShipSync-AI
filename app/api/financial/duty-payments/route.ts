import { NextRequest, NextResponse } from 'next/server';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { dutyPaymentRecordSchema } from '@/lib/validations';
import { withErrorHandler } from '@/lib/api-handler';
import { NotFoundError } from '@/lib/errors';
import {
  validateDutyPaymentAgainstBoE,
  recordFinancialAudit,
} from '@/lib/financial-closure';

export const dynamic = 'force-dynamic';

/**
 * GET /api/financial/duty-payments
 * List recorded duty payments for an import shipment or tenant.
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'duty_payment:read');

  const { searchParams } = new URL(req.url);
  const importShipmentId = searchParams.get('importShipmentId');
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const offset = Math.max(0, parseInt(searchParams.get('offset') || searchParams.get('skip') || '0', 10));

  const whereClause: any = { companyId: ctx.companyId };
  if (importShipmentId) {
    whereClause.importShipmentId = importShipmentId;
  }

  const payments = await ctx.tenantDb.dutyPayment.findMany({
    where: whereClause,
    include: {
      recorder: { select: { id: true, name: true, email: true } },
      confirmer: { select: { id: true, name: true, email: true } },
      billOfEntry: { select: { id: true, beNumber: true, totalDutyPayable: true, paymentStatus: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });


  return NextResponse.json({
    success: true,
    payments,
  });
});

/**
 * POST /api/financial/duty-payments
 * Record an ICEGATE e-payment challan with server-side validation against calculated duty.
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'duty_payment:record');

  const body = await req.json();
  const validated = dutyPaymentRecordSchema.parse(body);

  const importShipment = await ctx.tenantDb.importShipment.findFirst({
    where: { id: validated.importShipmentId },
  });

  if (!importShipment) {
    throw new NotFoundError('Import shipment not found');
  }

  const boe = await ctx.tenantDb.billOfEntry.findFirst({
    where: { importShipmentId: validated.importShipmentId },
  });

  if (!boe) {
    throw new NotFoundError('Bill of Entry must be generated before recording duty payment');
  }

  // Validate amount against calculated statutory duty
  const validation = validateDutyPaymentAgainstBoE(
    boe.totalDutyPayable,
    validated.amountPaid
  );

  const payment = await ctx.tenantDb.dutyPayment.create({
    data: {
      companyId: ctx.companyId,
      importShipmentId: validated.importShipmentId,
      billOfEntryId: boe.id,
      challanNumber: validated.challanNumber,
      amountPaid: validated.amountPaid,
      calculatedDuty: boe.totalDutyPayable,
      paymentDate: validated.paymentDate ? new Date(validated.paymentDate) : new Date(),
      paymentReference: validated.paymentReference || null,
      paymentMode: validated.paymentMode,
      receiptDocumentUrl: validated.receiptDocumentUrl || null,
      status: validation.status === 'VERIFIED' ? 'PENDING' : validation.status, // Pending until confirmed, or MISMATCH
      discrepancyReason: validation.discrepancyReason || null,
      recordedBy: ctx.userId,
    },
    include: {
      recorder: { select: { id: true, name: true, email: true } },
      billOfEntry: { select: { id: true, beNumber: true, totalDutyPayable: true } },
    },
  });

  // Append-only audit trail
  await recordFinancialAudit(ctx.companyId, {
    entityType: 'DUTY_PAYMENT',
    entityId: payment.id,
    action: 'CREATE',
    newValue: payment,
    performedBy: ctx.userId,
    reason: validation.discrepancyReason || `Recorded customs duty challan ${validated.challanNumber}`,
  });

  return NextResponse.json({
    success: true,
    payment,
    validation,
  });
});
