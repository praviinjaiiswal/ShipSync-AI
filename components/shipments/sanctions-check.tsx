"use client";

import { useState } from "react";
import { ShieldAlert, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";

type SanctionsMatch = {
  name: string;
  source: string;
  type: string;
  referenceNumber?: string;
  programs?: string[];
  remarks?: string;
};

type SanctionsResult = {
  matchFound: boolean;
  usListMatch?: boolean;
  dgftListMatch?: boolean;
  scometListMatch?: boolean;
  matches: SanctionsMatch[] | {
    usListMatch?: boolean;
    dgftListMatch?: boolean;
    scometListMatch?: boolean;
    matches?: SanctionsMatch[];
  };
  screeningReport?: {
    usListMatch: boolean;
    dgftListMatch: boolean;
    scometListMatch: boolean;
    matches: SanctionsMatch[];
  };
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

  // Normalize report fields whether stored directly or nested in matches/screeningReport
  const report = result?.screeningReport || (Array.isArray(result?.matches) ? null : result?.matches);
  const matchList: SanctionsMatch[] = Array.isArray(result?.matches)
    ? result.matches
    : Array.isArray(report?.matches)
    ? report.matches
    : [];

  const dgftFlagged = Boolean(result?.dgftListMatch ?? report?.dgftListMatch);
  const scometFlagged = Boolean(result?.scometListMatch ?? report?.scometListMatch);
  const usFlagged = Boolean(result?.usListMatch ?? report?.usListMatch);

  return (
    <div className="space-y-3">
      <Button type="button" onClick={handleCheck} disabled={loading} className="w-full">
        <ShieldAlert className="w-4 h-4 mr-1.5" />
        {loading ? "Screening against DGFT, SCOMET & CSL..." : "Run Multi-Regime Sanctions Check"}
      </Button>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
          <Loader />
          DGFT Denied Entity List, SCOMET Restricted List, and US CSL check in progress...
        </div>
      )}

      {error && <p className="text-xs text-destructive">Sanctions check fail ho gaya, dobara try karo.</p>}

      {result && (
        <div className="space-y-3">
          {/* Regime Badges */}
          <div className="grid grid-cols-3 gap-2">
            <div className={`p-2 rounded-lg border text-center text-xs ${dgftFlagged ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'}`}>
              <div className="font-semibold">DGFT (DEL)</div>
              <div className="text-[11px] mt-0.5">{dgftFlagged ? 'Flagged' : 'Clear'}</div>
            </div>
            <div className={`p-2 rounded-lg border text-center text-xs ${scometFlagged ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'}`}>
              <div className="font-semibold">SCOMET</div>
              <div className="text-[11px] mt-0.5">{scometFlagged ? 'Restricted' : 'Clear'}</div>
            </div>
            <div className={`p-2 rounded-lg border text-center text-xs ${usFlagged ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'}`}>
              <div className="font-semibold">US CSL</div>
              <div className="text-[11px] mt-0.5">{usFlagged ? 'Flagged' : 'Clear'}</div>
            </div>
          </div>

          {!result.matchFound ? (
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-md p-3">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Buyer cleared across all statutory Indian (DGFT/SCOMET) and global screening databases.</span>
            </div>
          ) : (
            <div className="border border-destructive/40 bg-destructive/10 rounded-md p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <ShieldAlert className="w-4 h-4" />
                ⚠️ Statutory Sanctions Match Found — Mandatory Compliance Review Required
              </div>
              {matchList.map((match, i) => (
                <div key={i} className="text-xs text-muted-foreground border-t border-destructive/20 pt-2 space-y-0.5">
                  <p className="text-foreground font-semibold flex items-center justify-between">
                    <span>{match.name}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive uppercase">
                      {match.source}
                    </span>
                  </p>
                  <p>Type: {match.type} {match.referenceNumber && `· Ref: ${match.referenceNumber}`}</p>
                  {match.remarks && <p className="text-slate-600 dark:text-slate-300 italic">{match.remarks}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}