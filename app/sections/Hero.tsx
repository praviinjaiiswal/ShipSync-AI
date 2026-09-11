"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function Hero() {

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-editorial-light to-transparent rounded-full blur-[100px] pointer-events-none opacity-60" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-editorial-light border border-ocean-muted/30 text-ocean-deep text-xs font-semibold tracking-wider uppercase">
            AI Export Intelligence
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold text-navy-deep tracking-tight leading-[1.15] mb-6"
        >
          Turn Export Complexity <br className="hidden sm:block" />
          <span className="text-gradient">Into Competitive Advantage.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-lg sm:text-xl text-ocean-muted max-w-2xl mx-auto leading-relaxed mb-10"
        >
          ShipSync AI identifies the right HS codes, finds eligible trade benefits, validates documents and helps you move from product description to export-ready paperwork with confidence.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="#waitlist"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-navy-deep hover:bg-ocean-deep text-sea text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Start with ShipSync AI
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white hover:bg-editorial-light text-navy-deep text-sm font-medium border border-border transition-all duration-300"
          >
            See How It Works
          </Link>
        </motion.div>

        {/* Research-style trust bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-20 pt-10 border-t border-border/60"
        >
          <p className="text-[11px] uppercase tracking-widest text-ocean-muted mb-6 font-semibold">
            No credit card • Early access • Built for Indian exporters
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-ocean-deep font-medium text-sm">
            <span>21,000+ Tariff Lines</span>
            <span className="hidden sm:inline text-border">·</span>
            <span>ICEGATE Adapter Ready</span>
            <span className="hidden sm:inline text-border">·</span>
            <span>DGFT Compliant</span>
            <span className="hidden sm:inline text-border">·</span>
            <span>FTA Optimized</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
