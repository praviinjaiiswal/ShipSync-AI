"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, FileX, Wallet } from "lucide-react";
import { AnimatedSection, StaggerContainer, StaggerItem } from "../components/AnimatedSection";

const problems = [
  {
    icon: AlertTriangle,
    title: "HS Code Confusion",
    description:
      "21,000+ tariff lines. One wrong code = customs penalty + shipment delay. Exporters spend hours guessing or pay CHAs ₹2,000+ per query.",
    stat: "₹2,000+",
    statLabel: "per CHA query",
  },
  {
    icon: FileX,
    title: "Missed DGFT Benefits",
    description:
      "RoDTEP, MEIS, FTA benefits scattered across 50+ weekly notifications. Most exporters claim less than 60% of eligible incentives.",
    stat: "60%",
    statLabel: "benefits unclaimed",
  },
  {
    icon: Wallet,
    title: "Document Chaos",
    description:
      "Commercial invoice, packing list, shipping bill, GR form — 4+ hours per shipment, manual copy-paste across ICEGATE, DGFT, and bank portals.",
    stat: "4+ hrs",
    statLabel: "per shipment",
  },
];

export function Problem() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 animate-pulse">
          <div className="h-10 w-3/4 bg-muted/20 mb-16"></div>
          <div className="space-y-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 w-full bg-muted/10 rounded-xl"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-32 relative bg-white border-t border-border/50">
      <div className="max-w-5xl mx-auto px-6">
        <AnimatedSection className="mb-20 max-w-3xl">
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-navy-deep leading-tight">
            Export Compliance <br />
            <span className="text-ocean-muted">Shouldn't Feel Like Guesswork.</span>
          </h2>
        </AnimatedSection>

        <StaggerContainer className="flex flex-col gap-16">
          {problems.map((problem, index) => (
            <StaggerItem key={index}>
              <div className="group relative flex flex-col md:flex-row gap-8 items-start pb-16 border-b border-border/50 last:border-0 last:pb-0">
                <div className="text-7xl sm:text-8xl font-heading font-bold text-editorial-light tracking-tighter w-32 shrink-0 select-none">
                  0{index + 1}
                </div>
                <div className="flex-1 mt-4 md:mt-0">
                  <h3 className="text-2xl font-heading font-bold text-navy-deep mb-4">
                    {problem.title}
                  </h3>
                  <p className="text-ocean-muted text-lg leading-relaxed max-w-2xl mb-8">
                    {problem.description}
                  </p>
                  <div className="inline-flex items-baseline gap-3 border-l-2 border-ocean-deep pl-4">
                    <span className="text-2xl font-bold text-navy-deep">{problem.stat}</span>
                    <span className="text-sm font-medium text-ocean-muted uppercase tracking-wider">{problem.statLabel}</span>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
