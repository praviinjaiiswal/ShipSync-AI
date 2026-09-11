import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/app/sections/Navbar";
import { Footer } from "@/app/sections/Footer";
import { prisma } from "@/app/lib/prisma";
import { TradeUpdateCategory } from "@prisma/client";
import { getCached, setCached, globalCacheKey, CACHE_TTL } from "@/lib/cache";
import { TradeBriefingItem } from "@/app/components/TradeBriefingItem";
import { AskSyncAIChat } from "./AskSyncAIChat";
import {
  ExternalLink,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Bot,
  MessageSquareQuote,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Trade Intelligence & DGFT Notifications | ShipSync AI",
  description:
    "Curated, verified summaries of Indian export-import notifications, tariff changes, RoDTEP updates, and trade agreements. Verified at official government sources.",
  openGraph: {
    title: "Trade Intelligence & DGFT Notifications | ShipSync AI",
    description:
      "Curated, verified summaries of Indian export-import notifications, tariff changes, and trade agreements.",
    url: "https://shipsync.ai/trade-updates",
    siteName: "ShipSync AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trade Intelligence & DGFT Notifications | ShipSync AI",
    description: "Curated, verified summaries of Indian export-import notifications and tariff revisions.",
  },
};

const CATEGORIES = [
  { value: "ALL", label: "All Updates" },
  { value: "TARIFF", label: "Tariff & Customs" },
  { value: "DGFT_NOTIFICATION", label: "DGFT Notifications" },
  { value: "FTA", label: "Trade Agreements (FTA)" },
  { value: "LOGISTICS", label: "Logistics & Ports" },
  { value: "SANCTIONS", label: "Sanctions & Denied Entities" },
  { value: "OTHER", label: "Policy & Other" },
];

const CATEGORY_LABELS: Record<string, string> = {
  TARIFF: "Tariff & Customs",
  DGFT_NOTIFICATION: "DGFT Notification",
  FTA: "Trade Agreement (FTA)",
  LOGISTICS: "Logistics & Ports",
  SANCTIONS: "Sanctions & Denied Entities",
  OTHER: "Trade Policy",
};

function formatChatTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);

  if (diffHours < 24 && d.getDate() === now.getDate()) {
    return `Today, ${d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth()) {
    return `Yesterday, ${d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}`;
  }
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function getRecencyGroup(dateStr: string | Date | null | undefined): "Today" | "This Week" | "Earlier" {
  if (!dateStr) return "Earlier";
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 1 && d.getDate() === now.getDate()) return "Today";
  if (diffDays <= 7) return "This Week";
  return "Earlier";
}

interface PageProps {
  searchParams?: {
    category?: string;
    page?: string;
  };
}

export default async function TradeUpdatesPage({ searchParams }: PageProps) {
  const currentCategory = searchParams?.category || "ALL";
  const currentPage = Math.max(1, parseInt(searchParams?.page || "1", 10));
  const pageSize = 9;
  const skip = (currentPage - 1) * pageSize;

  const where: any = {
    status: "PUBLISHED",
  };

  if (
    currentCategory !== "ALL" &&
    Object.values(TradeUpdateCategory).includes(currentCategory as TradeUpdateCategory)
  ) {
    where.category = currentCategory as TradeUpdateCategory;
  }

  const cacheKey = globalCacheKey(`trade:feed:${currentCategory}:${currentPage}`);
  let cachedData = getCached<{ totalCount: number; updates: any[] }>(cacheKey);

  let totalCount = 0;
  let updates: any[] = [];

  if (cachedData) {
    totalCount = cachedData.totalCount;
    updates = cachedData.updates;
  } else {
    const [countResult, updatesResult] = await Promise.all([
      prisma.tradeUpdate.count({ where }),
      prisma.tradeUpdate.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);
    totalCount = countResult;
    updates = updatesResult;
    setCached(cacheKey, { totalCount, updates }, CACHE_TTL.DUTY_CALC);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  const grouped = updates.reduce((acc: Record<string, any[]>, item) => {
    const group = getRecencyGroup(item.publishedAt || item.createdAt);
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});
  const recencyOrder: Array<"Today" | "This Week" | "Earlier"> = ["Today", "This Week", "Earlier"];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-6 space-y-10">
          {/* Header Banner with Sync AI Persona */}
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-ocean-muted/20 text-ocean-deep text-xs font-semibold uppercase tracking-wider shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Bot className="w-3.5 h-3.5 text-ocean-deep" />
              Sync AI • Conversational Trade Intelligence
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-navy-deep dark:text-white leading-tight">
              Regulatory Briefings & Trade Policy
            </h1>
            <p className="text-base sm:text-lg text-ocean-muted leading-relaxed">
              Real-time intelligence from official DGFT notifications and trade policy updates (currently sourcing from DGFT only). Summarized by Sync AI with direct attribution to the official government gazette.
            </p>
          </div>

          {/* Conversational Ask Sync AI Chatbot */}
          <AskSyncAIChat />

          {/* Quick-reply Suggestion Chips */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
              <MessageSquareQuote className="w-3.5 h-3.5 text-ocean-deep" />
              <span>Suggested topics:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {CATEGORIES.map((cat) => {
                const isActive = currentCategory === cat.value;
                const href =
                  cat.value === "ALL"
                    ? "/trade-updates"
                    : `/trade-updates?category=${cat.value}`;

                return (
                  <Link
                    key={cat.value}
                    href={href}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-navy-deep text-white shadow-xs"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-border/80 hover:border-ocean-deep/40"
                    }`}
                  >
                    {cat.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Feed Content: Conversational Chat Bubbles Grouped by Recency */}
          {updates.length === 0 ? (
            <div className="flex items-start gap-4 p-8 rounded-2xl bg-white dark:bg-slate-900 border border-border/80 shadow-2xs">
              <div className="w-10 h-10 rounded-2xl bg-navy-deep text-white flex items-center justify-center shrink-0 ring-4 ring-slate-100 dark:ring-slate-800">
                <Bot className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-navy-deep dark:text-white">Sync AI</span>
                  <span className="text-[11px] text-slate-400">Just now</span>
                </div>
                <p className="text-sm text-ocean-muted leading-relaxed">
                  I haven't detected any published statutory bulletins in this category yet. Our automated monitor scans government portals continuously. You can check back shortly or browse{" "}
                  <Link href="/trade-updates" className="text-ocean-deep font-semibold underline">
                    all categories
                  </Link>
                  .
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-9">
              {recencyOrder.map((groupKey) => {
                const items = grouped[groupKey];
                if (!items || items.length === 0) return null;

                return (
                  <div key={groupKey} className="space-y-4">
                    {/* Recency Date Badge Divider */}
                    <div className="flex items-center gap-3">
                      <div className="h-px bg-border/70 flex-1" />
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-editorial-light dark:bg-slate-800 text-ocean-deep border border-ocean-muted/20">
                        {groupKey}
                      </span>
                      <div className="h-px bg-border/70 flex-1" />
                    </div>

                    {/* Conversational Briefing Items */}
                    <div className="space-y-4">
                      {items.map((item) => (
                        <TradeBriefingItem
                          key={item.id}
                          item={item}
                          categoryLabel={CATEGORY_LABELS[item.category] || item.category}
                          formattedTime={formatChatTime(item.publishedAt || item.createdAt)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-8 border-t border-border/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                Showing {skip + 1} to {Math.min(skip + pageSize, totalCount)} of {totalCount} bulletins
              </span>

              <div className="flex items-center gap-2">
                {currentPage > 1 ? (
                  <Link
                    href={`/trade-updates?page=${currentPage - 1}${
                      currentCategory !== "ALL" ? `&category=${currentCategory}` : ""
                    }`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-medium"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Previous
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/40 text-slate-300 dark:text-slate-700 font-medium cursor-not-allowed">
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Previous
                  </span>
                )}

                <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                  Page {currentPage} of {totalPages}
                </span>

                {currentPage < totalPages ? (
                  <Link
                    href={`/trade-updates?page=${currentPage + 1}${
                      currentCategory !== "ALL" ? `&category=${currentCategory}` : ""
                    }`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-medium"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/40 text-slate-300 dark:text-slate-700 font-medium cursor-not-allowed">
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Legal Notice */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-border/60 text-xs text-slate-500 space-y-1.5">
            <h4 className="font-semibold text-slate-700 dark:text-slate-300">
              Disclaimer & Source Attribution
            </h4>
            <p className="leading-relaxed">
              ShipSync AI provides advisory assistance, not statutory or legal advice. Always verify HS codes, duty calculations, and compliance requirements with a licensed Customs House Agent (CHA) or relevant authority before filing. Trade intelligence currently sources from DGFT only; CBIC data integration is planned for a future phase. Traders and customs brokers should always verify exact notification numbers, effective dates, and policy schedules directly at the official government gazette before filing declarations.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
