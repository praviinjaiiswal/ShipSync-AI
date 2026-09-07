import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { transporterStatusUpdateSchema } from '@/lib/validations';
import { ValidationError, NotFoundError } from '@/lib/errors';

export const PATCH = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'transporter:update');

  const booking = await prisma.transporterBooking.findFirst({
    where: { id: params.id, companyId: ctx.companyId },
  });

  if (!booking) {
    throw new NotFoundError('Transporter booking not found in your organization');
  }

  const body = await req.json().catch(() => ({}));
  const parsed = transporterStatusUpdateSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError('Validation failed for transporter status update', parsed.error.flatten());
  }

  const newStatus = parsed.data.status;
  const updateData: any = {
    status: newStatus,
    ...(parsed.data.notes ? { notes: parsed.data.notes } : {}),
  };

  const actualDate = parsed.data.actualTime ? new Date(parsed.data.actualTime) : new Date();

  if (newStatus === 'PICKED_UP' && !booking.actualPickupTime) {
    updateData.actualPickupTime = actualDate;
  } else if (newStatus === 'DELIVERED' && !booking.actualDeliveryTime) {
    updateData.actualDeliveryTime = actualDate;
  }

  const updatedBooking = await prisma.transporterBooking.update({
    where: { id: booking.id },
    data: updateData,
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
      shipmentId: booking.shipmentId,
      action: 'TRANSPORTER_STATUS_UPDATED',
      details: `Transporter ${booking.transporterName} (${booking.vehicleNumber}) status updated from ${booking.status} to ${newStatus}`,
    },
  });

  return NextResponse.json({ success: true, booking: updatedBooking });
});
