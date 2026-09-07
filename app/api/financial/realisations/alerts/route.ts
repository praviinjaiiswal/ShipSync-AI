import { NextResponse } from 'next/server';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { withErrorHandler } from '@/lib/api-handler';
import { evaluateRealisationStatus } from '@/lib/financial-closure';

export const dynamic = 'force-dynamic';

/**
 * GET /api/financial/realisations/alerts
 * Surface actionable RBI 9-month statutory export realization alerts for the dashboard.
 */
export const GET = withErrorHandler(async () => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'export_realisation:read');

  const realisations = await ctx.tenantDb.exportRealisation.findMany({
    where: {
      companyId: ctx.companyId,
      status: { in: ['PENDING', 'PARTIALLY_REALISED', 'OVERDUE'] },
    },
    include: {
      shipment: {
        select: {
          id: true,
          buyerName: true,
          buyerCountry: true,
          productDesc: true,
          value: true,
          currency: true,
          createdAt: true,
        },
      },
    },
    orderBy: { overdueDate: 'asc' },
  });

  const now = new Date();
  const alerts = realisations.map((record) => {
    const overdueTime = new Date(record.overdueDate).getTime();
    const diffDays = Math.ceil((overdueTime - now.getTime()) / (1000 * 60 * 60 * 24));

    let urgency: 'OVERDUE' | 'CRITICAL' | 'WARNING' | 'NORMAL' = 'NORMAL';
    if (diffDays <= 0 || record.isOverdue) {
      urgency = 'OVERDUE';
    } else if (diffDays <= 30) {
      urgency = 'CRITICAL';
    } else if (diffDays <= 60) {
      urgency = 'WARNING';
    }

    return {
      id: record.id,
      shipmentId: record.shipmentId,
      buyerName: (record as any).shipment?.buyerName || 'Unknown Buyer',
      productDesc: (record as any).shipment?.productDesc || 'Export Goods',
      invoiceValue: record.invoiceValue,
      amountRealised: record.amountRealised,
      outstandingAmount: Math.max(0, record.invoiceValue - record.amountRealised),
      currency: record.currency,
      overdueDate: record.overdueDate,
      daysRemaining: diffDays,
      urgency,
      status: record.status,
    };
  });

  const overdueCount = alerts.filter((a) => a.urgency === 'OVERDUE').length;
  const criticalCount = alerts.filter((a) => a.urgency === 'CRITICAL').length;

  return NextResponse.json({
    success: true,
    totalPending: alerts.length,
    overdueCount,
    criticalCount,
    alerts,
  });
});
