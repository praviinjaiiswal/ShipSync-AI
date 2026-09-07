'use client';

import React, { useEffect, useState } from 'react';
import { IndianRupee, AlertCircle } from 'lucide-react';

export function IncentiveSummaryCard() {
  const [data, setData] = useState<{ totalEstimated: number; unmatchedCount: number; totalShipments: number } | null>(null);

  useEffect(() => {
    fetch('/api/incentive-summary')
      .then(async (res) => {
        if (!res.ok) return null;
        const json = await res.json();
        return json && typeof json.totalEstimated === 'number' ? json : null;
      })
      .then((resData) => setData(resData))
      .catch(() => setData(null));
  }, []);

  const totalEstimated = data?.totalEstimated ?? 0;
  const unmatchedCount = data?.unmatchedCount ?? 0;

  return (
    <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-lg p-6">
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Estimated RoDTEP Incentive</p>
      <div className="flex items-center gap-1">
        <IndianRupee className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
          {totalEstimated.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
      </div>
      {unmatchedCount > 0 && (
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {unmatchedCount} shipments ke HS codes ke liye rate missing hai — Settings me DGFT CSV import karo.
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-1 italic">Estimate hai, final claim DGFT portal pe verify karo.</p>
    </div>
  );
}