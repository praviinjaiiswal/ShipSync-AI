import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { getCustomsAdapter } from '@/lib/customs/adapter-factory';
import { z } from 'zod';
import { ValidationError } from '@/lib/errors';

const pingSchema = z.object({
  service: z.enum(['ICEGATE', 'DGFT', 'ESANCHIT']).default('ICEGATE'),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'customs:status_check');

  const body = await req.json().catch(() => ({}));
  const parsed = pingSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError('Invalid service parameter');
  }

  const { service } = parsed.data;
  const adapter = await getCustomsAdapter(ctx.companyId, service);
  const result = await adapter.ping();

  return NextResponse.json({
    success: true,
    data: result,
  });
});
