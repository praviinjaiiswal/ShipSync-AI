import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';

export const GET = withErrorHandler(async () => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'analytics:read');

  const shipments = await prisma.shipment.findMany({
    where: { companyId: ctx.companyId },
    select: { hsCode: true, value: true },
  });

  const hsCodes = Array.from(new Set(shipments.map((s) => s.hsCode)));
  const rates = await prisma.dutyIncentiveRate.findMany({
    where: { hsCode: { in: hsCodes } },
  });
  const rateMap = new Map(rates.map((r) => [r.hsCode, r]));

  let totalEstimated = 0;
  let unmatchedCount = 0;

  for (const s of shipments) {
    const rate = rateMap.get(s.hsCode);
    if (rate?.rodtepRate) {
      totalEstimated += s.value * (rate.rodtepRate / 100);
    } else {
      unmatchedCount++;
    }
  }

  return NextResponse.json({
    totalEstimated: Math.round(totalEstimated * 100) / 100,
    unmatchedCount,
    totalShipments: shipments.length,
  });
});