import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { shipmentSchema } from '@/lib/validations';
import { ValidationError } from '@/lib/errors';
import type { ShipmentStatus } from '@prisma/client';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'shipment:read');

  const searchParams = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '10'));
  const search = searchParams.get('search')?.trim() ?? '';
  const status = searchParams.get('status') ?? '';

  const where = {
    companyId: ctx.companyId,
    ...(search && {
      OR: [
        { buyerName: { contains: search, mode: 'insensitive' as const } },
        { productDesc: { contains: search, mode: 'insensitive' as const } },
        { hsCode: { contains: search } },
      ],
    }),
    ...(status && { status: status as ShipmentStatus }),
  };

  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.shipment.count({ where }),
  ]);

  return NextResponse.json({
    shipments,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'shipment:create');

  const body = await req.json();
  const parsed = shipmentSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError('Validation failed for shipment', parsed.error.flatten());
  }

  const shipment = await prisma.shipment.create({
    data: {
      ...parsed.data,
      buyerEmail: parsed.data.buyerEmail || null,
      companyId: ctx.companyId,
      userId: ctx.userId,
    },
  });

  await prisma.activity.create({
    data: {
      companyId: ctx.companyId,
      userId: ctx.userId,
      shipmentId: shipment.id,
      action: 'SHIPMENT_CREATED',
      details: `Created shipment for ${shipment.buyerName} (${shipment.hsCode})`,
    },
  });

  return NextResponse.json(shipment, { status: 201 });
});