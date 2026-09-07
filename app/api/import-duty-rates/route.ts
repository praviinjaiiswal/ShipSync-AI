import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { importDutyRateSchema } from '@/lib/validations';
import { invalidateByPrefix } from '@/lib/cache';
import { ValidationError } from '@/lib/errors';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'import_duty_rate:read');

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim();
  const hsCode = searchParams.get('hsCode')?.trim();

  const rates = await prisma.importDutyRate.findMany({
    where: {
      ...(hsCode ? { hsCode: { startsWith: hsCode } } : {}),
      ...(search
        ? {
            OR: [
              { hsCode: { contains: search } },
              { description: { contains: search, mode: 'insensitive' } },
              { sourceNotificationRef: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { hsCode: 'asc' },
    take: 50,
  });

  return NextResponse.json({ rates });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'import_duty_rate:manage');

  const body = await req.json();
  const parsed = importDutyRateSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError('Invalid duty rate configuration', parsed.error.flatten());
  }

  const { hsCode, description, bcdRate, igstRate, cessRate, sourceNotificationRef } = parsed.data;

  // Check if existing record exists for audit tracking
  const existing = await prisma.importDutyRate.findUnique({
    where: { hsCode },
  });

  const rate = await prisma.importDutyRate.upsert({
    where: { hsCode },
    update: {
      description,
      bcdRate,
      igstRate,
      cessRate,
      sourceNotificationRef,
      updatedBy: ctx.userId,
    },
    create: {
      hsCode,
      description,
      bcdRate,
      igstRate,
      cessRate,
      sourceNotificationRef,
      updatedBy: ctx.userId,
    },
  });

  // Audit trail entry
  await prisma.importDutyRateAudit.create({
    data: {
      hsCode,
      previousData: existing ? (existing as any) : null,
      newData: rate as any,
      changedBy: ctx.userId,
    },
  });

  // Bust calculation cache
  invalidateByPrefix('company:');

  return NextResponse.json({
    success: true,
    rate,
  });
});
