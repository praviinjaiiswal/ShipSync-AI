import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { rateLimiter, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { findHSCode } from '@/lib/ai';
import { getCached, setCached, createTenantKey, globalCacheKey, hashKey, CACHE_TTL } from '@/lib/cache';
import { ValidationError, ExternalServiceError } from '@/lib/errors';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'ai:use');

  // Rate limit AI searches per user
  await rateLimiter.check(req, `ai:${ctx.userId}`, RATE_LIMIT_PRESETS.AI);

  const body = await req.json();
  const productDescription = body.productDescription?.trim();

  if (!productDescription || productDescription.length < 5) {
    throw new ValidationError('Product description must be at least 5 characters long');
  }

  // Tenant-namespaced caching with SHA-256 hash
  const cacheKey = createTenantKey(ctx.companyId, 'hs-code', hashKey(productDescription.toLowerCase()));
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  let aiResult: any;
  try {
    aiResult = await findHSCode(productDescription);
  } catch (err) {
    console.error('AI HS code lookup failed:', err);
    throw new ExternalServiceError('AI HS code identification service is unavailable. Please retry.');
  }

  const suggestedCode = (aiResult?.hsCode || '').trim().replace(/\./g, '');

  // Cross-reference against official TariffSchedule ground-truth table with cache
  const tariffCacheKey = globalCacheKey('tariff-entry', suggestedCode);
  let tariffMatch = getCached<any>(tariffCacheKey);
  if (!tariffMatch) {
    tariffMatch = await prisma.tariffSchedule.findUnique({
      where: { hsCode: suggestedCode },
    });
    if (tariffMatch) {
      setCached(tariffCacheKey, tariffMatch, 4 * 60 * 60 * 1000); // 4-hour reasonable TTL
    }
  }

  let responsePayload: any;

  if (tariffMatch) {
    // Grounded in official tariff database: Use DB description as statutory source of truth
    responsePayload = {
      verified: true,
      hsCode: tariffMatch.hsCode,
      description: tariffMatch.description,
      chapterHeading: tariffMatch.chapterHeading || aiResult.chapterHeading,
      unit: tariffMatch.unit || null,
      source: tariffMatch.source,
      updatedAt: tariffMatch.updatedAt,
      applicableDuties: aiResult.applicableDuties || 'Per statutory schedule',
    };
  } else {
    // Unverified code: Do not discard, but flag prominently and log for admin review
    responsePayload = {
      verified: false,
      hsCode: suggestedCode,
      description: aiResult.description || 'AI suggested classification',
      chapterHeading: aiResult.chapterHeading || suggestedCode.slice(0, 4),
      unit: null,
      source: 'AI Predictive Model (Unverified)',
      updatedAt: new Date().toISOString(),
      applicableDuties: aiResult.applicableDuties || 'Unverified',
      warning: 'This code could not be validated against the tariff database — please confirm manually before use.',
    };

    // Log unverified suggestion asynchronously for tariff schedule expansion
    try {
      await prisma.unverifiedHsCodeSuggestion.create({
        data: {
          companyId: ctx.companyId,
          productDescription,
          suggestedCode,
        },
      });
    } catch (logErr) {
      console.error('Failed to log unverified HS code suggestion:', logErr);
    }
  }

  setCached(cacheKey, responsePayload, CACHE_TTL.HS_CODE);
  return NextResponse.json(responsePayload);
});