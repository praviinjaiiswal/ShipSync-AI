import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { licenseSchema } from '@/lib/validations';
import { ValidationError, NotFoundError } from '@/lib/errors';

export const PATCH = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'license:update');

  const existing = await prisma.license.findFirst({
    where: { id: params.id, companyId: ctx.companyId },
  });

  if (!existing) {
    throw new NotFoundError('License not found');
  }

  const body = await req.json();
  const parsed = licenseSchema.partial().safeParse(body);
  if (!parsed.success) {
    throw new ValidationError('Validation failed for license update', parsed.error.flatten());
  }

  const license = await prisma.license.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      issueDate: parsed.data.issueDate ? new Date(parsed.data.issueDate) : undefined,
      expiryDate: parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : undefined,
    },
  });

  return NextResponse.json(license);
});

export const DELETE = withErrorHandler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'license:delete');

  const existing = await prisma.license.findFirst({
    where: { id: params.id, companyId: ctx.companyId },
  });

  if (!existing) {
    throw new NotFoundError('License not found');
  }

  await prisma.license.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true, message: 'License deleted successfully' });
});