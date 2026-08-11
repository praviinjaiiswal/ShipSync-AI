"use client";

import { useState, useEffect } from "react";
import { AnimatedSection } from "../components/AnimatedSection";
import { CountUp } from "../components/CountUp";

const stats = [
  { value: 21000, suffix: "+", label: "Tariff Lines Mastered" },
  { value: 50000, suffix: "+", label: "Export Docs Processed Monthly" },
  { value: 15, suffix: "%", label: "India's Trade Software Growth", isDecimal: true },
  { value: 5, suffix: "L+", prefix: "₹", label: "Avg Annual Savings Per Exporter" },
];

export function Stats() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <section className="py-24 bg-editorial-light">
        <div className="max-w-7xl mx-auto px-6 animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 w-full bg-muted/10 rounded-lg"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-28 relative bg-editorial-light border-y border-border/50">
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-16 gap-x-8">
          {stats.map((stat, index) => (
            <AnimatedSection key={index} delay={index * 0.1} className="text-center flex flex-col items-center">
              <div className="text-5xl sm:text-6xl lg:text-7xl font-heading font-bold text-navy-deep tracking-tight mb-4">
                {stat.prefix}
                {stat.isDecimal ? (
                  <span>{stat.value}{stat.suffix}</span>
                ) : (
                  <CountUp end={stat.value} suffix={stat.suffix} />
                )}
              </div>
              <div className="text-sm sm:text-base font-semibold text-ocean-muted uppercase tracking-widest max-w-[200px]">
                {stat.label}
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
