import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { leoIssueSchema } from '@/lib/validations';
import { ValidationError, NotFoundError } from '@/lib/errors';

export const POST = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'leo:issue');

  const shipment = await prisma.shipment.findFirst({
    where: { id: params.id, companyId: ctx.companyId },
    include: { shippingBill: true },
  });

  if (!shipment) {
    throw new NotFoundError('Export shipment not found');
  }

  if (!shipment.shippingBill) {
    throw new ValidationError('Cannot issue LEO without an active Shipping Bill');
  }

  if (shipment.shippingBill.leoNumber) {
    throw new ValidationError(`LEO has already been issued for this Shipping Bill (${shipment.shippingBill.leoNumber})`);
  }

  const body = await req.json().catch(() => ({}));
  const parsed = leoIssueSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError('Validation failed for Let Export Order issuance', parsed.error.flatten());
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedSb = await tx.shippingBill.update({
      where: { id: shipment.shippingBill!.id },
      data: {
        leoNumber: parsed.data.leoNumber,
        leoDate: new Date(parsed.data.leoDate),
        leoOfficer: parsed.data.leoOfficer,
        inspectionRemarks: parsed.data.inspectionRemarks || null,
      },
    });

    const updatedShipment = await tx.shipment.update({
      where: { id: shipment.id },
      data: {
        status: 'CUSTOMS_CLEARED',
      },
    });

    await tx.activity.create({
      data: {
        companyId: ctx.companyId,
        userId: ctx.userId,
        shipmentId: shipment.id,
        action: 'LEO_ISSUED',
        details: `Let Export Order (LEO) ${parsed.data.leoNumber} issued by Officer ${parsed.data.leoOfficer}`,
      },
    });

    return { shippingBill: updatedSb, shipment: updatedShipment };
  });

  return NextResponse.json({
    success: true,
    shippingBill: result.shippingBill,
    shipment: result.shipment,
  });
});
