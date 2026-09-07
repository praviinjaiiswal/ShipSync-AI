import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { esanchitUploadSchema } from '@/lib/validations';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { getCustomsAdapter } from '@/lib/customs/adapter-factory';
import { redactSensitiveData } from '@/lib/crypto/customs-crypto';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'esanchit:upload');

  const body = await req.json().catch(() => null);
  if (!body) {
    throw new ValidationError('Request body is required');
  }

  const parsed = esanchitUploadSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0]?.message || 'Validation failed', parsed.error.format());
  }

  const {
    importShipmentId,
    docTypeCode,
    docName,
    fileName,
    mimeType,
    fileBase64,
    fileSize,
  } = parsed.data;

  const shipment = await prisma.importShipment.findFirst({
    where: { id: importShipmentId, companyId: ctx.companyId },
  });

  if (!shipment) {
    throw new NotFoundError('Import shipment not found');
  }

  const startTime = Date.now();
  const adapter = await getCustomsAdapter(ctx.companyId, 'ESANCHIT');

  try {
    const response = await adapter.uploadSupportingDocument({
      companyId: ctx.companyId,
      importShipmentId,
      docTypeCode,
      docName,
      fileName,
      mimeType,
      fileBuffer: fileBase64,
      fileSize,
    });

    const durationMs = Date.now() - startTime;

    // Create a completed CustomsFilingJob record with IRN
    const job = await prisma.customsFilingJob.create({
      data: {
        companyId: ctx.companyId,
        importShipmentId,
        service: 'ESANCHIT',
        jobType: 'ESANCHIT_UPLOAD',
        status: 'ACKNOWLEDGED',
        irnNumber: response.irnNumber,
        payload: { docTypeCode, docName, fileName, fileSize } as any,
        response: redactSensitiveData(response) as any,
      },
    });

    // Record IntegrationLog
    await prisma.integrationLog.create({
      data: {
        companyId: ctx.companyId,
        service: 'ESANCHIT',
        action: 'DOCUMENT_UPLOAD',
        status: 'SUCCESS',
        durationMs,
        requestSummary: { docTypeCode, fileName, fileSize } as any,
        responseSummary: { irnNumber: response.irnNumber, success: true } as any,
        initiatedBy: ctx.userId,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
        irnNumber: response.irnNumber,
        docTypeCode: response.docTypeCode,
        fileName: response.fileName,
        uploadedAt: response.uploadedAt,
        message: response.message,
      },
    });
  } catch (error: any) {
    const durationMs = Date.now() - startTime;

    await prisma.integrationLog.create({
      data: {
        companyId: ctx.companyId,
        service: 'ESANCHIT',
        action: 'DOCUMENT_UPLOAD',
        status: 'FAILED',
        durationMs,
        requestSummary: { docTypeCode, fileName, fileSize } as any,
        errorCode: 'ESANCHIT_ERROR',
        errorMessage: error.message,
        initiatedBy: ctx.userId,
      },
    });

    throw error;
  }
});
