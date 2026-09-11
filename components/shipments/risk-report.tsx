"use client";

import { useState } from "react";
import { AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { StatutoryDisclaimer } from "@/components/ui/statutory-disclaimer";

type RiskResult = {
  countryRiskScore: number;
  buyerRiskScore: number;
  aiReport: string;
};

function RiskBar({ label, score }: { label: string; score: number }) {
  const color = score >= 70 ? "bg-destructive" : score >= 40 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-medium">{score}/100</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export function RiskReport({ shipmentId }: { shipmentId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RiskResult | null>(null);

  const handleAssess = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/shipments/${shipmentId}/risk`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        setError(data?.message || "AI risk assessment temporarily unavailable, please verify buyer risk manually.");
        return;
      }
      setResult(data);
    } catch {
      setError("AI risk assessment temporarily unavailable, please verify buyer risk manually.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button type="button" variant="outline" size="sm" onClick={handleAssess} disabled={loading}>
        <AlertOctagon className="w-3.5 h-3.5 mr-1.5" />
        {loading ? "Assessing..." : "Run Risk Assessment"}
      </Button>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
          <Loader />
          Analyzing trade and country risks...
        </div>
      )}

      {error && (
        <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-3 pt-1">
          <RiskBar label="Country Risk" score={result.countryRiskScore} />
          <RiskBar label="Buyer Risk" score={result.buyerRiskScore} />
          <p className="text-xs text-muted-foreground pt-1">{result.aiReport}</p>
          <StatutoryDisclaimer />
        </div>
      )}
    </div>
  );
}