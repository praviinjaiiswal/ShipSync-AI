import { NextRequest, NextResponse } from 'next/server';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { exportRealisationCreateSchema } from '@/lib/validations';
import { withErrorHandler } from '@/lib/api-handler';
import { NotFoundError } from '@/lib/errors';
import {
  calculateBrcOverdueDate,
  evaluateRealisationStatus,
  recordFinancialAudit,
} from '@/lib/financial-closure';

export const dynamic = 'force-dynamic';

/**
 * GET /api/financial/realisations
 * Fetch realisations for a shipment or tenant, updating overdue statuses dynamically.
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'export_realisation:read');

  const { searchParams } = new URL(req.url);
  const shipmentId = searchParams.get('shipmentId');
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const offset = Math.max(0, parseInt(searchParams.get('offset') || searchParams.get('skip') || '0', 10));

  const whereClause: any = { companyId: ctx.companyId };
  if (shipmentId) {
    whereClause.shipmentId = shipmentId;
  }

  const realisations = await ctx.tenantDb.exportRealisation.findMany({
    where: whereClause,
    include: {
      recorder: { select: { id: true, name: true, email: true } },
      confirmer: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });


  // Evaluate if any pending/partially realised records are now past deadline
  const updatedRealisations = await Promise.all(
    realisations.map(async (record) => {
      const evaluation = evaluateRealisationStatus(
        record.invoiceValue,
        record.amountRealised,
        record.overdueDate,
        record.status
      );

      if (
        evaluation.status !== record.status ||
        evaluation.isOverdue !== record.isOverdue
      ) {
        return ctx.tenantDb.exportRealisation.update({
          where: { id: record.id },
          data: {
            status: evaluation.status,
            isOverdue: evaluation.isOverdue,
          },
          include: {
            recorder: { select: { id: true, name: true, email: true } },
            confirmer: { select: { id: true, name: true, email: true } },
          },
        });
      }
      return record;
    })
  );

  return NextResponse.json({
    success: true,
    realisations: updatedRealisations,
  });
});

/**
 * POST /api/financial/realisations
 * Record export proceeds realization / BRC evidence.
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'export_realisation:create');

  const body = await req.json();
  const validated = exportRealisationCreateSchema.parse(body);

  const shipment = await ctx.tenantDb.shipment.findFirst({
    where: { id: validated.shipmentId },
    include: { shippingBill: true },
  });

  if (!shipment) {
    throw new NotFoundError('Export shipment not found');
  }

  const exportDate = (shipment as any).shippingBill?.sbDate || shipment.createdAt;
  const overdueDate = calculateBrcOverdueDate(exportDate);
  const evaluation = evaluateRealisationStatus(
    shipment.value,
    validated.amountRealised,
    overdueDate
  );

  const realisation = await ctx.tenantDb.exportRealisation.create({
    data: {
      companyId: ctx.companyId,
      shipmentId: validated.shipmentId,
      invoiceValue: shipment.value,
      amountRealised: validated.amountRealised,
      currency: shipment.currency || 'USD',
      realisationDate: validated.realisationDate ? new Date(validated.realisationDate) : new Date(),
      bankReferenceNumber: validated.bankReferenceNumber || null,
      brcDocumentUrl: validated.brcDocumentUrl || null,
      status: evaluation.status,
      overdueDate,
      isOverdue: evaluation.isOverdue,
      remarks: validated.remarks || null,
      recordedBy: ctx.userId,
    },
    include: {
      recorder: { select: { id: true, name: true, email: true } },
    },
  });

  // Append-only audit trail
  await recordFinancialAudit(ctx.companyId, {
    entityType: 'EXPORT_REALISATION',
    entityId: realisation.id,
    action: 'CREATE',
    newValue: realisation,
    performedBy: ctx.userId,
    reason: validated.remarks || 'Recorded initial export realization / BRC',
  });

  return NextResponse.json({
    success: true,
    realisation,
  });
});
