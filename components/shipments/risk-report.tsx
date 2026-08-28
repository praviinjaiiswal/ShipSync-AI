"use client";

import { useState } from "react";
import { AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";

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
  const [error, setError] = useState(false);
  const [result, setResult] = useState<RiskResult | null>(null);

  const handleAssess = async () => {
    setLoading(true);
    setError(false);
    setResult(null);

    try {
      const res = await fetch(`/api/shipments/${shipmentId}/risk`, { method: "POST" });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setResult(data);
    } catch {
      setError(true);
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
          Risk analyze ho raha hai...
        </div>
      )}

      {error && <p className="text-xs text-destructive">Risk assessment fail ho gaya.</p>}

      {result && (
        <div className="space-y-3 pt-1">
          <RiskBar label="Country Risk" score={result.countryRiskScore} />
          <RiskBar label="Buyer Risk" score={result.buyerRiskScore} />
          <p className="text-xs text-muted-foreground pt-1">{result.aiReport}</p>
        </div>
      )}
    </div>
  );
}