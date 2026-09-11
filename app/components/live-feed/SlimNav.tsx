"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Ship, Radio, Sparkles, Menu, X, ArrowUpRight } from "lucide-react";
import { SignedIn, SignedOut } from "@clerk/nextjs";

interface SlimNavProps {
  onOpenWaitlist: () => void;
}

export function SlimNav({ onOpenWaitlist }: SlimNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-border shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Brand Logo & Live Newsroom Badge */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-navy-deep text-white flex items-center justify-center shadow-xs">
                <Ship className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="font-heading font-extrabold text-base sm:text-lg text-navy-deep dark:text-white tracking-tight">
                ShipSync <span className="text-ocean-deep dark:text-ocean-light">AI</span>
              </span>
            </Link>

            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold tracking-wide uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Regulatory Newsroom</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            {/* Live Feed (Active Indicator) */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-deep dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-700"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>Live Feed</span>
            </Link>

            <Link
              href="/about"
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-navy-deep dark:hover:text-white transition-colors"
            >
              What is ShipSync?
            </Link>

            <Link
              href="/pricing"
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-navy-deep dark:hover:text-white transition-colors"
            >
              Pricing
            </Link>

            <Link
              href="/trade-updates"
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-navy-deep dark:hover:text-white transition-colors"
            >
              Ask Sync AI
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <SignedOut>
              <Link
                href="/sign-in"
                className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-navy-deep dark:hover:text-white transition-colors"
              >
                Log In
              </Link>
            </SignedOut>

            <SignedIn>
              <Link
                href="/dashboard"
                className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-navy-deep dark:hover:text-white transition-colors"
              >
                Dashboard
              </Link>
            </SignedIn>

            {/* Persistent Waitlist CTA Button */}
            <button
              type="button"
              onClick={onOpenWaitlist}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-navy-deep hover:bg-ocean-deep text-white text-xs font-bold tracking-wide transition-all duration-200 shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Join Waitlist</span>
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={onOpenWaitlist}
              className="px-3 py-1 rounded-full bg-navy-deep text-white text-[11px] font-bold"
            >
              Waitlist
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-navy-deep"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-white dark:bg-slate-900 px-4 py-4 space-y-3 shadow-lg">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-between text-xs font-semibold text-navy-deep dark:text-white py-1.5"
          >
            <span className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-emerald-500" />
              Live Feed
            </span>
            <span className="text-[10px] text-emerald-600 font-bold uppercase">Active</span>
          </Link>

          <Link
            href="/about"
            onClick={() => setMobileOpen(false)}
            className="block text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-navy-deep py-1.5"
          >
            What is ShipSync?
          </Link>

          <Link
            href="/pricing"
            onClick={() => setMobileOpen(false)}
            className="block text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-navy-deep py-1.5"
          >
            Pricing
          </Link>

          <Link
            href="/trade-updates"
            onClick={() => setMobileOpen(false)}
            className="block text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-navy-deep py-1.5"
          >
            Ask Sync AI Chatbot
          </Link>

          <div className="pt-2 border-t border-border flex items-center justify-between">
            <SignedOut>
              <Link
                href="/sign-in"
                onClick={() => setMobileOpen(false)}
                className="text-xs font-medium text-slate-600 hover:text-navy-deep"
              >
                Log In
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="text-xs font-medium text-slate-600 hover:text-navy-deep"
              >
                Go to Dashboard
              </Link>
            </SignedIn>

            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenWaitlist();
              }}
              className="text-xs font-bold text-ocean-deep hover:underline"
            >
              Join Waitlist
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
