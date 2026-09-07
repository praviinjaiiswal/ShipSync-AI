import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { licenseSchema } from '@/lib/validations';
import { ValidationError } from '@/lib/errors';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'license:read');

  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const offset = Math.max(0, parseInt(searchParams.get('offset') || searchParams.get('skip') || '0', 10));

  const licenses = await prisma.license.findMany({
    where: { companyId: ctx.companyId },
    orderBy: { expiryDate: 'asc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    take: limit,
    skip: offset,
  });

  return NextResponse.json(licenses);
});


export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'license:create');

  const body = await req.json();
  const parsed = licenseSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError('Validation failed for license', parsed.error.flatten());
  }

  const license = await prisma.license.create({
    data: {
      companyId: ctx.companyId,
      userId: ctx.userId,
      type: parsed.data.type,
      name: parsed.data.name,
      licenseNumber: parsed.data.licenseNumber || null,
      issueDate: parsed.data.issueDate ? new Date(parsed.data.issueDate) : null,
      expiryDate: new Date(parsed.data.expiryDate),
    },
  });

  await prisma.activity.create({
    data: {
      companyId: ctx.companyId,
      userId: ctx.userId,
      action: 'LICENSE_ADDED',
      details: `Added license "${license.name}" (${license.type})`,
    },
  });

  return NextResponse.json(license, { status: 201 });
});