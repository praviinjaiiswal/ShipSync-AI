import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { NotFoundError, ForbiddenError } from '@/lib/errors';

export const GET = withErrorHandler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'import_shipment:read');

  const shipment = await prisma.importShipment.findFirst({
    where: {
      id: params.id,
      companyId: ctx.companyId,
    },
    include: {
      billOfEntry: true,
      amendments: {
        orderBy: { version: 'desc' },
      },
    },
  });

  if (!shipment) {
    throw new NotFoundError('Import shipment not found');
  }

  // Also fetch policy status for the HS Code
  const policy = await prisma.restrictedItemsList.findUnique({
    where: { hsCode: shipment.hsCode },
  });

  return NextResponse.json({
    shipment,
    policy,
  });
});

export const DELETE = withErrorHandler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'import_shipment:delete');

  const existing = await prisma.importShipment.findFirst({
    where: {
      id: params.id,
      companyId: ctx.companyId,
    },
    include: {
      billOfEntry: true,
    },
  });

  if (!existing) {
    throw new NotFoundError('Import shipment not found');
  }

  if (existing.isLocked || existing.billOfEntry || existing.status !== 'IGM_FILED') {
    throw new ForbiddenError(
      'Cannot delete an import shipment once Bill of Entry has been generated or filing has progressed. Use the amendment procedure.'
    );
  }

  await prisma.importShipment.delete({
    where: { id: params.id },
  });

  await prisma.activity.create({
    data: {
      companyId: ctx.companyId,
      userId: ctx.userId,
      action: 'IMPORT_SHIPMENT_DELETED',
      details: `Import Shipment ${params.id} deleted`,
    },
  });

  return NextResponse.json({
    success: true,
    message: 'Import shipment deleted successfully',
  });
});
