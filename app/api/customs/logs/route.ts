import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import type { Prisma, CustomsServiceType, IntegrationLogStatus } from '@prisma/client';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'customs:logs_read');

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '15', 10)));
  const service = searchParams.get('service')?.trim() as CustomsServiceType | undefined;
  const status = searchParams.get('status')?.trim() as IntegrationLogStatus | undefined;
  const skip = (page - 1) * limit;

  const where: Prisma.IntegrationLogWhereInput = {
    companyId: ctx.companyId,
    ...(service ? { service } : {}),
    ...(status ? { status } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.integrationLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        service: true,
        action: true,
        status: true,
        durationMs: true,
        requestSummary: true,
        responseSummary: true,
        errorCode: true,
        errorMessage: true,
        initiatedBy: true,
        createdAt: true,
      },
    }),
    prisma.integrationLog.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});
