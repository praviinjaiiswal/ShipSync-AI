import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { rateLimiter, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { getCached, setCached, CACHE_TTL } from '@/lib/cache';
import { NotFoundError } from '@/lib/errors';

export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: { hsCode: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'duty_rate:read');

  // Rate limit searches / lookups
  await rateLimiter.check(req, `search:${ctx.userId}`, RATE_LIMIT_PRESETS.SEARCH);

  const cleanHsCode = params.hsCode.trim();
  const cacheKey = `global:duty-rate:${cleanHsCode}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const rate = await prisma.dutyIncentiveRate.findUnique({
    where: { hsCode: cleanHsCode },
  });

  if (!rate) {
    throw new NotFoundError(`No duty rates found for HS code ${cleanHsCode}`);
  }

  setCached(cacheKey, rate, CACHE_TTL.DUTY_RATE);

  return NextResponse.json(rate);
});