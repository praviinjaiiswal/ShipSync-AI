import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { ValidationError, NotFoundError, ConflictError } from '@/lib/errors';

export const POST = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const ctx = await requireTenantContext();
    assertPermission(ctx.role, 'document:create');

    const document = await prisma.document.findFirst({
      where: { id: params.id, companyId: ctx.companyId },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    if (document.finalizedAt) {
      throw new ConflictError('Document is finalized and cannot be modified. Create a new version instead.');
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.extractedData) {
      throw new ValidationError('Verified extractedData object is required.');
    }

    const updated = await prisma.document.update({
      where: { id: document.id },
      data: {
        extractedData: body.extractedData,
        verifiedBy: ctx.userId,
        verifiedAt: new Date(),
        status: 'VERIFIED',
      },
    });

    await prisma.activity.create({
      data: {
        companyId: ctx.companyId,
        userId: ctx.userId,
        shipmentId: document.shipmentId || null,
        action: 'DOCUMENT_VERIFIED',
        details: `Verified canonical extracted fields for ${document.fileName || document.docType}${document.importShipmentId ? ` (Import: ${document.importShipmentId})` : ''}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Document extraction verified and marked as ready for customs pre-flight.',
    });
  }
);
