import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { importShipmentSchema } from '@/lib/validations';
import { ValidationError, NotFoundError } from '@/lib/errors';
import type { Prisma, ImportShipmentStatus } from '@prisma/client';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'import_shipment:read');

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
  const search = searchParams.get('search')?.trim();
  const status = searchParams.get('status')?.trim() as ImportShipmentStatus | undefined;
  const skip = (page - 1) * limit;

  const where: Prisma.ImportShipmentWhereInput = {
    companyId: ctx.companyId,
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { importerName: { contains: search, mode: 'insensitive' } },
            { supplierName: { contains: search, mode: 'insensitive' } },
            { hsCode: { contains: search } },
            { igmNumber: { contains: search, mode: 'insensitive' } },
            { blOrAwbNumber: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [shipments, total] = await Promise.all([
    prisma.importShipment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        billOfEntry: {
          select: {
            beNumber: true,
            totalDutyPayable: true,
            paymentStatus: true,
          },
        },
      },
    }),
    prisma.importShipment.count({ where }),
  ]);

  return NextResponse.json({
    shipments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'import_shipment:create');

  const body = await req.json();
  const parsed = importShipmentSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError('Validation failed for import shipment', parsed.error.flatten());
  }

  const {
    importerName,
    importerIEC,
    supplierName,
    supplierCountry,
    portOfImport,
    igmNumber,
    blOrAwbNumber,
    hsCode,
    invoiceValue,
    currency,
    incoterm,
  } = parsed.data;

  // 1. Verify HS code exists in ImportDutyRate (reject unknown codes)
  const dutyRate = await prisma.importDutyRate.findUnique({
    where: { hsCode },
  });

  if (!dutyRate) {
    throw new ValidationError(
      `HS Code ${hsCode} does not exist in the official Customs Tariff schedule. Unregistered codes cannot be imported.`
    );
  }

  // 2. Check ITC-HS Import Policy (Restricted / Prohibited goods check)
  const policyItem = await prisma.restrictedItemsList.findUnique({
    where: { hsCode },
  });

  if (policyItem?.policy === 'PROHIBITED') {
    throw new ValidationError(
      `Import of HS Code ${hsCode} is strictly PROHIBITED under Indian Customs & Foreign Trade Policy. Shipment creation rejected.`
    );
  }

  // 3. Compute statutory assessable value = CIF + 1% Landing Charges
  const assessableValue = Math.round(invoiceValue * 1.01 * 100) / 100;

  // 4. Create import shipment
  const shipment = await prisma.importShipment.create({
    data: {
      companyId: ctx.companyId,
      userId: ctx.userId,
      importerName,
      importerIEC,
      supplierName,
      supplierCountry,
      portOfImport,
      igmNumber: igmNumber || null,
      blOrAwbNumber: blOrAwbNumber || null,
      hsCode,
      invoiceValue,
      currency,
      incoterm,
      assessableValue,
      status: 'IGM_FILED',
    },
  });

  // 5. Audit activity log
  await prisma.activity.create({
    data: {
      companyId: ctx.companyId,
      userId: ctx.userId,
      action: 'IMPORT_SHIPMENT_CREATED',
      details: `Import Shipment created for ${supplierName} (HS Code: ${hsCode}, Value: ${currency} ${invoiceValue})`,
    },
  });

  return NextResponse.json(
    {
      shipment,
      policyNotice: policyItem
        ? {
            policy: policyItem.policy,
            condition: policyItem.policyCondition,
            requiredLicenseType: policyItem.requiredLicenseType,
          }
        : null,
    },
    { status: 201 }
  );
});
