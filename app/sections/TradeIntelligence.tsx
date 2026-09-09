import React from "react";
import Link from "next/link";
import { ExternalLink, ArrowRight, BellRing, ShieldCheck, Globe, Clock, Sparkles } from "lucide-react";
import { prisma } from "@/app/lib/prisma";
import { AnimatedSection, StaggerContainer, StaggerItem } from "../components/AnimatedSection";

const CATEGORY_LABELS: Record<string, string> = {
  TARIFF: "Tariff & Customs",
  DGFT_NOTIFICATION: "DGFT Notification",
  FTA: "Trade Agreement (FTA)",
  LOGISTICS: "Logistics & Ports",
  SANCTIONS: "Sanctions & Restrictions",
  OTHER: "Trade Policy",
};

export async function TradeIntelligence() {
  let updates: any[] = [];

  try {
    updates = await prisma.tradeUpdate.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 6,
    });
  } catch (err) {
    console.error("Failed to load trade updates for homepage section:", err);
  }

  return (
    <section id="trade-intelligence" className="py-32 relative bg-white border-t border-border/50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <AnimatedSection className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-editorial-light border border-ocean-muted/20 text-ocean-deep text-xs font-semibold tracking-wider uppercase mb-4">
              <BellRing className="w-3.5 h-3.5 text-ocean-deep" />
              Live Regulatory Intelligence
            </div>
            <h2 className="font-heading text-4xl sm:text-5xl font-bold text-navy-deep leading-tight">
              Curated Trade Bulletins. <br />
              <span className="text-ocean-deep">Verified at the Source.</span>
            </h2>
            <p className="mt-4 text-lg text-ocean-muted leading-relaxed">
              We monitor DGFT notifications and statutory tariff revisions daily. AI drafts the initial summary, but every bulletin is human-verified before publication.
            </p>
          </div>

          <Link
            href="/trade-updates"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-editorial-light hover:bg-slate-200 text-navy-deep text-sm font-semibold border border-border transition-all duration-300 self-start md:self-auto group shrink-0"
          >
            <span>View All Bulletins</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </AnimatedSection>

        {/* Updates Grid */}
        {updates.length === 0 ? (
          <div className="p-12 rounded-3xl bg-editorial-light border border-border/60 text-center space-y-4">
            <ShieldCheck className="w-12 h-12 mx-auto text-ocean-deep" />
            <h3 className="text-xl font-heading font-bold text-navy-deep">
              Daily Intelligence Pipeline Active
            </h3>
            <p className="text-ocean-muted text-sm max-w-lg mx-auto leading-relaxed">
              Our automated scanners check official DGFT portals daily. New curated notifications will appear here after editorial verification.
            </p>
            <div className="pt-2">
              <Link
                href="/trade-updates"
                className="text-xs font-semibold text-ocean-deep hover:underline inline-flex items-center gap-1"
              >
                Browse archive & source list
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ) : (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {updates.map((item) => (
              <StaggerItem key={item.id} className="h-full">
                <div className="group flex flex-col justify-between p-7 rounded-3xl bg-editorial-light border border-border/60 hover:border-ocean-deep/40 hover:bg-white hover:shadow-xl transition-all duration-300 h-full">
                  <div className="space-y-4">
                    {/* Top Row: Category + Country + Date */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-md font-semibold text-[11px] bg-white border border-border text-ocean-deep shadow-2xs">
                        {CATEGORY_LABELS[item.category] || item.category}
                      </span>

                      <div className="flex items-center gap-2 text-slate-400 text-[11px] font-medium">
                        {item.country && (
                          <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                            <Globe className="w-3 h-3" />
                            {item.country}
                          </span>
                        )}
                        <span>
                          {item.publishedAt
                            ? new Date(item.publishedAt).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                              })
                            : ""}
                        </span>
                      </div>
                    </div>

                    {/* Headline */}
                    <h3 className="font-heading font-bold text-lg text-navy-deep group-hover:text-ocean-deep transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h3>

                    {/* Summary (truncated) */}
                    <p className="text-ocean-muted text-sm leading-relaxed line-clamp-3">
                      {item.summary}
                    </p>
                  </div>

                  {/* Card Bottom: Source Attribution & Link */}
                  <div className="pt-5 mt-5 border-t border-border/50 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Verified via {item.sourceName}
                    </span>

                    <div className="flex items-center gap-3">
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ocean-deep hover:text-navy-deep font-semibold inline-flex items-center gap-1 transition-colors"
                        title="View official government notice"
                      >
                        <span>Official Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        {/* Legal Disclaimer Bar */}
        <AnimatedSection delay={0.2} className="mt-14 pt-6 border-t border-border/40 text-center">
          <p className="text-xs text-slate-500 max-w-2xl mx-auto">
            <span className="font-semibold text-slate-600">Statutory Notice: </span>
            Summaries are condensed editorial briefs for informational awareness only. Never file declarations or calculate export duties based solely on secondary summaries — always inspect the exact gazette or notification text at the official government portal.
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}
