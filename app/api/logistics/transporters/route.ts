import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { transporterBookingCreateSchema } from '@/lib/validations';
import { ValidationError, NotFoundError } from '@/lib/errors';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'transporter:read');

  const { searchParams } = new URL(req.url);
  const shipmentId = searchParams.get('shipmentId');
  const importShipmentId = searchParams.get('importShipmentId');
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const offset = Math.max(0, parseInt(searchParams.get('offset') || searchParams.get('skip') || '0', 10));

  const where: any = { companyId: ctx.companyId };
  if (shipmentId) where.shipmentId = shipmentId;
  if (importShipmentId) where.importShipmentId = importShipmentId;

  const bookings = await prisma.transporterBooking.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      booker: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
    take: limit,
    skip: offset,
  });

  return NextResponse.json({ success: true, bookings });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'transporter:book');

  const body = await req.json().catch(() => ({}));
  const parsed = transporterBookingCreateSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError('Validation failed for transporter booking', parsed.error.flatten());
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

  const booking = await prisma.transporterBooking.create({
    data: {
      companyId: ctx.companyId,
      shipmentId: parsed.data.shipmentId || null,
      importShipmentId: parsed.data.importShipmentId || null,
      transporterName: parsed.data.transporterName,
      contactNumber: parsed.data.contactNumber,
      contactPerson: parsed.data.contactPerson || null,
      vehicleNumber: parsed.data.vehicleNumber,
      vehicleType: parsed.data.vehicleType || '40ft Multi-Axle Trailer',
      driverName: parsed.data.driverName || null,
      driverPhone: parsed.data.driverPhone || null,
      driverLicense: parsed.data.driverLicense || null,
      pickupLocation: parsed.data.pickupLocation,
      deliveryLocation: parsed.data.deliveryLocation,
      scheduledTime: new Date(parsed.data.scheduledTime),
      ewayBillNumber: parsed.data.ewayBillNumber || null,
      notes: parsed.data.notes || null,
      status: 'BOOKED',
      bookedBy: ctx.userId,
    },
    include: {
      booker: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  await prisma.activity.create({
    data: {
      companyId: ctx.companyId,
      userId: ctx.userId,
      shipmentId: parsed.data.shipmentId || null,
      action: 'TRANSPORTER_BOOKED',
      details: `Booked transporter ${parsed.data.transporterName} (Vehicle: ${parsed.data.vehicleNumber}) from ${parsed.data.pickupLocation} to ${parsed.data.deliveryLocation}`,
    },
  });

  return NextResponse.json({ success: true, booking });
});
