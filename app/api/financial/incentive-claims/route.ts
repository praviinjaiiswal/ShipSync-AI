import { NextRequest, NextResponse } from 'next/server';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { incentiveClaimCreateSchema } from '@/lib/validations';
import { withErrorHandler } from '@/lib/api-handler';
import { NotFoundError } from '@/lib/errors';
import { recordFinancialAudit } from '@/lib/financial-closure';

export const dynamic = 'force-dynamic';

/**
 * GET /api/financial/incentive-claims
 * List RoDTEP / Drawback claims for a shipment or tenant.
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'incentive_claim:read');

  const { searchParams } = new URL(req.url);
  const shipmentId = searchParams.get('shipmentId');
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const offset = Math.max(0, parseInt(searchParams.get('offset') || searchParams.get('skip') || '0', 10));

  const whereClause: any = { companyId: ctx.companyId };
  if (shipmentId) {
    whereClause.shipmentId = shipmentId;
  }

  const claims = await ctx.tenantDb.incentiveClaim.findMany({
    where: whereClause,
    include: {
      recorder: { select: { id: true, name: true, email: true } },
      sanctioner: { select: { id: true, name: true, email: true } },
      shipment: { select: { id: true, buyerName: true, hsCode: true, value: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });


  return NextResponse.json({
    success: true,
    claims,
  });
});

/**
 * POST /api/financial/incentive-claims
 * Create a new draft incentive claim (RoDTEP / Drawback).
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'incentive_claim:create');

  const body = await req.json();
  const validated = incentiveClaimCreateSchema.parse(body);

  const shipment = await ctx.tenantDb.shipment.findFirst({
    where: { id: validated.shipmentId },
  });

  if (!shipment) {
    throw new NotFoundError('Export shipment not found');
  }

  const claim = await ctx.tenantDb.incentiveClaim.create({
    data: {
      companyId: ctx.companyId,
      shipmentId: validated.shipmentId,
      scheme: validated.scheme,
      claimedAmount: validated.claimedAmount,
      status: 'DRAFT',
      recordedBy: ctx.userId,
    },
    include: {
      recorder: { select: { id: true, name: true, email: true } },
    },
  });

  // Append-only audit trail
  await recordFinancialAudit(ctx.companyId, {
    entityType: 'INCENTIVE_CLAIM',
    entityId: claim.id,
    action: 'CREATE',
    newValue: claim,
    performedBy: ctx.userId,
    reason: `Created draft ${validated.scheme} claim of ₹${validated.claimedAmount.toLocaleString('en-IN')}`,
  });

  return NextResponse.json({
    success: true,
    claim,
  });
});
