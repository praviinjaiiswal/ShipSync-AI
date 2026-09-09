'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, ExternalLink, ShieldCheck, Globe, Clock, Sparkles, HelpCircle } from 'lucide-react';

interface TradeBriefingItemProps {
  item: {
    id: string;
    title: string;
    summary: string;
    category: string;
    country?: string | null;
    sourceName: string;
    sourceUrl: string;
    publishedAt?: string | Date | null;
    createdAt: string | Date;
  };
  categoryLabel: string;
  formattedTime: string;
}

export function TradeBriefingItem({ item, categoryLabel, formattedTime }: TradeBriefingItemProps) {
  const [isSimplified, setIsSimplified] = useState(false);

  // Generate a friendly, plain-spoken simplified restatement from the summary
  const getSimpleExplanation = () => {
    // Break into sentences and provide a clear 1-2 bullet takeaway
    const sentences = item.summary.split(/(?<=[.?!])\s+/).filter(Boolean);
    const mainAction = sentences[0] || item.title;
    const impact = sentences[1] || 'Exporters should review affected HS codes before preparing shipping bills.';

    return {
      action: mainAction,
      impact: impact,
    };
  };

  const simple = getSimpleExplanation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex items-start gap-3 sm:gap-4 group"
    >
      {/* Sync AI Avatar */}
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-navy-deep text-white flex items-center justify-center shrink-0 shadow-sm mt-1 ring-4 ring-slate-100 dark:ring-slate-800">
        <Bot className="w-5 h-5 text-emerald-400" />
      </div>

      {/* Chat Message Bubble */}
      <div className="flex-1 bg-white dark:bg-slate-900 border border-border/80 rounded-2xl rounded-tl-xs p-5 sm:p-6 shadow-2xs hover:border-ocean-deep/30 transition-all space-y-3.5">
        {/* Header: Persona + Badge + Time */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-navy-deep dark:text-white">Sync AI</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-editorial-light dark:bg-slate-800 text-ocean-deep border border-ocean-muted/20">
              {categoryLabel}
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
            <span>{formattedTime}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-heading font-bold text-base sm:text-lg text-navy-deep dark:text-white leading-snug">
          {item.title}
        </h3>

        {/* Summary or Simplified View */}
        <div className="text-sm leading-relaxed text-ocean-muted dark:text-slate-300">
          <AnimatePresence mode="wait">
            {isSimplified ? (
              <motion.div
                key="simplified"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="p-3.5 rounded-xl bg-editorial-light/70 dark:bg-slate-800/70 border border-ocean-muted/20 space-y-2 text-xs"
              >
                <div className="flex items-center gap-1.5 font-bold text-ocean-deep text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Plain English Breakdown:
                </div>
                <ul className="space-y-1 text-slate-700 dark:text-slate-200 list-disc list-inside">
                  <li><strong className="text-navy-deep dark:text-white">What happened: </strong>{simple.action}</li>
                  <li><strong className="text-navy-deep dark:text-white">What it means for you: </strong>{simple.impact}</li>
                </ul>
              </motion.div>
            ) : (
              <motion.p
                key="standard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {item.summary}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Row: Explain simply toggle + Source attribution */}
        <div className="pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Explain simply button */}
          <button
            onClick={() => setIsSimplified(!isSimplified)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Sparkles className={`w-3 h-3 ${isSimplified ? 'text-amber-500' : 'text-slate-400'}`} />
            <span>{isSimplified ? 'Show official summary' : 'Explain like I’m new to export'}</span>
          </button>

          {/* Official Source Link */}
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-[11px] flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified via {item.sourceName}
            </span>

            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ocean-deep hover:underline font-semibold inline-flex items-center gap-1 text-[11px]"
              title="View original government circular"
            >
              <span>Original Notice</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
