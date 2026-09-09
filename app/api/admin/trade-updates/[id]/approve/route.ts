import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { requireTenantContext } from "@/lib/tenant";
import { assertPermission } from "@/lib/rbac/assert-permission";
import { NotFoundError } from "@/lib/errors";
import { TradeUpdateStatus } from "@prisma/client";

export const POST = withErrorHandler(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    const ctx = await requireTenantContext();
    assertPermission(ctx.role, "tradeupdate:publish");

    const existing = await prisma.tradeUpdate.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      throw new NotFoundError(`Trade update with ID '${params.id}' not found`);
    }

    const published = await prisma.tradeUpdate.update({
      where: { id: params.id },
      data: {
        status: TradeUpdateStatus.PUBLISHED,
        publishedAt: new Date(),
        reviewedByUserId: ctx.userId,
      },
    });

    return NextResponse.json({
      success: true,
      tradeUpdate: published,
      message: "Trade update approved and published live.",
    });
  }
);
