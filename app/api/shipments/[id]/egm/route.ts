import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { egmFileSchema } from '@/lib/validations';
import { ValidationError, NotFoundError, ConflictError } from '@/lib/errors';

export const POST = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'egm:file');

  const shipment = await prisma.shipment.findFirst({
    where: { id: params.id, companyId: ctx.companyId },
    include: { shippingBill: true },
  });

  if (!shipment) {
    throw new NotFoundError('Export shipment not found');
  }

  if (!shipment.shippingBill) {
    throw new ValidationError('Cannot file EGM without an active Shipping Bill');
  }

  if (!shipment.shippingBill.leoNumber) {
    throw new ValidationError('Cannot file EGM prior to Let Export Order (LEO) issuance');
  }

  if (shipment.shippingBill.egmNumber) {
    throw new ConflictError(`EGM already filed for this shipment (${shipment.shippingBill.egmNumber})`);
  }

  const body = await req.json().catch(() => ({}));
  const parsed = egmFileSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError('Validation failed for Export General Manifest filing', parsed.error.flatten());
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedSb = await tx.shippingBill.update({
      where: { id: shipment.shippingBill!.id },
      data: {
        egmNumber: parsed.data.egmNumber,
        egmDate: new Date(parsed.data.sailingDate),
        rotationNumber: parsed.data.rotationNumber,
        shippingLineCode: parsed.data.shippingLineCode,
        incentiveStatus: 'SCROLL_GENERATED',
      },
    });

    const updatedShipment = await tx.shipment.update({
      where: { id: shipment.id },
      data: {
        status: 'SHIPPED',
      },
    });

    await tx.activity.create({
      data: {
        companyId: ctx.companyId,
        userId: ctx.userId,
        shipmentId: shipment.id,
        action: 'EGM_FILED',
        details: `EGM ${parsed.data.egmNumber} filed for vessel rotation ${parsed.data.rotationNumber} (${parsed.data.shippingLineCode}). Incentive scroll generated.`,
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
