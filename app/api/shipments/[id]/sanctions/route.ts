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
    const report = await checkSanctions(shipment.buyerName);
    const matchFound = report.matchFound;

    const check = await prisma.sanctionsCheck.upsert({
      where: { shipmentId: shipment.id },
      update: { matchFound, matches: report as any },
      create: {
        companyId: ctx.companyId,
        shipmentId: shipment.id,
        matchFound,
        matches: report as any,
      },
    });

    const matchDetails = matchFound
      ? `MATCH FOUND [DGFT: ${report.dgftListMatch ? 'YES' : 'NO'}, SCOMET: ${report.scometListMatch ? 'YES' : 'NO'}, US CSL: ${report.usListMatch ? 'YES' : 'NO'}]`
      : 'CLEAR (All regimes)';

    await prisma.activity.create({
      data: {
        companyId: ctx.companyId,
        userId: ctx.userId,
        shipmentId: shipment.id,
        action: 'SANCTIONS_CHECKED',
        details: `Sanctions check for ${shipment.buyerName}: ${matchDetails}`,
      },
    });

    return NextResponse.json({
      ...check,
      screeningReport: report,
    });
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