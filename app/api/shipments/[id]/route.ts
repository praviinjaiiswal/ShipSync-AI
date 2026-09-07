import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { shipmentSchema } from '@/lib/validations';
import { ValidationError, NotFoundError } from '@/lib/errors';

export const GET = withErrorHandler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'shipment:read');

  const shipment = await prisma.shipment.findFirst({
    where: { id: params.id, companyId: ctx.companyId },
    include: {
      documents: true,
      complianceChecks: true,
      riskReport: true,
      sanctionsCheck: true,
      shippingBill: true,
      amendments: { orderBy: { createdAt: 'desc' } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!shipment) {
    throw new NotFoundError('Shipment not found in your organization');
  }

  return NextResponse.json(shipment);
});

export const PATCH = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'shipment:update');

  const existing = await prisma.shipment.findFirst({
    where: { id: params.id, companyId: ctx.companyId },
  });

  if (!existing) {
    throw new NotFoundError('Shipment not found');
  }

  const body = await req.json();
  const parsed = shipmentSchema.partial().safeParse(body);

  if (!parsed.success) {
    throw new ValidationError('Validation failed for shipment update', parsed.error.flatten());
  }

  // Statutory lock enforcement: If shipping bill generated / locked, direct changes to declared values are blocked
  if (existing.isLocked) {
    const isModifyingDeclaredFields =
      (parsed.data.value !== undefined && parsed.data.value !== existing.value) ||
      (parsed.data.hsCode !== undefined && parsed.data.hsCode !== existing.hsCode) ||
      (parsed.data.buyerName !== undefined && parsed.data.buyerName !== existing.buyerName);

    if (isModifyingDeclaredFields) {
      throw new ValidationError(
        'Shipment is locked under Section 149 of Customs Act because a Shipping Bill is active. Please use the statutory amendment endpoint (/amend) to record changes with justification.'
      );
    }
  }

  const shipment = await prisma.shipment.update({
    where: { id: params.id },
    data: parsed.data,
  });

  await prisma.activity.create({
    data: {
      companyId: ctx.companyId,
      userId: ctx.userId,
      shipmentId: shipment.id,
      action: 'SHIPMENT_UPDATED',
      details: `Updated shipment for ${shipment.buyerName}`,
    },
  });

  return NextResponse.json(shipment);
});

export const DELETE = withErrorHandler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'shipment:delete');

  const existing = await prisma.shipment.findFirst({
    where: { id: params.id, companyId: ctx.companyId },
  });

  if (!existing) {
    throw new NotFoundError('Shipment not found');
  }

  await prisma.activity.create({
    data: {
      companyId: ctx.companyId,
      userId: ctx.userId,
      action: 'SHIPMENT_DELETED',
      details: `Deleted shipment for ${existing.buyerName} (${existing.hsCode})`,
    },
  });

  await prisma.shipment.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true, message: 'Shipment deleted successfully' });
});