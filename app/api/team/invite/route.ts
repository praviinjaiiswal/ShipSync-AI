import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { rateLimiter, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { teamInviteSchema } from '@/lib/validations';
import { ValidationError } from '@/lib/errors';
import { sendTeamInviteEmail } from '@/lib/email';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'team:invite');
  await rateLimiter.check(req, `team_invite:${ctx.companyId}`, RATE_LIMIT_PRESETS.AUTH);

  const body = await req.json();
  const parsed = teamInviteSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError('Invalid invite data', parsed.error.flatten());
  }

  const { email, role } = parsed.data;

  // Check if user is already a member of this company
  const existingMember = await prisma.user.findFirst({
    where: {
      email: { equals: email, mode: 'insensitive' },
      companyId: ctx.companyId,
      isActive: true,
    },
  });

  if (existingMember) {
    throw new ValidationError('This user is already a member of your company');
  }

  // Generate a secure 32-byte hex token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours (Chunk 0 spec)

  // Upsert or create invite
  const invite = await prisma.teamInvite.create({
    data: {
      companyId: ctx.companyId,
      email: email.toLowerCase(),
      role,
      token,
      invitedBy: ctx.userId,
      expiresAt,
    },
  });

  // Send invite email (gracefully catch email failure so invite still succeeds)
  try {
    const inviterName = ctx.user.name || ctx.user.email;
    await sendTeamInviteEmail(email, inviterName, role, token);
  } catch (err) {
    console.error('Failed to send invite email:', err);
  }

  return NextResponse.json(invite, { status: 201 });
});