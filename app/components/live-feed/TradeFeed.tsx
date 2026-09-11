"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  Radio,
  Search,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Globe,
  Clock,
  ChevronDown,
  ChevronUp,
  Bot,
  Filter,
  Layers,
  LayoutGrid,
  List,
  Sparkles,
  ArrowRight,
  Share2,
  Check,
} from "lucide-react";
import { NewsTicker, TickerItem } from "./NewsTicker";

export interface TradeFeedItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  country?: string | null;
  sourceName: string;
  sourceUrl: string;
  status: string;
  publishedAt: string;
  createdAt: string;
}

interface FeedApiResponse {
  ticker: TickerItem[];
  updates: TradeFeedItem[];
  meta: {
    total: number;
    unfilteredTotal: number;
    timestamp: string;
    activeFilter: string;
  };
}

const TOPIC_TABS = [
  { id: "ALL", label: "All Updates", icon: "🌐" },
  { id: "RODTEP", label: "RoDTEP", icon: "⚡" },
  { id: "DUTY", label: "Duty & Tariff", icon: "🏷️" },
  { id: "FTA", label: "Trade Agreements (FTA)", icon: "🤝" },
  { id: "SANCTIONS", label: "Sanctions & SCOMET", icon: "🛡️" },
  { id: "IMPORT", label: "Import Policy", icon: "📦" },
  { id: "EXPORT", label: "Export Policy", icon: "🚢" },
];

