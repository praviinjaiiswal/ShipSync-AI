import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { getCustomsAdapter } from '@/lib/customs/adapter-factory';
import { runComplianceRules } from '@/lib/compliance/rule-engine';

export const POST = withErrorHandler(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    const ctx = await requireTenantContext();
    assertPermission(ctx.role, 'esanchit:upload');

    const document = await prisma.document.findFirst({
      where: { id: params.id, companyId: ctx.companyId },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    if (!document.docTypeCode) {
      throw new ValidationError('Document must have an assigned e-Sanchit Document Type Code.');
    }

    if (!['VERIFIED', 'ESANCHIT_READY'].includes(document.status)) {
      throw new ValidationError(`Document must be VERIFIED or ESANCHIT_READY before transmitting. Current: ${document.status}`);
    }

    // Statutory Compliance Gate: Parent export shipment must pass statutory compliance rules before customs transmission
    if (document.shipmentId) {
      const shipment = await prisma.shipment.findUnique({
        where: { id: document.shipmentId },
      });
      const company = await prisma.company.findUnique({
        where: { id: ctx.companyId },
      });
      if (shipment && company) {
        const complianceResult = await runComplianceRules(shipment, company);
        if (!complianceResult.passed) {
          const failures = complianceResult.failedRules.map((r) => r.message).join('; ');
          throw new ValidationError(
            `Cannot transmit document for filing: Parent export shipment fails statutory compliance rules: ${failures}`
          );
        }
      }
    }

    const adapter = await getCustomsAdapter(ctx.companyId, 'ESANCHIT');

    const uploadResponse = await adapter.uploadSupportingDocument({
      companyId: ctx.companyId,
      importShipmentId: document.importShipmentId || 'general',
      docTypeCode: document.docTypeCode,
      docName: document.fileName || document.docType,
      fileName: document.fileName || 'document.pdf',
      fileBuffer: 'JVBERi0xLjQKJeLjz9MK...', // Mock buffer / payload
      mimeType: document.mimeType || 'application/pdf',
      fileSize: document.fileSize || 1024,
    });

    const updated = await prisma.document.update({
      where: { id: document.id },
      data: {
        irnNumber: uploadResponse.irnNumber,
        status: 'ESANCHIT_UPLOADED',
        finalizedAt: new Date(),
      },
    });

    await prisma.activity.create({
      data: {
        companyId: ctx.companyId,
        userId: ctx.userId,
        shipmentId: document.shipmentId || null,
        action: 'ESANCHIT_TRANSMITTED',
        details: `Generated IRN ${uploadResponse.irnNumber} for ${document.fileName || document.docType}${document.importShipmentId ? ` (Import: ${document.importShipmentId})` : ''}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        document: updated,
        irnNumber: uploadResponse.irnNumber,
        uploadedAt: uploadResponse.uploadedAt,
      },
      message: `Document transmitted to e-Sanchit successfully. IRN: ${uploadResponse.irnNumber}`,
    });
  }
);
