import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { rateLimiter, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { generateDocument } from '@/lib/ai';
import { validateDocPayload } from '@/lib/documents/document-schemas';
import { renderPdfDocument } from '@/lib/documents/pdf-templates';
import { uploadFile } from '@/lib/storage';
import { ValidationError, NotFoundError, ConflictError, ExternalServiceError } from '@/lib/errors';
import { Prisma } from '@prisma/client';

const DOC_TYPE_TO_ESANCHIT_CODE: Record<string, string> = {
  COMMERCIAL_INVOICE: '010001',
  PACKING_LIST: '010002',
  BILL_OF_LADING: '010003',
  CERTIFICATE_OF_ORIGIN: '010004',
  INSURANCE_CERTIFICATE: '010005',
  TEST_REPORT: '010006',
  SHIPPING_BILL: '010007',
  BILL_OF_ENTRY: '010001',
  LUT: '010007',
  OTHER: '010007',
};

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'document:create');

  await rateLimiter.check(req, `ai:${ctx.userId}`, RATE_LIMIT_PRESETS.AI);

  const body = await req.json();
  const { shipmentId, docType } = body;

  if (!shipmentId || !docType) {
    throw new ValidationError('Both shipmentId and docType are required');
  }

  const shipment = await prisma.shipment.findFirst({
    where: { id: shipmentId, companyId: ctx.companyId },
    include: { shippingBill: true },
  });

  if (!shipment) {
    throw new NotFoundError('Shipment not found in your organization');
  }

  const company = await prisma.company.findUnique({
    where: { id: ctx.companyId },
  });

  if (!company) {
    throw new NotFoundError('Company profile not found');
  }

  // 1. Fetch current latest document for this shipment and docType
  const existingDoc = await prisma.document.findFirst({
    where: {
      shipmentId,
      docType: docType as any,
      isLatest: true,
    },
    orderBy: { version: 'desc' },
  });

  // Calculate target version number
  const nextVersion = existingDoc ? existingDoc.version + 1 : 1;

  // 2. Draft document content via AI with deterministic fallback merging
  const rawAiContent = await generateDocument(docType, {
    shipmentId: shipment.id,
    buyerName: shipment.buyerName,
    buyerCountry: shipment.buyerCountry,
    hsCode: shipment.hsCode,
    productDesc: shipment.productDesc,
    value: shipment.shippingBill?.fobValue ?? shipment.value,
    currency: shipment.currency,
    incoterm: shipment.incoterm,
    invoiceNumber: `INV-${shipment.id.slice(-6).toUpperCase()}`,
  });

  const parsedValidation = validateDocPayload(docType, rawAiContent);
  const validatedPayload = parsedValidation.success
    ? parsedValidation.data
    : {
        ...rawAiContent,
        buyerName: shipment.buyerName,
        buyerCountry: shipment.buyerCountry,
        hsCode: shipment.hsCode,
        currency: shipment.currency,
        totalAmount: shipment.shippingBill?.fobValue ?? shipment.value,
        fobValue: shipment.shippingBill?.fobValue ?? shipment.value,
      };

  // 3. Render real PDF using dedicated template renderer
  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await renderPdfDocument(docType, validatedPayload, {
      name: company.name,
      address: company.address,
      ieCode: company.ieCode,
      gstNumber: company.gstNumber,
      panNumber: company.panNumber,
    });
  } catch (err) {
    console.error('PDF Template rendering error:', err);
    throw new ExternalServiceError('Failed to render statutory PDF template for document.');
  }

  // 4. Upload to tenant-scoped storage
  const storagePath = `companies/${ctx.companyId}/shipments/${shipmentId}/documents/${docType}-v${nextVersion}.pdf`;
  const fileUrl = await uploadFile(Buffer.from(pdfBytes), storagePath, 'application/pdf');

  const docTypeCode = DOC_TYPE_TO_ESANCHIT_CODE[docType] || '010007';
  const fileName = `${docType.toLowerCase()}-v${nextVersion}.pdf`;

  // 5. Concurrency handling via single atomic transaction with conflict trapping
  try {
    const newDocument = await prisma.$transaction(async (tx) => {
      // Mark existing latest record as not latest
      if (existingDoc) {
        await tx.document.update({
          where: { id: existingDoc.id },
          data: { isLatest: false },
        });
      }

      // Create new versioned document record
      const created = await tx.document.create({
        data: {
          companyId: ctx.companyId,
          shipmentId: shipment.id,
          docType: docType as any,
          docTypeCode,
          fileName,
          fileUrl,
          fileSize: pdfBytes.length,
          mimeType: 'application/pdf',
          version: nextVersion,
          isLatest: true,
          supersedesId: existingDoc?.id || null,
          status: 'VERIFIED',
          extractedData: validatedPayload as any,
        },
      });

      await tx.activity.create({
        data: {
          companyId: ctx.companyId,
          userId: ctx.userId,
          shipmentId: shipment.id,
          action: 'DOCUMENT_GENERATED',
          details: `Generated ${docType} (v${nextVersion}) as official PDF for ${shipment.buyerName}`,
        },
      });

      return created;
    });

    return NextResponse.json({
      success: true,
      document: newDocument,
      signedUrl: fileUrl,
      version: nextVersion,
      fileSize: pdfBytes.length,
      mimeType: 'application/pdf',
      message: `Document successfully generated as official PDF (v${nextVersion}).`,
    });
  } catch (err: any) {
    // Gracefully catch unique index violations (e.g. rapid double-clicks on Generate)
    if (
      (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') ||
      err.message?.includes('doc_latest_unique')
    ) {
      throw new ConflictError('Document generation is already in progress for this document type. Please retry.');
    }
    throw err;
  }
});