const CATEGORY_BADGES: Record<string, { label: string; color: string }> = {
  TARIFF: { label: "Customs Tariff", color: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60" },
  DGFT_NOTIFICATION: { label: "DGFT Circular", color: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60" },
  FTA: { label: "FTA Concession", color: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60" },
  LOGISTICS: { label: "Port & Customs", color: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60" },
  SANCTIONS: { label: "Sanctions & SCOMET", color: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60" },
  OTHER: { label: "Trade Policy", color: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700" },
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function formatRelative(dateStr: string): string {
  if (!dateStr) return "Recent";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - d.getTime()) / (1000 * 60));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export function TradeFeed() {
  const [selectedTopic, setSelectedTopic] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto-refresh every 2 minutes (120,000 ms)
  const { data, error, isLoading, isValidating, mutate } = useSWR<FeedApiResponse>(
    `/api/trade-updates/feed?category=${selectedTopic}`,
    fetcher,
    {
      refreshInterval: 120000,
      revalidateOnFocus: true,
      dedupingInterval: 30000,
    }
  );

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyLink = (item: TradeFeedItem) => {
    navigator.clipboard.writeText(item.sourceUrl);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredUpdates = useMemo(() => {
    if (!data?.updates) return [];
    if (!searchQuery.trim()) return data.updates;

    const query = searchQuery.toLowerCase().trim();
    return data.updates.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.summary.toLowerCase().includes(query) ||
        item.sourceName.toLowerCase().includes(query) ||
        (item.country && item.country.toLowerCase().includes(query))
    );
  }, [data?.updates, searchQuery]);

  return (
    <div className="w-full flex flex-col">
      {/* 1. Breaking News Ticker Strip at the very top */}
      <NewsTicker
        items={data?.ticker || []}
        isLoading={isLoading}
        onSelectHeadline={(headline) => {
          setExpandedItems((prev) => ({ ...prev, [headline.id]: true }));
          const el = document.getElementById(`update-${headline.id}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }}
      />

      {/* 2. Main Live News Channel Header & Controls */}
      <div className="w-full bg-editorial-light/40 dark:bg-slate-950/40 border-b border-border/60 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Header Row: Live Desk Title + Realtime Status Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-border text-navy-deep dark:text-white text-xs font-semibold tracking-wider uppercase mb-2 shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Live Intelligence Feed</span>
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-navy-deep dark:text-white tracking-tight">
                Indian Trade & Customs Regulatory Gazette
              </h1>
              <p className="text-xs sm:text-sm text-ocean-muted mt-1 max-w-2xl">
                Continuous automated monitoring of official DGFT notifications, SCOMET revisions, and bilateral trade notices (DGFT active; CBIC integration in progress).
              </p>
            </div>

            {/* Sync Status & Manual Refresh */}
            <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-border px-3 py-1.5 rounded-full shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-medium">
                  {isValidating ? "Syncing gazette..." : "Connected • Auto-refreshes"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => mutate()}
                disabled={isValidating}
                className="p-2 rounded-full bg-white dark:bg-slate-900 border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                title="Refresh live feed immediately"
                aria-label="Refresh feed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? "animate-spin text-ocean-deep" : ""}`} />
              </button>
            </div>
          </div>

          {/* Search bar & View Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search circulars by keyword, commodity, HS Chapter, or notice number (e.g. 'RoDTEP', 'rice', 'steel', 'semiconductor')..."
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-border focus:border-ocean-deep focus:ring-2 focus:ring-ocean-deep/15 outline-none transition-all placeholder:text-slate-400 text-slate-800 dark:text-slate-100 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>

            {/* View Mode Toggle: Grid vs List */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-border p-1 rounded-xl shadow-2xs self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-medium transition-colors ${
                  viewMode === "grid"
                    ? "bg-navy-deep text-white"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                title="Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-medium transition-colors ${
                  viewMode === "list"
                    ? "bg-navy-deep text-white"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                title="Compact list view"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden md:inline">List</span>
              </button>
            </div>
          </div>

          {/* Topic Tabs / Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
              Channels:
            </span>
            {TOPIC_TABS.map((tab) => {
              const isActive = selectedTopic === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedTopic(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? "bg-navy-deep text-white shadow-xs scale-100"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-border hover:border-ocean-deep/50 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Live News Feed Cards Grid / List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Shimmer Skeleton Loading State */}
        {isLoading ? (
          <div className={`grid gap-5 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-border shadow-2xs space-y-4 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                  <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded-md"></div>
                </div>
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-4/5"></div>
                <div className="space-y-2">
                  <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-md w-full"></div>
                  <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-md w-3/4"></div>
                </div>
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded-md"></div>
                  <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredUpdates.length === 0 ? (
          /* Empty Search State */
          <div className="py-16 text-center max-w-md mx-auto space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-border p-8 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-lg font-bold text-navy-deep dark:text-white">
              No matching circulars found
            </h3>
            <p className="text-xs text-ocean-muted">
              {searchQuery
                ? `No published updates matched "${searchQuery}". Try a different search term or clear the filter.`
                : "No verified updates in this channel yet. New circulars are indexed as DGFT publishes official notifications."}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-2 text-xs font-semibold text-ocean-deep hover:underline"
              >
                Clear search filter
              </button>
            )}
          </div>
        ) : (
          /* Real Data Card Stream */
          <div
            className={`grid gap-5 ${
              viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            }`}
          >
            {filteredUpdates.map((item) => {
              const isExpanded = !!expandedItems[item.id];
              const badge = CATEGORY_BADGES[item.category] || CATEGORY_BADGES.OTHER;

              return (
                <article
                  key={item.id}
                  id={`update-${item.id}`}
                  className={`relative flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 border border-border/90 hover:border-ocean-deep/50 transition-all duration-200 shadow-2xs hover:shadow-md ${
                    viewMode === "list" ? "p-5 sm:p-6" : "p-5"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Metadata Row: Source & Category & Relative Time */}
                    <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wide bg-navy-deep text-white shadow-2xs">
                          {item.sourceName}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${badge.color}`}
                        >
                          {badge.label}
                        </span>

                        {item.country && item.country !== "Global" && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                            <Globe className="w-3 h-3 text-slate-400" />
                            {item.country}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatRelative(item.publishedAt || item.createdAt)}</span>
                      </div>
                    </div>

                    {/* Headline */}
                    <h2 className="font-heading text-base font-bold text-navy-deep dark:text-white leading-snug tracking-tight hover:text-ocean-deep dark:hover:text-ocean-light transition-colors">
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-start gap-1"
                      >
                        <span>{item.title}</span>
                      </a>
                    </h2>

                    {/* AI-Generated Statutory Summary Briefing */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ocean-deep dark:text-emerald-400">
                        <Bot className="w-3.5 h-3.5" />
                        <span>Sync AI Briefing</span>
                      </div>
                      <p
                        className={`text-xs text-slate-700 dark:text-slate-200 leading-relaxed ${
                          isExpanded ? "" : "line-clamp-3"
                        }`}
                      >
                        {item.summary}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer: Action Links & Gazette Verification */}
                  <div className="mt-4 pt-3.5 border-t border-border/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {/* Expand / Collapse Button */}
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.id)}
                        className="inline-flex items-center gap-1 text-slate-500 hover:text-navy-deep dark:hover:text-white font-semibold transition-colors cursor-pointer"
                      >
                        <span>{isExpanded ? "Collapse" : "Read Briefing"}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Quick copy link */}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(item)}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        title="Copy official gazette link"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Share2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Official Gazette Link */}
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-navy-deep dark:text-white font-semibold text-[11px] transition-colors"
                      title="Inspect official notification at source"
                    >
                      <span>Official Notice</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Bottom Banner: Ask Sync AI Assistant Integration */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-navy-deep via-ocean-deep to-navy-deep text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>Interactive Regulatory Query</span>
            </div>
            <h3 className="font-heading text-xl sm:text-2xl font-bold tracking-tight">
              Need clarification on a specific circular or RoDTEP tariff?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Ask Sync AI our conversational trade assistant. Grounded strictly in official DGFT published briefings.
            </p>
          </div>

          <Link
            href="/trade-updates"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-navy-deep font-bold text-xs hover:bg-slate-100 transition-all shadow-md group shrink-0"
          >
            <span>Open Conversational Assistant</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Editorial Disclaimer Footer */}
        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-xs text-slate-400 max-w-2xl mx-auto leading-relaxed">
            <span className="font-semibold text-slate-500">Statutory Notice: </span>
            ShipSync AI provides advisory assistance, not statutory or legal advice. Always verify HS codes, duty calculations, and compliance requirements with a licensed Customs House Agent (CHA) or relevant authority before filing.
          </p>
        </div>
      </div>
    </div>
  );
}
