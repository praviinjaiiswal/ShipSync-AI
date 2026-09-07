import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';

export const GET = withErrorHandler(async (req: any) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'team:read');

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const skip = (page - 1) * limit;

  const [members, totalMembers, pendingInvites] = await Promise.all([
    prisma.user.findMany({
      where: {
        companyId: ctx.companyId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        designation: true,
        profileImageUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    }),
    prisma.user.count({
      where: {
        companyId: ctx.companyId,
        isActive: true,
      },
    }),
    prisma.teamInvite.findMany({
      where: {
        companyId: ctx.companyId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return NextResponse.json({
    members,
    pendingInvites,
    pagination: {
      total: totalMembers,
      page,
      limit,
      totalPages: Math.ceil(totalMembers / limit),
    },
    isOwnerOrAdmin: ctx.role === 'OWNER' || ctx.role === 'ADMIN',
    currentUserRole: ctx.role,
    currentUserId: ctx.userId,
  });
});