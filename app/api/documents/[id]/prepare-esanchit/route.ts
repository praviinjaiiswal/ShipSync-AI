import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { rateLimiter, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { validateForEsanchit } from '@/lib/documents/esanchit-validator';

export const POST = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const ctx = await requireTenantContext();
    assertPermission(ctx.role, 'document:create');
    await rateLimiter.check(req, `esanchit:${ctx.userId}`, RATE_LIMIT_PRESETS.UPLOAD);

    const document = await prisma.document.findFirst({
      where: { id: params.id, companyId: ctx.companyId },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    if (!document.docTypeCode) {
      throw new ValidationError('Document must have an assigned e-Sanchit Document Type Code.');
    }

    // Run pre-flight statutory validation
    const validation = validateForEsanchit({
      docTypeCode: document.docTypeCode,
      fileName: document.fileName || 'document.pdf',
      fileSize: document.fileSize || 1024,
      mimeType: document.mimeType || 'application/pdf',
    });

    if (!validation.ready) {
      return NextResponse.json(
        {
          success: false,
          data: validation,
          message: `e-Sanchit pre-flight validation failed: ${validation.errors.join(' ')}`,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.document.update({
      where: { id: document.id },
      data: { status: 'ESANCHIT_READY' },
    });

    return NextResponse.json({
      success: true,
      data: {
        document: updated,
        validation,
      },
      message: `${validation.docTypeName} successfully verified and marked ESANCHIT_READY.`,
    });
  }
);
