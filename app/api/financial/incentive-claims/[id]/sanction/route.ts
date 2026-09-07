import { NextRequest, NextResponse } from 'next/server';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { incentiveClaimSanctionSchema } from '@/lib/validations';
import { withErrorHandler } from '@/lib/api-handler';
import { NotFoundError } from '@/lib/errors';
import { recordFinancialAudit } from '@/lib/financial-closure';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/financial/incentive-claims/[id]/sanction
 * Record Customs sanction/credit scroll for an incentive claim (OWNER & ADMIN only).
 */
export const PATCH = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'incentive_claim:sanction');

  const body = await req.json();
  const validated = incentiveClaimSanctionSchema.parse(body);

  const existing = await ctx.tenantDb.incentiveClaim.findFirst({
    where: { id: params.id },
  });

  if (!existing) {
    throw new NotFoundError('Incentive claim not found');
  }

  const updated = await ctx.tenantDb.incentiveClaim.update({
    where: { id: params.id },
    data: {
      status: validated.status,
      sanctionedAmount: validated.sanctionedAmount,
      scrollNumber: validated.scrollNumber,
      scrollDate: validated.scrollDate ? new Date(validated.scrollDate) : new Date(),
      sanctionDate: new Date(),
      creditDate: validated.creditDate ? new Date(validated.creditDate) : null,
      bankAccountRef: validated.bankAccountRef || null,
      sanctionedBy: ctx.userId,
      remarks: validated.remarks
        ? `${existing.remarks || ''}\n[Sanctioned]: ${validated.remarks}`.trim()
        : existing.remarks,
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
    action: 'SANCTION',
    previousValue: existing,
    newValue: updated,
    performedBy: ctx.userId,
    reason: validated.remarks || `Sanctioned with scroll #${validated.scrollNumber}`,
  });

  return NextResponse.json({
    success: true,
    claim: updated,
  });
});
