import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { getTenantContext } from '@/lib/tenant';
import { profileSchema } from '@/lib/validations';
import { ValidationError } from '@/lib/errors';

export const GET = withErrorHandler(async () => {
  const ctx = await getTenantContext();
  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    include: { company: true },
  });

  return NextResponse.json({ user });
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const ctx = await getTenantContext();
  const body = await req.json();

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError('Invalid profile data', parsed.error.flatten());
  }

  const updatedUser = await prisma.user.update({
    where: { id: ctx.userId },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      designation: parsed.data.designation || null,
      profileImageUrl: parsed.data.profileImageUrl || null,
    },
    include: { company: true },
  });

  return NextResponse.json({
    success: true,
    user: updatedUser,
  });
});
