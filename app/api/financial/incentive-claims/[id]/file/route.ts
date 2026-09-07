import { NextRequest, NextResponse } from 'next/server';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { incentiveClaimFileSchema } from '@/lib/validations';
import { withErrorHandler } from '@/lib/api-handler';
import { NotFoundError, ValidationError } from '@/lib/errors';
import {
  verifyIncentiveClaimPreconditions,
  recordFinancialAudit,
} from '@/lib/financial-closure';

export const dynamic = 'force-dynamic';

/**
 * POST /api/financial/incentive-claims/[id]/file
 * File an incentive claim with statutory gate preconditions check.
 */
export const POST = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'incentive_claim:file');

  const body = await req.json().catch(() => ({}));
  const validated = incentiveClaimFileSchema.parse(body);

  const claim = await ctx.tenantDb.incentiveClaim.findFirst({
    where: { id: params.id },
  });

  if (!claim) {
    throw new NotFoundError('Incentive claim record not found');
  }

  if (claim.status !== 'DRAFT') {
    throw new ValidationError(`Claim is already in '${claim.status}' status and cannot be filed again`);
  }

  const shipment = await ctx.tenantDb.shipment.findFirst({
    where: { id: claim.shipmentId },
    include: {
      documents: true,
      exportRealisations: true,
    },
  });

  if (!shipment) {
    throw new NotFoundError('Associated export shipment not found');
  }

  // Precondition gate checks
  const gateCheck = verifyIncentiveClaimPreconditions({
    status: shipment.status,
    documents: (shipment as any).documents,
    exportRealisations: (shipment as any).exportRealisations,
  });

  if (!gateCheck.isEligible) {
    throw new ValidationError(
      `Precondition check failed for filing claim: ${gateCheck.reasons.join(' ')}`
    );
  }

  const updated = await ctx.tenantDb.incentiveClaim.update({
    where: { id: params.id },
    data: {
      status: 'FILED',
      filingDate: new Date(),
      remarks: validated.notes
        ? `${claim.remarks || ''}\n[Filing Note]: ${validated.notes}`.trim()
        : claim.remarks,
    },
    include: {
      recorder: { select: { id: true, name: true, email: true } },
      sanctioner: { select: { id: true, name: true, email: true } },
    },
  });

  // Append-only audit trail
  await recordFinancialAudit(ctx.companyId, {
    entityType: 'INCENTIVE_CLAIM',
    entityId: updated.id,
    action: 'STATUS_CHANGE',
    previousValue: claim,
    newValue: updated,
    performedBy: ctx.userId,
    reason: validated.notes || `Filed ${claim.scheme} claim of ₹${claim.claimedAmount.toLocaleString('en-IN')}`,
  });

  return NextResponse.json({
    success: true,
    claim: updated,
  });
});
