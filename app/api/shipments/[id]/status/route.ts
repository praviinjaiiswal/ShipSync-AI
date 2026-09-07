import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { isValidExportStatusTransition } from '@/lib/validations';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';

const statusTransitionSchema = z.object({
  status: z.enum([
    'DRAFT',
    'DOCUMENTS_READY',
    'UNDER_REVIEW',
    'SHIPPING_BILL_GENERATED',
    'CUSTOMS_CLEARED',
    'GATE_IN',
    'CLEARED',
    'SHIPPED',
    'DELIVERED',
  ]),
});

export const PATCH = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'shipment:update');

  const shipment = await prisma.shipment.findFirst({
    where: { id: params.id, companyId: ctx.companyId },
    include: { shippingBill: true },
  });

  if (!shipment) {
    throw new NotFoundError('Export shipment not found');
  }

  const body = await req.json().catch(() => ({}));
  const parsed = statusTransitionSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError('Validation failed for status update', parsed.error.flatten());
  }

  const nextStatus = parsed.data.status;
  if (!isValidExportStatusTransition(shipment.status, nextStatus)) {
    throw new ValidationError(
      `Invalid export lifecycle transition: Cannot transition shipment from '${shipment.status}' to '${nextStatus}'. Follow statutory sequence: DRAFT → DOCUMENTS_READY → UNDER_REVIEW → SHIPPING_BILL_GENERATED → CUSTOMS_CLEARED → GATE_IN → SHIPPED → DELIVERED.`
    );
  }

  const updatedShipment = await prisma.shipment.update({
    where: { id: shipment.id },
    data: { status: nextStatus },
  });

  await prisma.activity.create({
    data: {
      companyId: ctx.companyId,
      userId: ctx.userId,
      shipmentId: shipment.id,
      action: 'STATUS_UPDATED',
      details: `Status transitioned from ${shipment.status} to ${nextStatus}`,
    },
  });

  return NextResponse.json({
    success: true,
    shipment: updatedShipment,
  });
});
