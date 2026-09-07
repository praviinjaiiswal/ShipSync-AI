import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { rateLimiter, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { findHSCode } from '@/lib/ai';
import { getCached, setCached, createTenantKey, hashKey, CACHE_TTL } from '@/lib/cache';
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

  try {
    const result = await findHSCode(productDescription);
    setCached(cacheKey, result, CACHE_TTL.HS_CODE);
    return NextResponse.json(result);
  } catch (err) {
    console.error('AI HS code lookup failed:', err);
    throw new ExternalServiceError('AI HS code identification service is unavailable. Please retry.');
  }
});