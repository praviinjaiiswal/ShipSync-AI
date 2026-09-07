'use client';

import React from 'react';
import { AlertOctagon, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import type { DiscrepancyReport } from '@/lib/documents/canonical-types';

interface DiscrepancyBannerProps {
  report: DiscrepancyReport | null;
  loading?: boolean;
  onRecheck?: () => void;
}

export function DiscrepancyBanner({ report, loading, onRecheck }: DiscrepancyBannerProps) {
  if (!report && !loading) return null;

  if (loading) {
    return (
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
          <span>Cross-referencing Commercial Invoice, Packing List & Bill of Entry...</span>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const { hasBlockingErrors, errorCount, warningCount, discrepancies } = report;

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        hasBlockingErrors
          ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
          : warningCount > 0
          ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
          : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start space-x-3">
          {hasBlockingErrors ? (
            <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : warningCount > 0 ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}

          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              {hasBlockingErrors
                ? `Statutory Discrepancy Detected (${errorCount} Blocking Error${errorCount > 1 ? 's' : ''})`
                : warningCount > 0
                ? `Document Discrepancy Notice (${warningCount} Warning${warningCount > 1 ? 's' : ''})`
                : 'Cross-Document Reconciliation Passed'}
            </h4>
            <p className="text-xs opacity-90">
              {hasBlockingErrors
                ? 'Statutory discrepancies will lead to Customs query / BOE rejection at port. Rectify before ICEGATE transmission.'
                : warningCount > 0
                ? 'Minor variances detected between documents. Review advisory items below.'
                : 'Commercial Invoice, Packing List, and Bill of Entry values and weights align within statutory tolerances.'}
            </p>

            {discrepancies.length > 0 && (
              <div className="mt-3 space-y-2 pt-2 border-t border-slate-800/60">
                {discrepancies.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg text-xs border ${
                      item.severity === 'ERROR'
                        ? 'bg-rose-900/30 border-rose-500/20 text-rose-200'
                        : 'bg-amber-900/30 border-amber-500/20 text-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold mb-1">
                      <span className="flex items-center space-x-1.5">
                        <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-black/40 font-mono">
                          {item.type}
                        </span>
                        <span>{item.message}</span>
                      </span>
                      <span className="text-[10px] uppercase font-mono opacity-80">
                        {item.docSources.join(' ↔ ')}
                      </span>
                    </div>
                    <div className="text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-300">
                      <div>
                        <span className="text-slate-400">Expected:</span> {String(item.expected)}
                      </div>
                      <div>
                        <span className="text-slate-400">Found:</span> {String(item.actual)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {onRecheck && (
          <button
            onClick={onRecheck}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 shrink-0 transition-colors flex items-center space-x-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Re-verify</span>
          </button>
        )}
      </div>
    </div>
  );
}
