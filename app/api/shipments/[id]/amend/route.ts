import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { exportAmendmentSchema } from '@/lib/validations';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { calculateExportIncentives } from '@/lib/export-incentive-calculator';

export const POST = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'export_shipment:amend');

  const shipment = await prisma.shipment.findFirst({
    where: { id: params.id, companyId: ctx.companyId },
    include: {
      shippingBill: true,
      amendments: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!shipment) {
    throw new NotFoundError('Export shipment not found');
  }

  // Pre-LEO constraint: If LEO has already been granted, cannot use simple pre-LEO amendment
  if (shipment.shippingBill?.leoNumber) {
    throw new ValidationError(
      'Cannot amend via pre-LEO workflow after Let Export Order (LEO) has been granted. Section 149 requires Assistant Commissioner permission for post-LEO amendments.'
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = exportAmendmentSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError('Validation failed for export amendment', parsed.error.flatten());
  }

  const previousData = {
    fobValue: shipment.value,
    hsCode: shipment.hsCode,
    buyerName: shipment.buyerName,
    portOfDischarge: shipment.portOfDischarge,
    countryOfDestination: shipment.buyerCountry,
  };

  const newFob = parsed.data.fobValue ?? shipment.value;
  const newHs = parsed.data.hsCode ?? shipment.hsCode;
  const newBuyer = parsed.data.buyerName ?? shipment.buyerName;
  const newPortOfDischarge = parsed.data.portOfDischarge ?? shipment.portOfDischarge;
  const newCountry = parsed.data.countryOfDestination ?? shipment.buyerCountry;

  const newData = {
    fobValue: newFob,
    hsCode: newHs,
    buyerName: newBuyer,
    portOfDischarge: newPortOfDischarge,
    countryOfDestination: newCountry,
  };

  const version = shipment.amendments.length + 1;

  // If fobValue or hsCode changed and a shipping bill exists, recalculate incentives
  let newIncentives = null;
  if (shipment.shippingBill && (newFob !== shipment.value || newHs !== shipment.hsCode)) {
    newIncentives = await calculateExportIncentives(
      ctx.companyId,
      newHs,
      newFob,
      shipment.currency
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const amendment = await tx.exportAmendment.create({
      data: {
        companyId: ctx.companyId,
        shipmentId: shipment.id,
        version,
        previousData: previousData as any,
        newData: newData as any,
        reason: parsed.data.reason,
        amendedBy: ctx.userId,
      },
    });

    const updatedShipment = await tx.shipment.update({
      where: { id: shipment.id },
      data: {
        value: newFob,
        hsCode: newHs,
        buyerName: newBuyer,
        portOfDischarge: newPortOfDischarge,
        buyerCountry: newCountry,
      },
    });

    let updatedSb = null;
    if (shipment.shippingBill) {
      updatedSb = await tx.shippingBill.update({
        where: { id: shipment.shippingBill.id },
        data: {
          fobValue: newFob,
          ...(newIncentives ? {
            rodtepRate: newIncentives.rodtepRate,
            rodtepAmount: newIncentives.rodtepAmount,
            drawbackRate: newIncentives.drawbackRate,
            drawbackAmount: newIncentives.drawbackAmount,
            exportDutyRate: newIncentives.exportDutyRate,
            exportDutyAmount: newIncentives.exportDutyAmount,
            totalIncentiveAmount: newIncentives.totalIncentiveAmount,
          } : {}),
        },
      });
    }

    await tx.activity.create({
      data: {
        companyId: ctx.companyId,
        userId: ctx.userId,
        shipmentId: shipment.id,
        action: 'EXPORT_AMENDMENT_RECORDED',
        details: `Recorded export amendment v${version} (Reason: ${parsed.data.reason})`,
      },
    });

    return { amendment, shipment: updatedShipment, shippingBill: updatedSb };
  });

  return NextResponse.json({
    success: true,
    amendment: result.amendment,
    shipment: result.shipment,
    shippingBill: result.shippingBill,
  });
});
