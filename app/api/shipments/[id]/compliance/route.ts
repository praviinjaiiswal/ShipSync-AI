import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { rateLimiter, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { checkCompliance } from '@/lib/ai';
import { NotFoundError, ExternalServiceError } from '@/lib/errors';

export const POST = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'compliance:run');

  // Rate limit AI requests
  await rateLimiter.check(req, `ai:${ctx.userId}`, RATE_LIMIT_PRESETS.AI);

  const shipment = await prisma.shipment.findFirst({
    where: { id: params.id, companyId: ctx.companyId },
  });

  if (!shipment) {
    throw new NotFoundError('Shipment not found');
  }

  try {
    const result = await checkCompliance(shipment);
    const { complianceScore = 0, issues = [], recommendations = [] } = result;

    const [check] = await prisma.$transaction([
      prisma.complianceCheck.create({
        data: {
          companyId: ctx.companyId,
          shipmentId: shipment.id,
          checkType: 'AI_DGFT_REVIEW',
          status: complianceScore >= 70 ? 'PASSED' : 'NEEDS_ATTENTION',
          details: JSON.stringify({ issues, recommendations }),
          aiAnalysis: JSON.stringify(result),
        },
      }),
      prisma.shipment.update({
        where: { id: shipment.id },
        data: { complianceScore },
      }),
      prisma.activity.create({
        data: {
          companyId: ctx.companyId,
          userId: ctx.userId,
          shipmentId: shipment.id,
          action: 'COMPLIANCE_RUN',
          details: `Ran AI DGFT compliance check for ${shipment.buyerName} (Score: ${complianceScore})`,
        },
      }),
    ]);

    return NextResponse.json({ check, complianceScore, issues, recommendations });
  } catch (err) {
    console.error('Compliance AI analysis failed:', err);
    throw new ExternalServiceError('AI compliance service encountered an error. Please retry.');
  }
});

export const GET = withErrorHandler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'compliance:read');

  const shipment = await prisma.shipment.findFirst({
    where: { id: params.id, companyId: ctx.companyId },
  });

  if (!shipment) {
    throw new NotFoundError('Shipment not found');
  }

  const checks = await prisma.complianceCheck.findMany({
    where: { shipmentId: params.id, companyId: ctx.companyId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(checks);
});