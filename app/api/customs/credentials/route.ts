import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { customsCredentialSchema } from '@/lib/validations';
import { encryptCustomsData } from '@/lib/crypto/customs-crypto';
import { ValidationError } from '@/lib/errors';

export const GET = withErrorHandler(async () => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'customs:credentials_read');

  const credentials = await prisma.customsCredential.findMany({
    where: { companyId: ctx.companyId },
    select: {
      id: true,
      service: true,
      environment: true,
      icegateId: true,
      iecCode: true,
      portCode: true,
      dscExpiry: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      // NOTE: encryptedData, iv, and authTag are intentionally excluded
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    success: true,
    data: credentials,
  });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'customs:credentials_manage');

  const body = await req.json().catch(() => null);
  if (!body) {
    throw new ValidationError('Request body is required');
  }

  const parsed = customsCredentialSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0]?.message || 'Validation failed', parsed.error.format());
  }

  const {
    service,
    environment,
    icegateId,
    iecCode,
    portCode,
    password,
    dscPin,
    certificateData,
    dscExpiry,
  } = parsed.data;

  // Sensitive payload to encrypt at rest using AES-256-GCM
  const secretsToEncrypt = {
    password: password || undefined,
    dscPin: dscPin || undefined,
    certificateData: certificateData || undefined,
  };

  const encrypted = encryptCustomsData(secretsToEncrypt);

  const credential = await prisma.customsCredential.upsert({
    where: {
      companyId_service_environment: {
        companyId: ctx.companyId,
        service,
        environment,
      },
    },
    update: {
      encryptedData: encrypted.encryptedData,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      icegateId: icegateId || null,
      iecCode: iecCode || null,
      portCode: portCode || null,
      dscExpiry: dscExpiry ? new Date(dscExpiry) : null,
      isActive: true,
    },
    create: {
      companyId: ctx.companyId,
      service,
      environment,
      encryptedData: encrypted.encryptedData,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      icegateId: icegateId || null,
      iecCode: iecCode || null,
      portCode: portCode || null,
      dscExpiry: dscExpiry ? new Date(dscExpiry) : null,
      isActive: true,
    },
    select: {
      id: true,
      service: true,
      environment: true,
      icegateId: true,
      iecCode: true,
      portCode: true,
      dscExpiry: true,
      isActive: true,
      updatedAt: true,
    },
  });

  // Audit activity log
  await prisma.activity.create({
    data: {
      companyId: ctx.companyId,
      userId: ctx.userId,
      action: 'CUSTOMS_CREDENTIALS_UPDATED',
      details: `Configured ${service} credentials for environment ${environment}`,
    },
  });

  return NextResponse.json({
    success: true,
    data: credential,
    message: `${service} (${environment}) credentials successfully encrypted and saved.`,
  });
});
