"use client";

import { useState } from "react";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";

type ComplianceResult = {
  complianceScore: number;
  issues: string[];
  recommendations: string[];
};

export function ComplianceCheck({ shipmentId }: { shipmentId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [result, setResult] = useState<ComplianceResult | null>(null);

  const handleCheck = async () => {
    setLoading(true);
    setError(false);
    setResult(null);

    try {
      const res = await fetch(`/api/shipments/${shipmentId}/compliance`, { method: "POST" });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setResult(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score: number) =>
    score >= 70 ? "text-emerald-600 dark:text-emerald-400" : score >= 40 ? "text-amber-600 dark:text-amber-400" : "text-destructive";

  return (
    <div className="space-y-3">
      <Button type="button" onClick={handleCheck} disabled={loading} className="bg-brand-orange text-brand-orange-foreground hover:opacity-90">
        <ShieldCheck className="w-4 h-4 mr-1.5" />
        {loading ? "Checking..." : "Run Compliance Check"}
      </Button>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader />
          AI DGFT compliance check kar raha hai...
        </div>
      )}

      {error && <p className="text-sm text-destructive">Compliance check fail ho gaya, dobara try karo.</p>}

      {result && (
        <div className="border border-border rounded-md p-4 bg-muted/40 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Compliance Score</span>
            <span className={`text-lg font-bold ${scoreColor(result.complianceScore)}`}>
              {result.complianceScore}/100
            </span>
          </div>

          {result.issues.length > 0 && (
            <div>
              <p className="text-xs font-medium text-foreground flex items-center gap-1 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Issues
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5">
                {result.issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {result.recommendations.length > 0 && (
            <div>
              <p className="text-xs font-medium text-foreground mb-1">Recommendations</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5">
                {result.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}