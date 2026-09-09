import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { requireTenantContext } from "@/lib/tenant";
import { assertPermission } from "@/lib/rbac/assert-permission";
import { ValidationError, NotFoundError } from "@/lib/errors";
import { TradeUpdateCategory, TradeUpdateStatus } from "@prisma/client";

const createTradeUpdateSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters"),
  summary: z.string().trim().min(20, "Summary must be at least 20 characters (2-4 sentences)"),
  category: z.nativeEnum(TradeUpdateCategory),
  country: z.string().trim().nullable().optional(),
  sourceName: z.string().trim().min(2, "Source name is required"),
  sourceUrl: z.string().trim().url("Valid official source URL is required"),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, "tradeupdate:review");

  const searchParams = req.nextUrl.searchParams;
  const statusParam = searchParams.get("status") || "PENDING_REVIEW";
  const categoryParam = searchParams.get("category");
  const searchQuery = searchParams.get("search");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (statusParam !== "ALL") {
    if (Object.values(TradeUpdateStatus).includes(statusParam as TradeUpdateStatus)) {
      where.status = statusParam as TradeUpdateStatus;
    } else {
      where.status = TradeUpdateStatus.PENDING_REVIEW;
    }
  }

  if (categoryParam && Object.values(TradeUpdateCategory).includes(categoryParam as TradeUpdateCategory)) {
    where.category = categoryParam as TradeUpdateCategory;
  }

  if (searchQuery) {
    where.OR = [
      { title: { contains: searchQuery, mode: "insensitive" } },
      { summary: { contains: searchQuery, mode: "insensitive" } },
      { sourceName: { contains: searchQuery, mode: "insensitive" } },
      { country: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  const [total, tradeUpdates] = await Promise.all([
    prisma.tradeUpdate.count({ where }),
    prisma.tradeUpdate.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    success: true,
    tradeUpdates,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, "tradeupdate:review");

  const body = await req.json().catch(() => ({}));
  const parsed = createTradeUpdateSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
    );
  }

  const tradeUpdate = await prisma.$transaction(async (tx) => {
    // Record source URL as seen to avoid duplicate AI scraping
    await tx.tradeUpdateSourceSeen.upsert({
      where: { sourceUrl: parsed.data.sourceUrl },
      update: {},
      create: { sourceUrl: parsed.data.sourceUrl },
    });

    return tx.tradeUpdate.create({
      data: {
        title: parsed.data.title,
        summary: parsed.data.summary,
        category: parsed.data.category,
        country: parsed.data.country || null,
        sourceName: parsed.data.sourceName,
        sourceUrl: parsed.data.sourceUrl,
        status: TradeUpdateStatus.PENDING_REVIEW,
        draftedBy: "ADMIN",
      },
    });
  });

  return NextResponse.json(
    {
      success: true,
      tradeUpdate,
      message: "Trade update draft created successfully for admin review.",
    },
    { status: 201 }
  );
});
