import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { rateLimiter, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { NotFoundError } from '@/lib/errors';

export const GET = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: { id: string; docType: string } }
  ) => {
    const ctx = await requireTenantContext();
    assertPermission(ctx.role, 'document:read');
    await rateLimiter.check(req, `doc-history:${ctx.userId}`, RATE_LIMIT_PRESETS.SEARCH);

    const shipmentId = params.id;
    const { docType } = params;

    // Verify shipment belongs to tenant
    const shipment = await prisma.shipment.findFirst({
      where: { id: shipmentId, companyId: ctx.companyId },
    });

    if (!shipment) {
      throw new NotFoundError('Shipment not found in your organization');
    }

    // Fetch full version chain from oldest to newest
    const history = await prisma.document.findMany({
      where: {
        shipmentId,
        docType: docType as any,
        companyId: ctx.companyId,
      },
      orderBy: { version: 'asc' },
      select: {
        id: true,
        docType: true,
        docTypeCode: true,
        fileName: true,
        fileUrl: true,
        fileSize: true,
        mimeType: true,
        version: true,
        isLatest: true,
        supersedesId: true,
        status: true,
        finalizedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      shipmentId,
      docType,
      totalVersions: history.length,
      history,
    });
  }
);
