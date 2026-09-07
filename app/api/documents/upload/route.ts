import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { rateLimiter, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';
import type { DocType } from '@prisma/client';

const uploadDocumentSchema = z.object({
  importShipmentId: z.string().optional(),
  shipmentId: z.string().optional(),
  docType: z.enum([
    'COMMERCIAL_INVOICE',
    'PACKING_LIST',
    'CERTIFICATE_OF_ORIGIN',
    'SHIPPING_BILL',
    'BILL_OF_LADING',
    'BILL_OF_ENTRY',
    'INSURANCE_CERTIFICATE',
    'TEST_REPORT',
    'LUT',
    'OTHER',
  ]),
  docTypeCode: z.string().optional(),
  fileName: z.string().min(1, 'File name is required'),
  fileUrl: z.string().optional(),
  fileSize: z.number().max(5 * 1024 * 1024, 'File size exceeds statutory 5MB limit'),
  mimeType: z.string().default('application/pdf'),
  rawContent: z.string().optional(), // Raw text content if available
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'document:upload');
  await rateLimiter.check(req, `upload:${ctx.userId}`, RATE_LIMIT_PRESETS.UPLOAD);

  const body = await req.json().catch(() => null);
  if (!body) throw new ValidationError('Request body is required');

  const parsed = uploadDocumentSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0]?.message || 'Validation failed', parsed.error.format());
  }

  const {
    importShipmentId,
    shipmentId,
    docType,
    docTypeCode,
    fileName,
    fileUrl,
    fileSize,
    mimeType,
    rawContent,
  } = parsed.data;

  if (!importShipmentId && !shipmentId) {
    throw new ValidationError('Either importShipmentId or shipmentId must be provided.');
  }

  // Verify tenant ownership of parent shipment
  if (importShipmentId) {
    const importShipment = await prisma.importShipment.findFirst({
      where: { id: importShipmentId, companyId: ctx.companyId },
    });
    if (!importShipment) throw new NotFoundError('Import shipment not found');
  }

  if (shipmentId) {
    const exportShipment = await prisma.shipment.findFirst({
      where: { id: shipmentId, companyId: ctx.companyId },
    });
    if (!exportShipment) throw new NotFoundError('Export shipment not found');
  }

  const document = await prisma.document.create({
    data: {
      companyId: ctx.companyId,
      importShipmentId: importShipmentId || null,
      shipmentId: shipmentId || null,
      docType: docType as DocType,
      docTypeCode: docTypeCode || null,
      fileName,
      fileUrl: fileUrl || `https://storage.shipsync.internal/docs/${ctx.companyId}/${Date.now()}_${fileName}`,
      fileSize,
      mimeType,
      ocrText: rawContent || null,
      status: 'PENDING',
    },
  });

  await prisma.activity.create({
    data: {
      companyId: ctx.companyId,
      userId: ctx.userId,
      shipmentId: shipmentId || null,
      action: 'DOCUMENT_UPLOADED',
      details: `Uploaded ${docType} (${fileName}, ${(fileSize / 1024).toFixed(0)} KB)${importShipmentId ? ` (Import: ${importShipmentId})` : ''}`,
    },
  });

  return NextResponse.json({
    success: true,
    data: document,
    message: `${docType} uploaded successfully. Ready for OCR extraction.`,
  });
});
