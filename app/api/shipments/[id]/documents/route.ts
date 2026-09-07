import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { rateLimiter, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { uploadFile } from '@/lib/storage';
import { ValidationError, NotFoundError, ExternalServiceError } from '@/lib/errors';
import type { DocType } from '@prisma/client';

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

export const POST = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'document:create');

  // Rate limit file uploads
  await rateLimiter.check(req, `upload:${ctx.userId}`, RATE_LIMIT_PRESETS.UPLOAD);

  const shipment = await prisma.shipment.findFirst({
    where: { id: params.id, companyId: ctx.companyId },
  });

  if (!shipment) {
    throw new NotFoundError('Shipment not found');
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const docType = formData.get('docType') as string | null;

  if (!file || !docType) {
    throw new ValidationError('Both file and docType are required');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError('File size must not exceed 4MB');
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `companies/${ctx.companyId}/shipments/${shipment.id}/${Date.now()}_${cleanFileName}`;
    const fileUrl = await uploadFile(buffer, key, file.type);

    const document = await prisma.document.create({
      data: {
        companyId: ctx.companyId,
        shipmentId: shipment.id,
        docType: docType as DocType,
        fileUrl,
        status: 'UPLOADED',
      },
    });

    await prisma.activity.create({
      data: {
        companyId: ctx.companyId,
        userId: ctx.userId,
        shipmentId: shipment.id,
        action: 'DOCUMENT_UPLOADED',
        details: `Uploaded ${docType.replace(/_/g, ' ')} for shipment ${shipment.buyerName}`,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (err) {
    console.error('Document upload storage failure:', err);
    throw new ExternalServiceError('Failed to store document in secure storage');
  }
});

export const GET = withErrorHandler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'document:read');

  const shipment = await prisma.shipment.findFirst({
    where: { id: params.id, companyId: ctx.companyId },
  });

  if (!shipment) {
    throw new NotFoundError('Shipment not found');
  }

  const documents = await prisma.document.findMany({
    where: { shipmentId: params.id, companyId: ctx.companyId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(documents);
});