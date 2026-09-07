import { NextRequest, NextResponse } from 'next/server';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { dutyPaymentConfirmSchema } from '@/lib/validations';
import { withErrorHandler } from '@/lib/api-handler';
import { NotFoundError } from '@/lib/errors';
import { recordFinancialAudit } from '@/lib/financial-closure';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/financial/duty-payments/[id]/confirm
 * Confirm or reject customs duty payment challan (OWNER & ADMIN only).
 */
export const PATCH = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const ctx = await requireTenantContext();
  // Restricted to OWNER / ADMIN — OPS_EXECUTIVE cannot confirm
  assertPermission(ctx.role, 'duty_payment:confirm');

  const body = await req.json();
  const validated = dutyPaymentConfirmSchema.parse(body);

  const existing = await ctx.tenantDb.dutyPayment.findFirst({
    where: { id: params.id },
    include: {
      importShipment: true,
      billOfEntry: true,
    },
  });

  if (!existing) {
    throw new NotFoundError('Duty payment record not found');
  }

  const newStatus = validated.confirmAction === 'CONFIRM' ? 'VERIFIED' : 'REJECTED';

  const updated = await ctx.tenantDb.dutyPayment.update({
    where: { id: params.id },
    data: {
      status: newStatus,
      confirmedBy: ctx.userId,
      confirmedAt: new Date(),
      discrepancyReason: validated.notes
        ? `${existing.discrepancyReason || ''}\n[Review Note]: ${validated.notes}`.trim()
        : existing.discrepancyReason,
    },
    include: {
      recorder: { select: { id: true, name: true, email: true } },
      confirmer: { select: { id: true, name: true, email: true } },
    },
  });

  // If confirmed, update Bill of Entry and advance Import Shipment status
  if (newStatus === 'VERIFIED') {
    await ctx.tenantDb.billOfEntry.update({
      where: { id: existing.billOfEntryId },
      data: {
        paymentStatus: 'PAID',
        challanNumber: existing.challanNumber,
      },
    });

    const importShipment = await ctx.tenantDb.importShipment.findFirst({
      where: { id: existing.importShipmentId },
    });

    if (importShipment && importShipment.status === 'ASSESSED') {
      await ctx.tenantDb.importShipment.update({
        where: { id: existing.importShipmentId },
        data: { status: 'DUTY_PAID' },
      });
    }
  }

  // Append-only audit trail
  await recordFinancialAudit(ctx.companyId, {
    entityType: 'DUTY_PAYMENT',
    entityId: updated.id,
    action: validated.confirmAction,
    previousValue: existing,
    newValue: updated,
    performedBy: ctx.userId,
    reason: validated.notes || `${validated.confirmAction} duty payment challan`,
  });

  return NextResponse.json({
    success: true,
    payment: updated,
  });
});
