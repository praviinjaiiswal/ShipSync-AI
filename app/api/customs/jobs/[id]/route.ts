import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { NotFoundError } from '@/lib/errors';

export const GET = withErrorHandler(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    const ctx = await requireTenantContext();
    assertPermission(ctx.role, 'customs:status_check');

    const job = await prisma.customsFilingJob.findFirst({
      where: {
        id: params.id,
        companyId: ctx.companyId,
      },
      include: {
        importShipment: {
          select: {
            id: true,
            status: true,
            importerName: true,
            portOfImport: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundError('Customs filing job not found');
    }

    return NextResponse.json({
      success: true,
      data: {
        id: job.id,
        service: job.service,
        jobType: job.jobType,
        status: job.status,
        filingRefNumber: job.filingRefNumber,
        ackNumber: job.ackNumber,
        irnNumber: job.irnNumber,
        retryCount: job.retryCount,
        maxRetries: job.maxRetries,
        nextRetryAt: job.nextRetryAt,
        lastError: job.lastError,
        response: job.response,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        importShipment: job.importShipment,
      },
    });
  }
);
