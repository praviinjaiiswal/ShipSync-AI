import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { calculateCustomsDuty } from '@/lib/duty-calculator';
import { NotFoundError, ValidationError } from '@/lib/errors';

export const POST = withErrorHandler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'boe:generate');

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

  if (shipment.billOfEntry) {
    throw new ValidationError(
      `Bill of Entry (${shipment.billOfEntry.beNumber}) has already been generated. Declared values are locked. Use the amendment procedure to make changes.`
    );
  }

  // Calculate official duty breakdown snapshot
  const duty = await calculateCustomsDuty(
    ctx.companyId,
    shipment.hsCode,
    shipment.invoiceValue
  );

  // Generate sequential BE number for this company and year
  const currentYear = new Date().getFullYear();
  const beCount = await prisma.billOfEntry.count({
    where: { companyId: ctx.companyId },
  });
  const seqNumber = String(beCount + 1).padStart(5, '0');
  const compSuffix = ctx.companyId.slice(-4).toUpperCase();
  const beNumber = `BE-${currentYear}-${compSuffix}-${seqNumber}`;

  // Execute in transaction: create BOE, lock shipment, update status to BOE_FILED
  const [boe, updatedShipment] = await prisma.$transaction([
    prisma.billOfEntry.create({
      data: {
        companyId: ctx.companyId,
        importShipmentId: shipment.id,
        beNumber,
        beDate: new Date(),
        dutyBreakdown: duty as any,
        totalDutyPayable: duty.totalDutyPayable,
        paymentStatus: 'PENDING',
      },
    }),
    prisma.importShipment.update({
      where: { id: shipment.id },
      data: {
        isLocked: true,
        status: 'BOE_FILED',
      },
    }),
    prisma.activity.create({
      data: {
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: 'BILL_OF_ENTRY_GENERATED',
        details: `Generated Bill of Entry ${beNumber} for shipment ${shipment.id} (Total Duty: INR ${duty.totalDutyPayable})`,
      },
    }),
  ]);

  return NextResponse.json(
    {
      success: true,
      billOfEntry: boe,
      shipment: updatedShipment,
    },
    { status: 201 }
  );
});
