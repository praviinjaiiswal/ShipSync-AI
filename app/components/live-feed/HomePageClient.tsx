"use client";

import React, { useState } from "react";
import { SlimNav } from "./SlimNav";
import { TradeFeed } from "./TradeFeed";
import { WaitlistModal } from "../WaitlistModal";
import { Sparkles } from "lucide-react";

export function HomePageClient() {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col relative selection:bg-ocean-deep/15">
      {/* 1. Slim Top Navigation */}
      <SlimNav onOpenWaitlist={() => setIsWaitlistOpen(true)} />

      {/* 2. Live Trade Intelligence Feed (News Channel) */}
      <div className="flex-1 w-full">
        <TradeFeed />
      </div>

      {/* 3. Persistent Sticky Floating "Join Waitlist" Action Button */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          type="button"
          onClick={() => setIsWaitlistOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-navy-deep hover:bg-ocean-deep text-white text-xs font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 border border-slate-700/60 cursor-pointer group"
          title="Join ShipSync AI Early Access Waitlist"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
          <span>Join Waitlist</span>
        </button>
      </div>

      {/* 4. Global Waitlist Modal */}
      <WaitlistModal
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
      />
    </main>
  );
}
