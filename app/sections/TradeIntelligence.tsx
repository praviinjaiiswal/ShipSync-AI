import React from "react";
import Link from "next/link";
import { ExternalLink, ArrowRight, Bot, ShieldCheck, Globe, Clock, Sparkles } from "lucide-react";
import { prisma } from "@/app/lib/prisma";
import { getCached, setCached, globalCacheKey, CACHE_TTL } from "@/lib/cache";
import { AnimatedSection, StaggerContainer, StaggerItem } from "../components/AnimatedSection";

const CATEGORY_LABELS: Record<string, string> = {
  TARIFF: "Tariff & Customs",
  DGFT_NOTIFICATION: "DGFT Notification",
  FTA: "Trade Agreement (FTA)",
  LOGISTICS: "Logistics & Ports",
  SANCTIONS: "Sanctions & Restrictions",
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

export async function TradeIntelligence() {
  const cacheKey = globalCacheKey("trade:homepage:latest");
  let updates = getCached<any[]>(cacheKey);

  if (!updates) {
    try {
      updates = await prisma.tradeUpdate.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 6,
      });
      setCached(cacheKey, updates, CACHE_TTL.DUTY_CALC); // 5 min TTL
    } catch (err) {
      console.error("Failed to load trade updates for homepage section:", err);
      updates = [];
    }
  }

  const grouped = updates.reduce((acc: Record<string, any[]>, item) => {
    const group = getRecencyGroup(item.publishedAt || item.createdAt);
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  return (
    <section id="trade-intelligence" className="py-28 relative bg-editorial-light/40 border-t border-border/50">
      <div className="max-w-4xl mx-auto px-6">
        {/* Sync AI Persona Briefing Header */}
        <AnimatedSection className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-ocean-muted/20 text-ocean-deep text-xs font-semibold tracking-wider uppercase mb-3 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Bot className="w-3.5 h-3.5 text-ocean-deep" />
              Sync AI • Live Trade Briefing
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-navy-deep leading-tight">
              What changed in Indian trade regulations?
            </h2>
            <p className="mt-2 text-base text-ocean-muted leading-relaxed">
              Sync AI continuously monitors DGFT circulars and statutory tariff updates. Here are verified briefings curated for Indian exporters and importers.
            </p>
          </div>

          <Link
            href="/trade-updates"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-slate-100 text-navy-deep text-xs font-semibold border border-border transition-all duration-200 self-start md:self-auto group shrink-0 shadow-2xs"
          >
            <span>Open Full Briefing Thread</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </AnimatedSection>

        {/* Conversational Briefing Thread */}
        {updates.length === 0 ? (
          <div className="p-10 rounded-3xl bg-white border border-border/70 text-center space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-slate-100 mx-auto flex items-center justify-center text-slate-500">
              <Bot className="w-5 h-5 text-ocean-deep" />
            </div>
            <h3 className="text-base font-bold text-navy-deep">
              Sync AI is scanning DGFT & trade portals...
            </h3>
            <p className="text-ocean-muted text-xs max-w-md mx-auto leading-relaxed">
              Our automated monitors check official gazettes daily. New verified trade briefings will appear in this thread upon editorial review.
            </p>
            <div className="pt-1">
              <Link
                href="/trade-updates"
                className="text-xs font-semibold text-ocean-deep hover:underline inline-flex items-center gap-1"
              >
                Browse briefing archive
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([groupName, items]) => (
              <div key={groupName} className="space-y-5">
                {/* Chat Thread Recency Divider */}
                <div className="flex items-center gap-3">
                  <div className="h-px bg-border/60 flex-1" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-white px-3 py-1 rounded-full border border-border/60 shadow-2xs">
                    {groupName}
                  </span>
                  <div className="h-px bg-border/60 flex-1" />
                </div>

                {/* Chat message bubbles */}
                <div className="space-y-4">
                  {items.map((item, idx) => (
                    <AnimatedSection key={item.id} delay={idx * 0.08}>
                      <div className="flex items-start gap-3 sm:gap-4 group">
                        {/* AI Avatar */}
                        <div className="w-9 h-9 rounded-xl bg-navy-deep text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                          <Bot className="w-4 h-4 text-emerald-400" />
                        </div>

                        {/* Chat Message Bubble */}
                        <div className="flex-1 bg-white border border-border/80 rounded-2xl rounded-tl-xs p-5 sm:p-6 shadow-2xs hover:border-ocean-deep/30 transition-all space-y-3">
                          {/* Sender Row + Timestamp */}
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-navy-deep">Sync AI</span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-editorial-light text-ocean-deep border border-ocean-muted/20">
                                {CATEGORY_LABELS[item.category] || item.category}
                              </span>
                              {item.country && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                                  <Globe className="w-3 h-3" />
                                  {item.country}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                              <Clock className="w-3 h-3" />
                              <span>{formatChatTime(item.publishedAt || item.createdAt)}</span>
                            </div>
                          </div>

                          {/* Headline */}
                          <h3 className="font-heading font-bold text-base sm:text-lg text-navy-deep leading-snug">
                            {item.title}
                          </h3>

                          {/* Plain Language Summary */}
                          <p className="text-ocean-muted text-sm leading-relaxed">
                            {item.summary}
                          </p>

                          {/* Bubble Footer: Verification & Source Link */}
                          <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-slate-500">
                            <span className="flex items-center gap-1 font-medium">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Verified via {item.sourceName}
                            </span>

                            <a
                              href={item.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-ocean-deep hover:text-navy-deep font-semibold inline-flex items-center gap-1 transition-colors"
                              title="Inspect official gazette notification"
                            >
                              <span>Official Notice</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </AnimatedSection>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legal Disclaimer Bar */}
        <AnimatedSection delay={0.2} className="mt-12 pt-6 border-t border-border/40 text-center">
          <p className="text-xs text-slate-400 max-w-2xl mx-auto">
            <span className="font-semibold text-slate-500">Statutory Notice: </span>
            Briefings are AI-assisted, human-verified editorial summaries for business awareness. Verify exact tariff schedules and circulars at the official government portal before filing shipping bills.
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}
