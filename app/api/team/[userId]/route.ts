import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { NotFoundError, ForbiddenError } from '@/lib/errors';

export const DELETE = withErrorHandler(async (_req: NextRequest, { params }: { params: { userId: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'team:remove_member');

  const { userId } = params;

  if (userId === ctx.userId) {
    throw new ForbiddenError('You cannot remove yourself from the organization');
  }

  const targetUser = await prisma.user.findFirst({
    where: {
      id: userId,
      companyId: ctx.companyId,
      isActive: true,
    },
  });

  if (!targetUser) {
    throw new NotFoundError('Team member not found in your organization');
  }

  // If removing an OWNER, only another OWNER can do it, and at least one other OWNER must remain
  if (targetUser.role === 'OWNER') {
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenError('Only an Owner can remove another Owner');
    }

    const ownerCount = await prisma.user.count({
      where: {
        companyId: ctx.companyId,
        role: 'OWNER',
        isActive: true,
      },
    });

    if (ownerCount <= 1) {
      throw new ForbiddenError('Cannot remove the sole Owner of an organization');
    }
  }

  // Soft delete: deactivate user and remove company association
  await prisma.user.update({
    where: { id: targetUser.id },
    data: {
      isActive: false,
      companyId: null,
      onboardingComplete: false,
    },
  });

  return NextResponse.json({
    success: true,
    message: 'Member removed successfully',
  });
});
