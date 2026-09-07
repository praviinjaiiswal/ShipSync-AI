import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { checkSanctions } from '@/lib/sanctions';
import { NotFoundError, ExternalServiceError } from '@/lib/errors';

export const POST = withErrorHandler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'sanctions:check');

  const shipment = await prisma.shipment.findFirst({
    where: { id: params.id, companyId: ctx.companyId },
  });

  if (!shipment) {
    throw new NotFoundError('Shipment not found');
  }

  try {
    const matches = await checkSanctions(shipment.buyerName);
    const matchFound = matches.length > 0;

    const check = await prisma.sanctionsCheck.upsert({
      where: { shipmentId: shipment.id },
      update: { matchFound, matches, checkedAt: new Date() },
      create: {
        companyId: ctx.companyId,
        shipmentId: shipment.id,
        matchFound,
        matches,
      },
    });

    await prisma.activity.create({
      data: {
        companyId: ctx.companyId,
        userId: ctx.userId,
        shipmentId: shipment.id,
        action: 'SANCTIONS_CHECKED',
        details: `Sanctions check for ${shipment.buyerName}: ${matchFound ? 'MATCH FOUND' : 'CLEAR'}`,
      },
    });

    return NextResponse.json(check);
  } catch (err) {
    console.error('Sanctions screening service failed:', err);
    throw new ExternalServiceError('Sanctions screening provider failed. Please retry.');
  }
});

export const GET = withErrorHandler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'sanctions:read');

  const shipment = await prisma.shipment.findFirst({
    where: { id: params.id, companyId: ctx.companyId },
  });

  if (!shipment) {
    throw new NotFoundError('Shipment not found');
  }

  const check = await prisma.sanctionsCheck.findFirst({
    where: { shipmentId: params.id, companyId: ctx.companyId },
  });

  return NextResponse.json(check);
});