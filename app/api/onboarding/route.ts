import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { getTenantContext } from '@/lib/tenant';
import { companySchema } from '@/lib/validations';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';

const onboardingRequestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('CREATE'),
    company: companySchema,
  }),
  z.object({
    action: z.literal('JOIN'),
    inviteToken: z.string().min(1, 'Invite token is required'),
  }),
]);

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await getTenantContext();
  const body = await req.json();

  const parsed = onboardingRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError('Invalid onboarding data', parsed.error.flatten());
  }

  if (parsed.data.action === 'CREATE') {
    const { company: compData } = parsed.data;

    // Create the new Company
    const company = await prisma.company.create({
      data: {
        name: compData.name,
        gstNumber: compData.gstNumber || null,
        ieCode: compData.ieCode || null,
        panNumber: compData.panNumber || null,
        address: compData.address || null,
      },
    });

    // Assign user to the company as OWNER and complete onboarding
    const updatedUser = await prisma.user.update({
      where: { id: ctx.userId },
      data: {
        companyId: company.id,
        role: 'OWNER',
        onboardingComplete: true,
      },
      include: { company: true },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      company,
    });
  }

  if (parsed.data.action === 'JOIN') {
    const { inviteToken } = parsed.data;

    const invite = await prisma.teamInvite.findUnique({
      where: { token: inviteToken },
      include: { company: true },
    });

    if (!invite || invite.status !== 'PENDING') {
      throw new NotFoundError('Invalid or expired team invitation');
    }

    if (invite.expiresAt && new Date() > invite.expiresAt) {
      await prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' },
      });
      throw new ValidationError('This invitation has expired');
    }

    // Join company with the designated role
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
        data: { status: 'ACCEPTED' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      user: updatedUser,
      company: invite.company,
    });
  }

  throw new ValidationError('Invalid onboarding action');
});
