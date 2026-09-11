"use client";

import { Upload, Brain, TrendingUp, FileCheck } from "lucide-react";
import { AnimatedSection, StaggerContainer, StaggerItem } from "../components/AnimatedSection";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Describe",
    description: "Upload your product catalog or simply describe the item in plain English.",
  },
  {
    number: "02",
    icon: Brain,
    title: "Classify",
    description: "AI suggests the exact 8-digit HS code with a confidence score and alternatives.",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Optimize",
    description: "Discover applicable DGFT schemes, RoDTEP rates, and optimal FTA routes.",
  },
  {
    number: "04",
    icon: FileCheck,
    title: "Generate",
    description: "Auto-create schema-valid shipping bills, invoices, and packing lists with adapter support.",
  },
];

export function Solution() {
  return (
    <section id="how-it-works" className="py-32 relative bg-white border-t border-border/50">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection className="text-center mb-24">
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-navy-deep leading-tight">
            One Intelligence Layer for <br />
            <span className="text-ocean-deep">Your Entire Export Workflow.</span>
          </h2>
        </AnimatedSection>

        <div className="relative">
          {/* Elegant connecting line */}
          <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-[1px] bg-border/60" />

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
            {steps.map((step, index) => (
              <StaggerItem key={index}>
                <div className="relative flex flex-col items-center text-center group">
                  <div className="relative bg-white z-10 px-4 mb-8">
                    <div className="text-sm font-bold text-ocean-muted tracking-widest uppercase mb-4">
                      Step {step.number}
                    </div>
                    <div className="w-20 h-20 rounded-full bg-editorial-light border border-border flex items-center justify-center group-hover:border-navy-deep group-hover:shadow-lg transition-all duration-500">
                      <step.icon className="w-8 h-8 text-ocean-deep group-hover:text-navy-deep transition-colors duration-500" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-heading font-bold text-navy-deep mb-4">
                    {step.title}
                  </h3>
                  <p className="text-ocean-muted leading-relaxed text-base">
                    {step.description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
}
