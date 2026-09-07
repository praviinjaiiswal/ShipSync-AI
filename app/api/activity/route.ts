import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'activity:read');

  const searchParams = req.nextUrl.searchParams;
  const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));

  const activities = await prisma.activity.findMany({
    where: { companyId: ctx.companyId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImageUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return NextResponse.json(activities);
});