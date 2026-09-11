"use client";

import { Brain, FileText, Coins, Route, Search, BarChart3 } from "lucide-react";
import { AnimatedSection, StaggerContainer, StaggerItem } from "../components/AnimatedSection";

const features = [
  {
    icon: Brain,
    title: "AI HS Code Classifier",
    description: "AI-assisted suggestions grounded in official tariff schedules. Always verify classifications before filing.",
    color: "emerald",
  },
  {
    icon: FileText,
    title: "Auto Document Generator",
    description: "Commercial invoices, packing lists, shipping bills — generated using ICEGATE-ready schemas with adapter verification.",
    color: "blue",
  },
  {
    icon: Coins,
    title: "DGFT Benefit Finder",
    description: "Never miss RoDTEP, MEIS, or FTA advantages. Weekly notification parsing keeps you updated.",
    color: "amber",
  },
  {
    icon: Route,
    title: "FTA Route Optimizer",
    description: "Save 5-15% duty via ASEAN, UAE, EU trade agreements. AI suggests the best shipping route.",
    color: "purple",
  },
  {
    icon: Search,
    title: "Document Validator",
    description: "Catch mismatches between invoice, packing list, and B/L before customs flags them.",
    color: "rose",
  },
  {
    icon: BarChart3,
    title: "Compliance Dashboard",
    description: "Track shipments, benefits claimed, pending actions, and compliance health in one view.",
    color: "cyan",
  },
];

export function Features() {
  return (
    <section id="features" className="py-32 relative bg-editorial-light">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection className="mb-20">
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-navy-deep leading-tight">
            Meet Your AI Export <br />
            <span className="text-ocean-deep">Intelligence Layer.</span>
          </h2>
        </AnimatedSection>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-min">
          {features.map((feature, index) => {
            // Asymmetric layout: Make 1st and 6th feature span 2 columns on desktop
            const isWide = index === 0 || index === 5;
            
            return (
              <StaggerItem key={index} className={isWide ? "md:col-span-2" : "col-span-1"}>
                <div className="group flex flex-col justify-between p-8 sm:p-10 rounded-3xl bg-white border border-border/60 hover:shadow-xl transition-all duration-500 h-full overflow-hidden relative">
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-editorial-light border border-ocean-muted/20 flex items-center justify-center mb-8 group-hover:scale-105 group-hover:bg-navy-deep transition-all duration-500">
                      <feature.icon className="w-6 h-6 text-ocean-deep group-hover:text-white transition-colors duration-500" />
                    </div>
                    <h3 className={`${isWide ? 'text-3xl' : 'text-2xl'} font-heading font-bold text-navy-deep mb-4`}>
                      {feature.title}
                    </h3>
                    <p className="text-ocean-muted text-base leading-relaxed max-w-md">
                      {feature.description}
                    </p>
                  </div>
                  
                  {/* Subtle decorative background element */}
                  <div className="absolute -bottom-10 -right-10 opacity-0 group-hover:opacity-5 transform translate-y-10 group-hover:translate-y-0 transition-all duration-700 pointer-events-none">
                    <feature.icon className="w-64 h-64 text-navy-deep" />
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
