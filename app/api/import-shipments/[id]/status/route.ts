import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { importStatusTransitionSchema, isValidImportStatusTransition } from '@/lib/validations';
import { NotFoundError, ValidationError } from '@/lib/errors';

export const PATCH = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'import_shipment:update');

  const shipment = await prisma.importShipment.findFirst({
    where: {
      id: params.id,
      companyId: ctx.companyId,
    },
    include: {
      billOfEntry: true,
    },
  });

  if (!shipment) {
    throw new NotFoundError('Import shipment not found');
  }

  const body = await req.json();
  const parsed = importStatusTransitionSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError('Invalid status value', parsed.error.flatten());
  }

  const nextStatus = parsed.data.status;
  const currentStatus = shipment.status;

  // Validate state machine progression
  if (!isValidImportStatusTransition(currentStatus, nextStatus)) {
    throw new ValidationError(
      `Invalid status transition from '${currentStatus}' to '${nextStatus}'. Import status must follow: IGM_FILED → BOE_FILED → ASSESSED → DUTY_PAID → EXAMINED → OUT_OF_CHARGE → DELIVERED in order.`
    );
  }

  // Precondition: advancing to or past BOE_FILED requires a generated Bill of Entry
  if (nextStatus === 'BOE_FILED' && !shipment.billOfEntry) {
    throw new ValidationError('Cannot advance to BOE_FILED without generating a Bill of Entry first.');
  }

  // If status is transitioning to DUTY_PAID, mark billOfEntry paymentStatus as PAID
  if (nextStatus === 'DUTY_PAID' && shipment.billOfEntry) {
    await prisma.billOfEntry.update({
      where: { id: shipment.billOfEntry.id },
      data: {
        paymentStatus: 'PAID',
        challanNumber: body.challanNumber || `CH-${Date.now()}`,
      },
    });
  }

  const updatedShipment = await prisma.importShipment.update({
    where: { id: shipment.id },
    data: { status: nextStatus },
    include: { billOfEntry: true },
  });

  await prisma.activity.create({
    data: {
      companyId: ctx.companyId,
      userId: ctx.userId,
      action: 'IMPORT_STATUS_UPDATED',
      details: `Import Shipment ${shipment.id} status transitioned from ${currentStatus} to ${nextStatus}`,
    },
  });

  return NextResponse.json({
    success: true,
    shipment: updatedShipment,
  });
});
