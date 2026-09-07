import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';

export const GET = withErrorHandler(async () => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'compliance:read');

  const shipments = await prisma.shipment.findMany({
    where: { companyId: ctx.companyId },
    select: {
      id: true,
      buyerName: true,
      status: true,
      complianceScore: true,
      sanctionsCheck: { select: { matchFound: true } },
      riskReport: { select: { countryRiskScore: true, buyerRiskScore: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(shipments);
});