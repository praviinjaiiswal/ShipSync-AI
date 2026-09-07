import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { rateLimiter, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { NotFoundError } from '@/lib/errors';
import { extractDocumentData } from '@/lib/documents/extraction-engine';

export const POST = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const ctx = await requireTenantContext();
    assertPermission(ctx.role, 'document:create');
    await rateLimiter.check(req, `ocr:${ctx.userId}`, RATE_LIMIT_PRESETS.AI);

    const document = await prisma.document.findFirst({
      where: { id: params.id, companyId: ctx.companyId },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Optional override text passed in body (e.g. from client-side PDF.js worker)
    const body = await req.json().catch(() => ({}));
    const rawTextToParse = body.rawText || document.ocrText || '';

    // Run extraction engine
    const { canonical, rawText } = await extractDocumentData({
      docType: document.docType,
      rawText: rawTextToParse,
      fileName: document.fileName || undefined,
    });

    // Update document with extracted structured data
    const updated = await prisma.document.update({
      where: { id: document.id },
      data: {
        ocrText: rawText || document.ocrText,
        extractedData: canonical.data as any,
        status: 'EXTRACTED',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        documentId: updated.id,
        docType: updated.docType,
        status: updated.status,
        canonicalType: canonical.type,
        extractedData: canonical.data,
      },
      message: `Document extraction complete for ${document.fileName || document.docType}.`,
    });
  }
);
