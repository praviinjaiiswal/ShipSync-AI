import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { shippingBillGenerateSchema } from '@/lib/validations';
import { ValidationError, NotFoundError, ConflictError } from '@/lib/errors';
import { calculateExportIncentives } from '@/lib/export-incentive-calculator';

export const POST = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'shipping_bill:generate');

  const shipment = await prisma.shipment.findFirst({
    where: { id: params.id, companyId: ctx.companyId },
    include: { shippingBill: true },
  });

  if (!shipment) {
    throw new NotFoundError('Export shipment not found');
  }

  if (shipment.shippingBill) {
    throw new ConflictError(`Shipping Bill already generated for this shipment (${shipment.shippingBill.sbNumber})`);
  }

  const body = await req.json().catch(() => ({}));
  const parsed = shippingBillGenerateSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError('Validation failed for Shipping Bill generation', parsed.error.flatten());
  }

  // 1. Determine Sequential Shipping Bill Number: SB-<YEAR>-<COMP_SUFFIX>-<5_DIGIT_SEQ>
  const year = new Date().getFullYear();
  const company = await prisma.company.findUnique({
    where: { id: ctx.companyId },
    select: { name: true },
  });

  const rawPrefix = company?.name?.replace(/[^A-Za-z0-9]/g, '').slice(0, 5).toUpperCase();
  const compSuffix = rawPrefix && rawPrefix.length >= 2 ? rawPrefix : ctx.companyId.slice(0, 5).toUpperCase();
  const sbPrefix = `SB-${year}-${compSuffix}`;

  const currentCount = await prisma.shippingBill.count({
    where: {
      companyId: ctx.companyId,
      sbNumber: { startsWith: sbPrefix },
    },
  });

  const sequence = String(currentCount + 1).padStart(5, '0');
  const sbNumber = `${sbPrefix}-${sequence}`;

  // 2. Compute Export Incentives (RoDTEP, Drawback, Export Duty)
  const incentive = await calculateExportIncentives(
    ctx.companyId,
    shipment.hsCode,
    shipment.value,
    shipment.currency
  );

  // 3. Create Shipping Bill & Lock declared values atomically
  const result = await prisma.$transaction(async (tx) => {
    const sb = await tx.shippingBill.create({
      data: {
        companyId: ctx.companyId,
        shipmentId: shipment.id,
        sbNumber,
        portOfLoading: parsed.data.portOfLoading,
        portOfDischarge: parsed.data.portOfDischarge,
        countryOfDestination: parsed.data.countryOfDestination,
        fobValue: shipment.value,
        rodtepRate: incentive.rodtepRate,
        rodtepAmount: incentive.rodtepAmount,
        drawbackRate: incentive.drawbackRate,
        drawbackAmount: incentive.drawbackAmount,
        exportDutyRate: incentive.exportDutyRate,
        exportDutyAmount: incentive.exportDutyAmount,
        totalIncentiveAmount: incentive.totalIncentiveAmount,
        incentiveStatus: 'CALCULATED',
        containerNumbers: parsed.data.containerNumbers || [],
        sealNumbers: parsed.data.sealNumbers || [],
        isLocked: true,
      },
    });

    const updatedShipment = await tx.shipment.update({
      where: { id: shipment.id },
      data: {
        portOfLoading: parsed.data.portOfLoading,
        portOfDischarge: parsed.data.portOfDischarge,
        buyerCountry: parsed.data.countryOfDestination || shipment.buyerCountry,
        status: 'SHIPPING_BILL_GENERATED',
        isLocked: true,
      },
    });

    await tx.activity.create({
      data: {
        companyId: ctx.companyId,
        userId: ctx.userId,
        shipmentId: shipment.id,
        action: 'SHIPPING_BILL_GENERATED',
        details: `Generated Shipping Bill ${sbNumber} (FOB: ${shipment.currency} ${shipment.value.toLocaleString()}, Total Incentives: ₹${incentive.totalIncentiveAmount.toLocaleString()})`,
      },
    });

    return { shippingBill: sb, shipment: updatedShipment };
  });

  return NextResponse.json({
    success: true,
    shippingBill: result.shippingBill,
    shipment: result.shipment,
    incentive,
  });
});
