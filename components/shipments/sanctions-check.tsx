"use client";

import { useState } from "react";
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";

type SanctionsMatch = {
  name: string;
  source: string;
  type: string;
  programs?: string[];
  remarks?: string;
};

type SanctionsResult = {
  matchFound: boolean;
  matches: SanctionsMatch[];
};

export function SanctionsCheck({ shipmentId }: { shipmentId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [result, setResult] = useState<SanctionsResult | null>(null);

  const handleCheck = async () => {
    setLoading(true);
    setError(false);
    setResult(null);

    try {
      const res = await fetch(`/api/shipments/${shipmentId}/sanctions`, { method: "POST" });
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
      <Button type="button" onClick={handleCheck} disabled={loading} className="w-full">
        <ShieldAlert className="w-4 h-4 mr-1.5" />
        {loading ? "Checking..." : "Run Sanctions Check"}
      </Button>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
          <Loader />
          Buyer ko restricted-party list ke against check kiya jaa raha hai...
        </div>
      )}

      {error && <p className="text-xs text-destructive">Sanctions check fail ho gaya, dobara try karo.</p>}

      {result && !result.matchFound && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-md p-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Koi match nahi mila. Buyer restricted lists me nahi hai.
        </div>
      )}

      {result && result.matchFound && (
        <div className="border border-destructive/40 bg-destructive/10 rounded-md p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <ShieldAlert className="w-4 h-4" />
            ⚠️ Match mila — is buyer se pehle legal/compliance check karo!
          </div>
          {result.matches.map((match, i) => (
            <div key={i} className="text-xs text-muted-foreground border-t border-destructive/20 pt-2">
              <p className="text-foreground font-medium">{match.name}</p>
              <p>Source: {match.source} · Type: {match.type}</p>
              {match.programs && match.programs.length > 0 && (
                <p>Programs: {match.programs.join(", ")}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}