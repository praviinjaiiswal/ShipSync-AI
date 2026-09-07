import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { customsFilingRequestSchema } from '@/lib/validations';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { enqueueBillOfEntryFiling } from '@/lib/customs/filing-queue';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'customs:file');

  const body = await req.json().catch(() => null);
  if (!body) {
    throw new ValidationError('Request body is required');
  }

  const parsed = customsFilingRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0]?.message || 'Validation failed', parsed.error.format());
  }

  const { importShipmentId, beNumber } = parsed.data;

  // Verify shipment exists and belongs to this tenant
  const shipment = await prisma.importShipment.findFirst({
    where: { id: importShipmentId, companyId: ctx.companyId },
    include: { billOfEntry: true },
  });

  if (!shipment) {
    throw new NotFoundError('Import shipment not found');
  }

  if (!shipment.billOfEntry) {
    throw new ValidationError('A Bill of Entry must be generated before transmitting to ICEGATE.');
  }

  // Construct statutory filing payload
  const filingPayload = {
    companyId: ctx.companyId,
    importShipmentId: shipment.id,
    importerIEC: shipment.importerIEC,
    importerName: shipment.importerName,
    portOfImport: shipment.portOfImport,
    igmNumber: shipment.igmNumber,
    blOrAwbNumber: shipment.blOrAwbNumber,
    hsCode: shipment.hsCode,
    invoiceValue: shipment.invoiceValue,
    currency: shipment.currency,
    assessableValue: shipment.assessableValue,
    dutyPayable: shipment.billOfEntry.totalDutyPayable,
    dutyBreakdown: shipment.billOfEntry.dutyBreakdown as Record<string, any>,
    beNumber,
  };

  // Dispatch to background queue
  const jobId = await enqueueBillOfEntryFiling({
    companyId: ctx.companyId,
    importShipmentId: shipment.id,
    userId: ctx.userId,
    payload: filingPayload,
  });

  return NextResponse.json({
    success: true,
    data: {
      jobId,
      status: 'QUEUED',
      beNumber,
      message: 'Bill of Entry transmission has been enqueued to ICEGATE.',
    },
  });
});
