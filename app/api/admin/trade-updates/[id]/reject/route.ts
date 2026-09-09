import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { requireTenantContext } from "@/lib/tenant";
import { assertPermission } from "@/lib/rbac/assert-permission";
import { ValidationError, NotFoundError } from "@/lib/errors";
import { TradeUpdateStatus } from "@prisma/client";

const rejectSchema = z.object({
  reviewNotes: z
    .string()
    .trim()
    .min(3, "A valid rejection reason (reviewNotes) is required"),
});

export const POST = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const ctx = await requireTenantContext();
    assertPermission(ctx.role, "tradeupdate:review");

    const existing = await prisma.tradeUpdate.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      throw new NotFoundError(`Trade update with ID '${params.id}' not found`);
    }

    const body = await req.json().catch(() => ({}));
    const parsed = rejectSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      );
    }

    const rejected = await prisma.tradeUpdate.update({
      where: { id: params.id },
      data: {
        status: TradeUpdateStatus.REJECTED,
        reviewedByUserId: ctx.userId,
        reviewNotes: parsed.data.reviewNotes,
      },
    });

    return NextResponse.json({
      success: true,
      tradeUpdate: rejected,
      message: "Trade update rejected.",
    });
  }
);
