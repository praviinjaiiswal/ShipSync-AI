import { NextRequest, NextResponse } from 'next/server';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { exportRealisationConfirmSchema } from '@/lib/validations';
import { withErrorHandler } from '@/lib/api-handler';
import { NotFoundError } from '@/lib/errors';
import { recordFinancialAudit } from '@/lib/financial-closure';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/financial/realisations/[id]/confirm
 * Role-restricted confirmation of BRC export proceeds (OWNER & ADMIN only).
 */
export const PATCH = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const ctx = await requireTenantContext();
  // Strictly restricted: OPS_EXECUTIVE cannot self-approve/confirm
  assertPermission(ctx.role, 'export_realisation:confirm');

  const body = await req.json();
  const validated = exportRealisationConfirmSchema.parse(body);

  const existing = await ctx.tenantDb.exportRealisation.findFirst({
    where: { id: params.id },
  });

  if (!existing) {
    throw new NotFoundError('Export realisation record not found');
  }

  const updated = await ctx.tenantDb.exportRealisation.update({
    where: { id: params.id },
    data: {
      status: validated.status,
      confirmedBy: ctx.userId,
      confirmedAt: new Date(),
      remarks: validated.remarks
        ? `${existing.remarks || ''}\n[Confirmed]: ${validated.remarks}`.trim()
        : existing.remarks,
    },
    include: {
      recorder: { select: { id: true, name: true, email: true } },
      confirmer: { select: { id: true, name: true, email: true } },
    },
  });

  // Append-only audit trail
  await recordFinancialAudit(ctx.companyId, {
    entityType: 'EXPORT_REALISATION',
    entityId: updated.id,
    action: 'CONFIRM',
    previousValue: existing,
    newValue: updated,
    performedBy: ctx.userId,
    reason: validated.remarks || `Confirmed realization as ${validated.status}`,
  });

  return NextResponse.json({
    success: true,
    realisation: updated,
  });
});
