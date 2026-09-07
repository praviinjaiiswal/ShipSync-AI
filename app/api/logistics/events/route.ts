import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { logisticsEventCreateSchema } from '@/lib/validations';
import { ValidationError, NotFoundError } from '@/lib/errors';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'logistics:read');

  const { searchParams } = new URL(req.url);
  const shipmentId = searchParams.get('shipmentId');
  const importShipmentId = searchParams.get('importShipmentId');
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const offset = Math.max(0, parseInt(searchParams.get('offset') || searchParams.get('skip') || '0', 10));

  const where: any = { companyId: ctx.companyId };
  if (shipmentId) where.shipmentId = shipmentId;
  if (importShipmentId) where.importShipmentId = importShipmentId;

  const events = await prisma.logisticsEvent.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    include: {
      recorder: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
    take: limit,
    skip: offset,
  });

  return NextResponse.json({ success: true, events });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'logistics:record');

  const body = await req.json().catch(() => ({}));
  const parsed = logisticsEventCreateSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError('Validation failed for logistics event', parsed.error.flatten());
  }

  // Verify target shipment exists in this company
  if (parsed.data.shipmentId) {
    const shipment = await prisma.shipment.findFirst({
      where: { id: parsed.data.shipmentId, companyId: ctx.companyId },
    });
    if (!shipment) {
      throw new NotFoundError('Export shipment not found');
    }
  }

  if (parsed.data.importShipmentId) {
    const importShipment = await prisma.importShipment.findFirst({
      where: { id: parsed.data.importShipmentId, companyId: ctx.companyId },
    });
    if (!importShipment) {
      throw new NotFoundError('Import shipment not found');
    }
  }

  const event = await prisma.logisticsEvent.create({
    data: {
      companyId: ctx.companyId,
      shipmentId: parsed.data.shipmentId || null,
      importShipmentId: parsed.data.importShipmentId || null,
      eventType: parsed.data.eventType,
      timestamp: parsed.data.timestamp ? new Date(parsed.data.timestamp) : new Date(),
      location: parsed.data.location,
      remarks: parsed.data.remarks || null,
      attachments: parsed.data.attachments || [],
      officerOrInspectorName: parsed.data.officerOrInspectorName || null,
      containerNumber: parsed.data.containerNumber || null,
      sealNumber: parsed.data.sealNumber || null,
      recordedBy: ctx.userId,
    },
    include: {
      recorder: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  await prisma.activity.create({
    data: {
      companyId: ctx.companyId,
      userId: ctx.userId,
      shipmentId: parsed.data.shipmentId || null,
      action: 'LOGISTICS_EVENT_RECORDED',
      details: `Recorded physical event ${parsed.data.eventType} at ${parsed.data.location}`,
    },
  });

  return NextResponse.json({ success: true, event });
});
