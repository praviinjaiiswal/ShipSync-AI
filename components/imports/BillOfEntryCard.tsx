'use client';

import React, { useState } from 'react';
import { FileCheck, Lock, ArrowUpRight, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

interface BillOfEntryData {
  id: string;
  beNumber: string;
  beDate: string | Date;
  totalDutyPayable: number;
  paymentStatus: string;
  challanNumber?: string | null;
}

interface BillOfEntryCardProps {
  shipmentId: string;
  billOfEntry?: BillOfEntryData | null;
  currency: string;
  onGenerated?: () => void;
}

export function BillOfEntryCard({
  shipmentId,
  billOfEntry,
  currency,
  onGenerated,
}: BillOfEntryCardProps) {
  const { success, error } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateBoe = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/import-shipments/${shipmentId}/bill-of-entry`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to generate Bill of Entry');
      }
      success(`Bill of Entry generated: ${data.billOfEntry.beNumber}`);
      if (onGenerated) {
        onGenerated();
      } else {
        window.location.reload();
      }
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Error generating BOE');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <FileCheck className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Bill of Entry (BOE)</h3>
            <p className="text-[11px] text-slate-400">Official Customs Clearance Declaration</p>
          </div>
        </div>

        {billOfEntry && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
            <Lock className="h-3 w-3" /> Locked
          </span>
        )}
      </div>

      {billOfEntry ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Customs Declaration Number</p>
                <p className="text-base font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                  {billOfEntry.beNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Filing Date</p>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                  {new Date(billOfEntry.beDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">Challan Payment: </span>
                <span
                  className={
                    billOfEntry.paymentStatus === 'PAID'
                      ? 'font-bold text-emerald-600 dark:text-emerald-400'
                      : 'font-bold text-amber-600 dark:text-amber-400'
                  }
                >
                  {billOfEntry.paymentStatus}
                </span>
                {billOfEntry.challanNumber && (
                  <span className="text-slate-400 text-[11px] ml-1.5 font-mono">
                    ({billOfEntry.challanNumber})
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-slate-400">Assessed Duty: </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {currency} {billOfEntry.totalDutyPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
            <Lock className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-semibold">Declared Values Locked</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                Modifications to invoice value or HS code now require an official Customs Amendment with audit logging.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-4 space-y-4 text-center">
          <div className="max-w-xs mx-auto space-y-1">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Generate Official Bill of Entry
            </p>
            <p className="text-[11px] text-slate-400">
              Generates a sequential BE number, snapshots calculated duty, and locks declared shipment values.
            </p>
          </div>

          <Button
            onClick={handleGenerateBoe}
            disabled={isGenerating}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 gap-2"
          >
            <FileCheck className="h-4 w-4" />
            {isGenerating ? 'Generating BOE & Locking Values...' : 'Generate Bill of Entry'}
          </Button>
        </div>
      )}
    </div>
  );
}
