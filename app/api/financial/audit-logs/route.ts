import { NextRequest, NextResponse } from 'next/server';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { withErrorHandler } from '@/lib/api-handler';
import { FinancialEntityType } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/financial/audit-logs
 * Fetch immutable append-only audit trail for financial entities.
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'financial_audit:read');

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get('entityType') as FinancialEntityType | null;
  const entityId = searchParams.get('entityId');
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const offset = Math.max(0, parseInt(searchParams.get('offset') || searchParams.get('skip') || '0', 10));

  const whereClause: any = { companyId: ctx.companyId };
  if (entityType) {
    whereClause.entityType = entityType;
  }
  if (entityId) {
    whereClause.entityId = entityId;
  }

  const logs = await ctx.tenantDb.financialAuditLog.findMany({
    where: whereClause,
    include: {
      performer: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });


  return NextResponse.json({
    success: true,
    logs,
  });
});
