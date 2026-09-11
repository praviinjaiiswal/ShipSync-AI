import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { rateLimiter, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { assessRisk } from '@/lib/ai';
import { NotFoundError, ExternalServiceError } from '@/lib/errors';

export const POST = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'risk:assess');

  await rateLimiter.check(req, `ai:${ctx.userId}`, RATE_LIMIT_PRESETS.AI);

  const shipment = await prisma.shipment.findFirst({
    where: { id: params.id, companyId: ctx.companyId },
  });

  if (!shipment) {
    throw new NotFoundError('Shipment not found');
  }

  const result = await assessRisk(shipment);

  if (!result.success) {
    return NextResponse.json({
      success: false,
      reason: result.reason,
      message: result.error || 'AI risk assessment temporarily unavailable, please verify buyer risk manually.',
      countryRiskScore: 0,
      buyerRiskScore: 0,
      aiReport: result.aiReport,
    });
  }

  const { countryRiskScore = 0, buyerRiskScore = 0, aiReport = '' } = result;

  const riskReport = await prisma.riskReport.upsert({
    where: { shipmentId: shipment.id },
    update: { countryRiskScore, buyerRiskScore, aiReport },
    create: {
      companyId: ctx.companyId,
      shipmentId: shipment.id,
      countryRiskScore,
      buyerRiskScore,
      aiReport,
    },
  });

  await prisma.activity.create({
    data: {
      companyId: ctx.companyId,
      userId: ctx.userId,
      shipmentId: shipment.id,
      action: 'RISK_ASSESSED',
      details: `Assessed risk for ${shipment.buyerName} (Country Score: ${countryRiskScore}, Buyer Score: ${buyerRiskScore})`,
    },
  });

  return NextResponse.json(riskReport);
});

export const GET = withErrorHandler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'risk:read');

  const shipment = await prisma.shipment.findFirst({
    where: { id: params.id, companyId: ctx.companyId },
  });

  if (!shipment) {
    throw new NotFoundError('Shipment not found');
  }

  const riskReport = await prisma.riskReport.findFirst({
    where: { shipmentId: params.id, companyId: ctx.companyId },
  });

  return NextResponse.json(riskReport);
});