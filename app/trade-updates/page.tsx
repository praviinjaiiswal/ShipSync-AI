import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/app/sections/Navbar";
import { Footer } from "@/app/sections/Footer";
import { prisma } from "@/app/lib/prisma";
import { TradeUpdateCategory } from "@prisma/client";
import {
  ExternalLink,
  ShieldCheck,
  Globe,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  BellRing,
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

  const [totalCount, updates] = await Promise.all([
    prisma.tradeUpdate.count({ where }),
    prisma.tradeUpdate.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-6 space-y-10">
          {/* Header Banner */}
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-editorial-light border border-ocean-muted/20 text-ocean-deep text-xs font-semibold uppercase tracking-wider">
              <BellRing className="w-3.5 h-3.5 text-ocean-deep" />
              Statutory Bulletin Feed
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-navy-deep dark:text-white leading-tight">
              Trade Intelligence & Regulatory Bulletins
            </h1>
            <p className="text-base sm:text-lg text-ocean-muted leading-relaxed">
              Curated, plain-language summaries of DGFT notifications, customs circulars, and FTA updates for Indian exporters and importers. Every bulletin links directly to the official government gazette.
            </p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-b border-border/60 pb-6">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mr-2">
              <Filter className="w-3.5 h-3.5" />
              Filter:
            </div>
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
                      ? "bg-navy-deep text-white shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-border/70 hover:border-slate-400"
                  }`}
                >
                  {cat.label}
                </Link>
              );
            })}
          </div>

          {/* Feed Content */}
          {updates.length === 0 ? (
            <div className="p-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-border/80 space-y-3">
              <ShieldCheck className="w-12 h-12 mx-auto text-slate-400" />
              <h3 className="text-lg font-bold text-navy-deep dark:text-white">
                No bulletins published yet in this category
              </h3>
              <p className="text-sm text-ocean-muted max-w-md mx-auto">
                Our automated monitor scans daily. Check back shortly or view{" "}
                <Link href="/trade-updates" className="text-ocean-deep font-semibold underline">
                  all categories
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {updates.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-border/80 hover:border-ocean-deep/40 hover:shadow-lg transition-all space-y-4"
                >
                  <div className="space-y-3.5">
                    {/* Top Row: Category + Country + Date */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-md font-semibold text-[11px] bg-editorial-light text-ocean-deep border border-ocean-muted/20">
                        {CATEGORY_LABELS[item.category] || item.category}
                      </span>

                      <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                        {item.country && (
                          <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
                            <Globe className="w-3 h-3" />
                            {item.country}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.publishedAt
                            ? new Date(item.publishedAt).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : ""}
                        </span>
                      </div>
                    </div>

                    {/* Headline */}
                    <h2 className="font-heading font-bold text-lg text-navy-deep dark:text-white leading-snug">
                      {item.title}
                    </h2>

                    {/* Summary */}
                    <p className="text-ocean-muted text-sm leading-relaxed">
                      {item.summary}
                    </p>
                  </div>

                  {/* Card Bottom: Source Link */}
                  <div className="pt-4 border-t border-border/50 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Verified via {item.sourceName}
                    </span>

                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ocean-deep dark:text-ocean-light hover:underline font-semibold inline-flex items-center gap-1 transition-colors"
                      title="Read official notification"
                    >
                      <span>Official Notice</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </article>
              ))}
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
              ShipSync AI provides curated, plain-language summaries of public trade notices issued by the Directorate General of Foreign Trade (DGFT), Central Board of Indirect Taxes and Customs (CBIC), and partner ministries. Summaries do not constitute legal advice or official customs interpretations. Traders and customs brokers should always verify exact notification numbers, effective dates, and policy schedules directly at the official government gazette before filing declarations.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
