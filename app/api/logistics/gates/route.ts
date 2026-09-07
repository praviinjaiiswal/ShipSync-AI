import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { NotFoundError } from '@/lib/errors';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'logistics:read');

  const { searchParams } = new URL(req.url);
  const shipmentId = searchParams.get('shipmentId');
  const importShipmentId = searchParams.get('importShipmentId');
  const targetStatus = searchParams.get('targetStatus');

  if (!shipmentId && !importShipmentId) {
    return NextResponse.json(
      { success: false, message: 'shipmentId or importShipmentId required' },
      { status: 400 }
    );
  }

  // Fetch recorded physical events for this entity
  const events = await prisma.logisticsEvent.findMany({
    where: {
      companyId: ctx.companyId,
      ...(shipmentId ? { shipmentId } : { importShipmentId }),
    },
    select: { eventType: true, attachments: true, timestamp: true },
  });

  const recordedTypes = new Set(events.map((e) => e.eventType));
  let isCleared = true;
  const missingMilestones: string[] = [];

  if (shipmentId) {
    // Export gates
    const shipment = await prisma.shipment.findFirst({
      where: { id: shipmentId, companyId: ctx.companyId },
      include: { shippingBill: true },
    });

    if (!shipment) {
      throw new NotFoundError('Export shipment not found');
    }

    if (targetStatus === 'CUSTOMS_CLEARED') {
      // Must have LEO issued or examination completed
      const hasLeo = !!shipment.shippingBill?.leoNumber || recordedTypes.has('LEO_ISSUED');
      if (!hasLeo) {
        isCleared = false;
        missingMilestones.push('LEO_ISSUED');
      }
    } else if (targetStatus === 'GATE_IN') {
      // Port gate-in requires examination & stuffing completed or LEO issued
      const hasExam = recordedTypes.has('EXAMINATION_COMPLETED');
      const hasStuffing = recordedTypes.has('STUFFING_COMPLETED');
      const hasLeo = !!shipment.shippingBill?.leoNumber || recordedTypes.has('LEO_ISSUED');

      if (!hasLeo && (!hasExam || !hasStuffing)) {
        isCleared = false;
        if (!hasExam) missingMilestones.push('EXAMINATION_COMPLETED');
        if (!hasStuffing) missingMilestones.push('STUFFING_COMPLETED');
      }
    } else if (targetStatus === 'SHIPPED') {
      // Vessel dispatch requires loaded on vessel or EGM filed
      const hasLoaded = recordedTypes.has('LOADED_ON_VESSEL');
      const hasEgm = !!shipment.shippingBill?.egmNumber;

      if (!hasLoaded && !hasEgm) {
        isCleared = false;
        missingMilestones.push('LOADED_ON_VESSEL');
      }
    }
  } else if (importShipmentId) {
    // Import gates
    const importShipment = await prisma.importShipment.findFirst({
      where: { id: importShipmentId, companyId: ctx.companyId },
      include: { billOfEntry: true },
    });

    if (!importShipment) {
      throw new NotFoundError('Import shipment not found');
    }

    if (targetStatus === 'OUT_OF_CHARGE') {
      const hasOoc = recordedTypes.has('OUT_OF_CHARGE_ISSUED') || importShipment.status === 'OUT_OF_CHARGE';
      if (!hasOoc) {
        isCleared = false;
        missingMilestones.push('OUT_OF_CHARGE_ISSUED');
      }
    } else if (targetStatus === 'DELIVERED') {
      // Final delivery strictly requires Out of Charge order
      const hasOoc = recordedTypes.has('OUT_OF_CHARGE_ISSUED') || importShipment.status === 'OUT_OF_CHARGE';
      if (!hasOoc) {
        isCleared = false;
        missingMilestones.push('OUT_OF_CHARGE_ISSUED');
      }
    }
  }

  return NextResponse.json({
    success: true,
    isCleared,
    missingMilestones,
    recordedEventTypes: Array.from(recordedTypes),
    totalEvents: events.length,
  });
});
