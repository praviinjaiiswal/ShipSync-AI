import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { roleChangeSchema } from '@/lib/validations';
import { ValidationError, NotFoundError, ForbiddenError } from '@/lib/errors';

export const PATCH = withErrorHandler(async (req: NextRequest, { params }: { params: { userId: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'team:update_role');

  const { userId } = params;
  const body = await req.json();

  const parsed = roleChangeSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError('Invalid role selection', parsed.error.flatten());
  }

  const { role: newRole } = parsed.data;

  // Find target user in this company
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

  // Prevent user from demoting themselves
  if (targetUser.id === ctx.userId && targetUser.role === 'OWNER' && newRole !== 'OWNER') {
    throw new ForbiddenError('You cannot demote yourself from Owner');
  }

  // If changing an OWNER's role, ensure at least one other OWNER remains
  if (targetUser.role === 'OWNER' && newRole !== 'OWNER') {
    const ownerCount = await prisma.user.count({
      where: {
        companyId: ctx.companyId,
        role: 'OWNER',
        isActive: true,
      },
    });

    if (ownerCount <= 1) {
      throw new ForbiddenError('Organizations must have at least one active Owner');
    }
  }

  const updated = await prisma.user.update({
    where: { id: targetUser.id },
    data: { role: newRole },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    success: true,
    user: updated,
  });
});
