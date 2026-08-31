"use client";

import { useEffect, useState } from "react";
import { IndianRupee, AlertCircle } from "lucide-react";

export function IncentiveCalculator({
  hsCode,
  value,
  currency,
}: {
  hsCode: string;
  value: number;
  currency: string;
}) {
  const [rate, setRate] = useState<{
    rodtepRate: number | null;
    rodtepCapPerUnit: number | null;
    dutyDrawbackRate: number | null;
    source: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/duty-rates/${hsCode}`)
      .then((res) => res.json())
      .then(setRate)
      .finally(() => setLoading(false));
  }, [hsCode]);

  if (loading) return <div className="h-16 bg-muted rounded-md animate-pulse" />;

  if (!rate || rate.rodtepRate === null) {
    return (
      <div className="flex items-start gap-2 text-xs text-muted-foreground border border-dashed border-border rounded-md p-3">
        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>
          HS Code <strong>{hsCode}</strong> ke liye RoDTEP rate load nahi hai. Settings me DGFT CSV import karo.
        </span>
      </div>
    );
  }

  const estimatedIncentive = value * (rate.rodtepRate / 100);

  return (
    <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-md p-4 space-y-2">
      <div className="flex items-center gap-2">
        <IndianRupee className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
          ~{currency} {estimatedIncentive.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
        <span className="text-xs text-muted-foreground">estimated RoDTEP incentive</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Rate: {rate.rodtepRate}% of shipment value
        {rate.dutyDrawbackRate ? ` · Duty Drawback: ${rate.dutyDrawbackRate}%` : ""}
      </p>
      <p className="text-xs text-muted-foreground italic">
        Estimate hai — final claim se pehle DGFT portal pe verify karo. Data source: {rate.source === "DGFT_IMPORT" ? "DGFT imported" : "Unverified"}.
      </p>
    </div>
  );
}