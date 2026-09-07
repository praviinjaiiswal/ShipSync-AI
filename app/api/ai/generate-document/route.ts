import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { rateLimiter, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { generateDocument } from '@/lib/ai';
import { getCached, setCached, createTenantKey, CACHE_TTL } from '@/lib/cache';
import { ValidationError, NotFoundError, ExternalServiceError } from '@/lib/errors';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'document:create');

  await rateLimiter.check(req, `ai:${ctx.userId}`, RATE_LIMIT_PRESETS.AI);

  const body = await req.json();
  const { shipmentId, docType } = body;

  if (!shipmentId || !docType) {
    throw new ValidationError('Both shipmentId and docType are required');
  }

  const shipment = await prisma.shipment.findFirst({
    where: { id: shipmentId, companyId: ctx.companyId },
  });

  if (!shipment) {
    throw new NotFoundError('Shipment not found in your organization');
  }

  const cacheKey = createTenantKey(ctx.companyId, 'generated-doc', `${shipmentId}:${docType}`);
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const result = await generateDocument(docType, shipment);
    setCached(cacheKey, result, CACHE_TTL.AI_SUGGESTION);

    await prisma.activity.create({
      data: {
        companyId: ctx.companyId,
        userId: ctx.userId,
        shipmentId: shipment.id,
        action: 'DOCUMENT_GENERATED',
        details: `Generated ${docType} for shipment ${shipment.buyerName}`,
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('AI document generation failed:', err);
    throw new ExternalServiceError('Document generation service failed. Please retry.');
  }
});