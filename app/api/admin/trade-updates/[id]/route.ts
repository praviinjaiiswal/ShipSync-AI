import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { requireTenantContext } from "@/lib/tenant";
import { assertPermission } from "@/lib/rbac/assert-permission";
import { ValidationError, NotFoundError } from "@/lib/errors";
import { TradeUpdateCategory } from "@prisma/client";

const updateTradeUpdateSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").optional(),
  summary: z.string().trim().min(20, "Summary must be at least 20 characters").optional(),
  category: z.nativeEnum(TradeUpdateCategory).optional(),
  country: z.string().trim().nullable().optional(),
  sourceName: z.string().trim().min(2).optional(),
  sourceUrl: z.string().trim().url("Valid URL required").optional(),
});

export const PATCH = withErrorHandler(
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
    const parsed = updateTradeUpdateSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      );
    }

    const updated = await prisma.tradeUpdate.update({
      where: { id: params.id },
      data: {
        ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
        ...(parsed.data.summary !== undefined ? { summary: parsed.data.summary } : {}),
        ...(parsed.data.category !== undefined ? { category: parsed.data.category } : {}),
        ...(parsed.data.country !== undefined ? { country: parsed.data.country } : {}),
        ...(parsed.data.sourceName !== undefined ? { sourceName: parsed.data.sourceName } : {}),
        ...(parsed.data.sourceUrl !== undefined ? { sourceUrl: parsed.data.sourceUrl } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      tradeUpdate: updated,
      message: "Trade update updated successfully.",
    });
  }
);
