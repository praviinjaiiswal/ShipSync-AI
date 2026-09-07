import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { customsManualOverrideSchema } from '@/lib/validations';
import { ValidationError, NotFoundError } from '@/lib/errors';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'customs:manual_override');

  const body = await req.json().catch(() => null);
  if (!body) {
    throw new ValidationError('Request body is required');
  }

  const parsed = customsManualOverrideSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0]?.message || 'Validation failed', parsed.error.format());
  }

  const { importShipmentId, newStatus, reason, statutoryRef } = parsed.data;

  const shipment = await prisma.importShipment.findFirst({
    where: { id: importShipmentId, companyId: ctx.companyId },
  });

  if (!shipment) {
    throw new NotFoundError('Import shipment not found');
  }

  const previousStatus = shipment.status;

  // Perform statutory manual override within transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create audit record
    const audit = await tx.customsOverrideAudit.create({
      data: {
        companyId: ctx.companyId,
        importShipmentId,
        previousStatus,
        newStatus,
        reason,
        statutoryRef: statutoryRef || null,
        approvedBy: ctx.userId,
      },
    });

    // 2. Update import shipment status
    const updatedShipment = await tx.importShipment.update({
      where: { id: importShipmentId },
      data: { status: newStatus },
    });

    // 3. Log activity
    await tx.activity.create({
      data: {
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: 'CUSTOMS_STATUS_MANUAL_OVERRIDE',
        details: `Manual statutory status override from ${previousStatus} to ${newStatus}. Reason: ${reason}`,
      },
    });

    return { audit, updatedShipment };
  });

  return NextResponse.json({
    success: true,
    data: {
      shipmentId: result.updatedShipment.id,
      previousStatus,
      newStatus: result.updatedShipment.status,
      auditId: result.audit.id,
      reason,
      message: `Statutory customs status override to ${newStatus} completed successfully.`,
    },
  });
});
