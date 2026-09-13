import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { getCached, setCached, globalCacheKey } from "@/lib/cache";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const categoryParam = searchParams.get("category") || "ALL";
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "40", 10)));

  const cacheKey = globalCacheKey(`trade-feed:live:${categoryParam}:${limit}`);
  const cached = getCached<any>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  let dbUpdates: any[] = [];
  try {
    dbUpdates = await prisma.tradeUpdate.findMany({
      where: {
        status: "PUBLISHED",
      },
      orderBy: [
        { publishedAt: "desc" },
        { createdAt: "desc" },
      ],
      take: 60,
    });
  } catch (err) {
    console.error("Failed to query TradeUpdate table for live feed:", err);
    dbUpdates = [];
  }

  // If no published updates exist in the database, return an explicit empty state
  if (dbUpdates.length === 0) {
    const emptyResult = {
      ticker: [],
      updates: [],
      meta: {
        total: 0,
        unfilteredTotal: 0,
        isEmpty: true,
        timestamp: new Date().toISOString(),
        activeFilter: categoryParam,
      },
    };

    // Cache briefly (15 seconds) so that freshly published records appear promptly
    setCached(cacheKey, emptyResult, 15 * 1000);
    return NextResponse.json(emptyResult);
  }

  // Ticker items: Top 8 most recent genuine updates for the breaking marquee
  const tickerItems = dbUpdates.slice(0, 8).map((u) => ({
    id: u.id,
    title: u.title,
    sourceName: u.sourceName,
    publishedAt: u.publishedAt || u.createdAt,
    category: u.category,
    sourceUrl: u.sourceUrl,
  }));

  // Filter items if a specific topic category is selected
  let filtered = dbUpdates;
  const catUpper = categoryParam.toUpperCase();

  if (catUpper !== "ALL") {
    if (catUpper === "RODTEP") {
      filtered = dbUpdates.filter(
        (u) =>
          u.title.toLowerCase().includes("rodtep") ||
          u.summary.toLowerCase().includes("rodtep") ||
          u.category === "DGFT_NOTIFICATION"
      );
    } else if (catUpper === "DUTY") {
      filtered = dbUpdates.filter(
        (u) =>
          u.category === "TARIFF" ||
          u.title.toLowerCase().includes("duty") ||
          u.title.toLowerCase().includes("tariff") ||
          u.summary.toLowerCase().includes("duty")
      );
    } else if (catUpper === "FTA") {
      filtered = dbUpdates.filter(
        (u) =>
          u.category === "FTA" ||
          u.title.toLowerCase().includes("fta") ||
          u.title.toLowerCase().includes("agreement") ||
          u.title.toLowerCase().includes("cepa")
      );
    } else if (catUpper === "SANCTIONS") {
      filtered = dbUpdates.filter(
        (u) =>
          u.category === "SANCTIONS" ||
          u.title.toLowerCase().includes("sanction") ||
          u.title.toLowerCase().includes("scomet") ||
          u.title.toLowerCase().includes("restriction")
      );
    } else if (catUpper === "IMPORT") {
      filtered = dbUpdates.filter(
        (u) =>
          u.title.toLowerCase().includes("import") ||
          u.summary.toLowerCase().includes("import") ||
          u.category === "LOGISTICS" ||
          u.category === "TARIFF"
      );
    } else if (catUpper === "EXPORT") {
      filtered = dbUpdates.filter(
        (u) =>
          u.title.toLowerCase().includes("export") ||
          u.summary.toLowerCase().includes("export") ||
          u.category === "DGFT_NOTIFICATION"
      );
    } else {
      filtered = dbUpdates.filter((u) => u.category === catUpper);
    }
  }

  const result = {
    ticker: tickerItems,
    updates: filtered.slice(0, limit),
    meta: {
      total: filtered.length,
      unfilteredTotal: dbUpdates.length,
      isEmpty: false,
      timestamp: new Date().toISOString(),
      activeFilter: categoryParam,
    },
  };

  // Cache for 60 seconds
  setCached(cacheKey, result, 60 * 1000);

  return NextResponse.json(result);
});
