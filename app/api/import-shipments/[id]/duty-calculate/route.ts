import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { calculateCustomsDuty } from '@/lib/duty-calculator';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';

const calculateOverrideSchema = z.object({
  hsCode: z.string().regex(/^\d{8}$/).optional(),
  invoiceValue: z.coerce.number().positive().optional(),
  landingChargePct: z.coerce.number().min(0).max(0.1).optional(),
}).optional();

export const POST = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'duty:calculate');

  const shipment = await prisma.importShipment.findFirst({
    where: {
      id: params.id,
      companyId: ctx.companyId,
    },
  });

  if (!shipment) {
    throw new NotFoundError('Import shipment not found');
  }

  let overrides: z.infer<typeof calculateOverrideSchema> = undefined;
  try {
    const body = await req.json();
    overrides = calculateOverrideSchema.parse(body);
  } catch {
    // Body optional
  }

  const hsCode = overrides?.hsCode || shipment.hsCode;
  const invoiceValue = overrides?.invoiceValue || shipment.invoiceValue;
  const landingChargePct = overrides?.landingChargePct ?? 0.01;

  const breakdown = await calculateCustomsDuty(
    ctx.companyId,
    hsCode,
    invoiceValue,
    landingChargePct
  );

  return NextResponse.json({
    breakdown,
    currency: shipment.currency,
  });
});
