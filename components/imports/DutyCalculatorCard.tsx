'use client';

import React, { useState, useEffect } from 'react';
import { Calculator, RefreshCw, Sparkles, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import type { DutyCalculationBreakdown } from '@/lib/duty-calculator';

interface DutyCalculatorCardProps {
  shipmentId: string;
  initialBreakdown?: DutyCalculationBreakdown | null;
  currency: string;
  isLocked?: boolean;
}

export function DutyCalculatorCard({
  shipmentId,
  initialBreakdown,
  currency,
  isLocked = false,
}: DutyCalculatorCardProps) {
  const { error, info } = useToast();
  const [breakdown, setBreakdown] = useState<DutyCalculationBreakdown | null>(initialBreakdown || null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBreakdown = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/import-shipments/${shipmentId}/duty-calculate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to calculate duty');
      }
      setBreakdown(data.breakdown);
      if (data.breakdown.isCached) {
        info('Duty calculation loaded from 5-minute cache');
      }
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Error calculating duty');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!breakdown) {
      fetchBreakdown();
    }
  }, [shipmentId]);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            <Calculator className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Customs Duty Breakdown</h3>
            <p className="text-[11px] text-slate-400">CBIC Statutory Assessment Formula</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchBreakdown}
          disabled={isLoading}
          className="h-8 gap-1.5 text-xs text-slate-600 dark:text-slate-300"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          Recalculate
        </Button>
      </div>

      {isLoading && !breakdown && (
        <div className="py-8 text-center text-xs text-slate-400">
          Calculating statutory duty against CBIC tariff...
        </div>
      )}

      {breakdown && (
        <div className="space-y-4">
          {/* Main Duty Metric */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-transparent border border-blue-500/20">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Total Customs Duty Payable</p>
                <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-0.5">
                  {currency} {breakdown.totalDutyPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400">Assessable Value (CIF + 1%)</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {currency} {breakdown.assessableValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Component Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
              <span className="text-slate-400">CIF Invoice Value</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {currency} {breakdown.cifValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
              <span className="text-slate-400">1% Landing Charges</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {currency} {breakdown.landingCharges.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex justify-between">
                <span className="text-slate-400">BCD (Basic Duty)</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{(breakdown.bcdRate * 100).toFixed(1)}%</span>
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {currency} {breakdown.bcdAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex justify-between">
                <span className="text-slate-400">SWS (Surcharge)</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">10% of BCD</span>
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {currency} {breakdown.swsAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex justify-between">
                <span className="text-slate-400">IGST</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">{(breakdown.igstRate * 100).toFixed(1)}%</span>
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {currency} {breakdown.igstAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex justify-between">
                <span className="text-slate-400">Cess</span>
                <span className="font-bold text-slate-500">{(breakdown.cessRate * 100).toFixed(1)}%</span>
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {currency} {breakdown.cessAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Reference Notice */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="truncate pr-2">Ref: {breakdown.sourceNotificationRef}</span>
            {breakdown.isCached && (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 shrink-0 font-medium">
                <CheckCircle2 className="h-3 w-3" /> Cached
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
