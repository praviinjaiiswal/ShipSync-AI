import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { getTenantContext } from '@/lib/tenant';
import { rateLimiter, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { NotFoundError, ValidationError, ForbiddenError } from '@/lib/errors';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await getTenantContext();
  await rateLimiter.check(req, `team_accept:${ctx.userId}`, RATE_LIMIT_PRESETS.AUTH);

  const body = await req.json();
  const { token } = body;

  if (!token) {
    throw new ValidationError('Invitation token is required');
  }

  const invite = await prisma.teamInvite.findUnique({
    where: { token },
    include: { company: true },
  });

  if (!invite || invite.status !== 'PENDING') {
    throw new NotFoundError('Invitation is invalid or has already been accepted');
  }

  if (invite.expiresAt && new Date() > invite.expiresAt) {
    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: { status: 'EXPIRED' },
    });
    throw new ValidationError('This invitation has expired. Please ask your administrator to resend it.');
  }

  // Verify email matches if present
  if (invite.email.toLowerCase() !== ctx.user.email.toLowerCase()) {
    throw new ForbiddenError('This invitation was sent to a different email address');
  }

  // Update user with new company and role
  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: ctx.userId },
      data: {
        companyId: invite.companyId,
        role: invite.role,
        onboardingComplete: true,
      },
      include: { company: true },
    }),
    prisma.teamInvite.update({
      where: { id: invite.id },
      data: {
        status: 'ACCEPTED',
        usedAt: new Date(),
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    user: updatedUser,
    company: invite.company,
  });
});