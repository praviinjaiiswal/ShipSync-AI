'use client';

import React, { useState } from 'react';
import { Check, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import type { ImportShipmentStatus } from '@prisma/client';

const ORDERED_STATUSES: { id: ImportShipmentStatus; title: string; subtitle: string }[] = [
  { id: 'IGM_FILED', title: 'IGM Filed', subtitle: 'Manifest registered at Indian port' },
  { id: 'BOE_FILED', title: 'BOE Filed', subtitle: 'Bill of Entry generated & locked' },
  { id: 'ASSESSED', title: 'Assessed', subtitle: 'Customs valuation verified' },
  { id: 'DUTY_PAID', title: 'Duty Paid', subtitle: 'Customs challan cleared' },
  { id: 'EXAMINED', title: 'Examined', subtitle: 'Customs officer dock inspection' },
  { id: 'OUT_OF_CHARGE', title: 'Out of Charge', subtitle: 'OOC issued for clearance' },
  { id: 'DELIVERED', title: 'Delivered', subtitle: 'Gate pass & final cargo delivery' },
];

interface ImportTimelineProps {
  shipmentId: string;
  currentStatus: ImportShipmentStatus;
  hasBoe: boolean;
  onStatusChange?: (newStatus: ImportShipmentStatus) => void;
}

export function ImportTimeline({
  shipmentId,
  currentStatus,
  hasBoe,
  onStatusChange,
}: ImportTimelineProps) {
  const { success, error } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const currentIndex = ORDERED_STATUSES.findIndex((s) => s.id === currentStatus);
  const nextStatusObj = currentIndex >= 0 && currentIndex < ORDERED_STATUSES.length - 1
    ? ORDERED_STATUSES[currentIndex + 1]
    : null;

  const handleAdvance = async () => {
    if (!nextStatusObj) return;

    if (nextStatusObj.id === 'BOE_FILED' && !hasBoe) {
      error('Generate the Bill of Entry first before advancing to BOE Filed.');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/import-shipments/${shipmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatusObj.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to advance status');
      }

      success(`Status advanced to ${nextStatusObj.title}`);
      if (onStatusChange) {
        onStatusChange(nextStatusObj.id);
      } else {
        window.location.reload();
      }
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Error updating status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {ORDERED_STATUSES.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isPending = idx > currentIndex;

          return (
            <div key={step.id} className="relative flex items-start gap-3">
              {/* Connector line */}
              {idx < ORDERED_STATUSES.length - 1 && (
                <div
                  className={cn(
                    'absolute left-4 top-8 -bottom-4 w-0.5 transition-colors',
                    idx < currentIndex
                      ? 'bg-blue-600 dark:bg-blue-500'
                      : 'bg-slate-200 dark:bg-slate-800'
                  )}
                />
              )}

              {/* Node Indicator */}
              <div
                className={cn(
                  'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all shadow-sm',
                  isDone && 'bg-blue-600 text-white',
                  isCurrent && 'bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-blue-500/30',
                  isPending && 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                )}
              >
                {isDone ? <Check className="h-4 w-4 stroke-[3]" /> : idx + 1}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      'text-sm font-semibold tracking-tight',
                      isCurrent ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-900 dark:text-slate-100',
                      isPending && 'text-slate-400'
                    )}
                  >
                    {step.title}
                  </p>
                  {isCurrent && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-snug mt-0.5">{step.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {nextStatusObj && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            onClick={handleAdvance}
            disabled={isUpdating}
            className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2"
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            Advance to: {nextStatusObj.title}
          </Button>
        </div>
      )}

      {currentStatus === 'DELIVERED' && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />
          Shipment clearance and physical delivery successfully completed.
        </div>
      )}
    </div>
  );
}
