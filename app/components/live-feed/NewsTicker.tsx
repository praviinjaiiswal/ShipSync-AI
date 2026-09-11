"use client";

import React from "react";
import { Radio, ChevronRight, ExternalLink } from "lucide-react";

export interface TickerItem {
  id: string;
  title: string;
  sourceName: string;
  publishedAt: string | Date;
  category: string;
  sourceUrl: string;
}

interface NewsTickerProps {
  items: TickerItem[];
  isLoading?: boolean;
  onSelectHeadline?: (item: TickerItem) => void;
}

function formatRelativeTime(dateInput: string | Date): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - d.getTime()) / (1000 * 60));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export function NewsTicker({ items, isLoading = false, onSelectHeadline }: NewsTickerProps) {
  if (isLoading) {
    return (
      <div className="w-full bg-slate-900 border-b border-slate-800 text-white h-10 flex items-center px-4 overflow-hidden select-none">
        <div className="flex items-center gap-2 bg-rose-600/90 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-sm shrink-0 shadow-sm animate-pulse">
          <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
          <span>LIVE DESK</span>
        </div>
        <div className="ml-4 flex-1 h-3.5 bg-slate-800 rounded-full animate-pulse max-w-xl"></div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return null;
  }

  // Duplicate items for infinite seamless looping
  const displayItems = [...items, ...items];

  return (
    <div className="w-full bg-slate-950 border-b border-slate-800/80 text-white h-10 flex items-center overflow-hidden select-none z-40 relative">
      {/* Fixed Live Tag Badge */}
      <div className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-rose-700 text-white text-[11px] font-extrabold uppercase tracking-wider px-3.5 h-full shrink-0 shadow-md z-10 border-r border-rose-500/30">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        <span className="flex items-center gap-1.5">
          <Radio className="w-3 h-3 animate-pulse" />
          BREAKING ALERTS
        </span>
      </div>

      {/* Auto-scrolling ticker track */}
      <div className="relative flex-1 overflow-hidden h-full flex items-center">
        <div className="animate-marquee items-center gap-8 pl-4">
          {displayItems.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              onClick={() => onSelectHeadline?.(item)}
              className="flex items-center gap-2.5 text-xs text-slate-200 hover:text-white cursor-pointer transition-colors whitespace-nowrap group shrink-0"
              title="Click to view full statutory notification"
            >
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700/80 group-hover:border-slate-500">
                {item.sourceName}
              </span>
              <span className="font-medium group-hover:underline max-w-md truncate">
                {item.title}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {formatRelativeTime(item.publishedAt)}
              </span>
              <span className="text-slate-600 font-bold ml-2">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
