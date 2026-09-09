import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { prisma } from "@/app/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { AuthError } from "@/lib/errors";
import { draftTradeUpdate } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";


interface ScrapedItem {
  title: string;
  sourceUrl: string;
  previewText: string;
}

interface SourceConfig {
  name: string;
  listingUrl: string;
  enabled: boolean;
  scrape: () => Promise<ScrapedItem[]>;
  notes?: string;
}

/**
 * Scraper for DGFT public notification listing
 * Uses direct HTML parsing with Cheerio to extract notifications.
 */
async function scrapeDgftNotifications(): Promise<ScrapedItem[]> {
  const url = "https://www.dgft.gov.in/CP/?opt=notification";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      throw new Error(`DGFT responded with status ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const items: ScrapedItem[] = [];

    // DGFT notification listing table rows
    $("table tbody tr, table tr").each((_, row) => {
      const cells = $(row).find("td");
      if (cells.length >= 4) {
        const notifNo = $(cells[1]).text().trim();
        const year = $(cells[2]).text().trim();
        const subject = $(cells[3]).text().trim();
        const date = cells.length >= 5 ? $(cells[4]).text().trim() : "";
        const anchor = $(row).find("a[href]");
        let href = anchor.attr("href")?.trim() || "";

        if (subject && (href || notifNo)) {
          // Normalize source URL
          let fullUrl = href;
          if (href && !href.startsWith("http")) {
            fullUrl = href.startsWith("/")
              ? `https://www.dgft.gov.in${href}`
              : `https://www.dgft.gov.in/CP/${href}`;
          }
          if (!fullUrl) {
            fullUrl = `https://www.dgft.gov.in/CP/?opt=notification#${encodeURIComponent(notifNo || subject.slice(0, 30))}`;
          }

          items.push({
            title: subject,
            sourceUrl: fullUrl,
            previewText: `DGFT Notification No. ${notifNo} (${year}) dated ${date}: ${subject}`,
          });
        }
      }
    });

    return items;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Allowlist of official government notification sources
 */
const SOURCES: SourceConfig[] = [
  {
    name: "DGFT",
    listingUrl: "https://www.dgft.gov.in/CP/?opt=notification",
    enabled: true,
    scrape: scrapeDgftNotifications,
  },
  {
    // TODO: Phase-2 — CBIC Customs Notifications (https://taxinformation.cbic.gov.in / https://www.cbic.gov.in)
    // Investigation confirmed CBIC uses client-side Angular SPA rendering/WAF that cannot be parsed
    // via static Cheerio HTTP fetch. In Phase 2, integrate a headless browser runner or official CBIC RSS/API.
    name: "CBIC",
    listingUrl: "https://www.cbic.gov.in/Customs-Notifications",
    enabled: false,
    scrape: async () => [],
    notes: "Phase-2: Requires headless browser or official RSS feed due to client-side JS rendering",
  },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const GET = withErrorHandler(async (req: NextRequest) => {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    throw new AuthError("Unauthorized cron invocation");
  }

  const results: {
    source: string;
    found: number;
    newDrafted: number;
    skipped: number;
    error?: string;
  }[] = [];

  const MAX_NEW_ITEMS_PER_RUN = 5;
  let totalNewDrafts = 0;

  for (const source of SOURCES) {
    if (!source.enabled) {
      continue;
    }

    let foundCount = 0;
    let draftedCount = 0;
    let skippedCount = 0;

    try {
      const scrapedItems = await source.scrape();
      foundCount = scrapedItems.length;

      for (const item of scrapedItems) {
        if (totalNewDrafts >= MAX_NEW_ITEMS_PER_RUN) {
          break;
        }

        // 1. Deduplication check: Has this sourceUrl been processed before?
        const alreadySeen = await prisma.tradeUpdateSourceSeen.findUnique({
          where: { sourceUrl: item.sourceUrl },
        });

        if (alreadySeen) {
          skippedCount++;
          continue;
        }

        // 2. Rate limit spacing between AI calls
        await sleep(200);

        // 3. Generate AI summary from snippet
        const draft = await draftTradeUpdate({
          title: item.title,
          previewText: item.previewText,
          sourceName: source.name,
        });

        if (draft) {
          // 4. Atomic transaction: create TradeUpdate + mark sourceUrl as seen
          await prisma.$transaction(async (tx) => {
            await tx.tradeUpdate.create({
              data: {
                title: draft.title,
                summary: draft.summary,
                category: draft.category,
                country: draft.country || null,
                sourceName: source.name,
                sourceUrl: item.sourceUrl,
                status: "PENDING_REVIEW",
                draftedBy: "AI",
              },
            });
            await tx.tradeUpdateSourceSeen.upsert({
              where: { sourceUrl: item.sourceUrl },
              update: {},
              create: { sourceUrl: item.sourceUrl },
            });
          });

          draftedCount++;
          totalNewDrafts++;
        } else {
          // If AI could not draft, still record as seen to prevent endless reprocessing
          await prisma.tradeUpdateSourceSeen.upsert({
            where: { sourceUrl: item.sourceUrl },
            update: {},
            create: { sourceUrl: item.sourceUrl },
          });
          skippedCount++;
        }
      }

      results.push({
        source: source.name,
        found: foundCount,
        newDrafted: draftedCount,
        skipped: skippedCount,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`[Trade Intelligence Scan] Error scraping source ${source.name}:`, err);
      results.push({
        source: source.name,
        found: 0,
        newDrafted: 0,
        skipped: 0,
        error: errorMessage,
      });
    }
  }

  return NextResponse.json({
    success: true,
    totalNewDrafts,
    results,
    scannedAt: new Date().toISOString(),
  });
});
