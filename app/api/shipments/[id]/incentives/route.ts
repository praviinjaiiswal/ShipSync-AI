import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { NotFoundError } from '@/lib/errors';
import { calculateExportIncentives } from '@/lib/export-incentive-calculator';

export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'incentive:calculate');

  const shipment = await prisma.shipment.findFirst({
    where: { id: params.id, companyId: ctx.companyId },
    include: { shippingBill: true },
  });

  if (!shipment) {
    throw new NotFoundError('Export shipment not found');
  }

  const { searchParams } = new URL(req.url);
  const quantityParam = searchParams.get('quantity');
  const quantity = quantityParam ? parseFloat(quantityParam) : undefined;

  const breakdown = await calculateExportIncentives(
    ctx.companyId,
    shipment.hsCode,
    shipment.value,
    shipment.currency,
    quantity
  );

  return NextResponse.json({
    success: true,
    shipmentId: shipment.id,
    shippingBill: shipment.shippingBill,
    breakdown,
  });
});
