"use client";

import { useState } from "react";
import { Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";

type HSCodeResult = {
  hsCode: string;
  description: string;
  chapterHeading: string;
  applicableDuties: string;
  verified?: boolean;
  source?: string;
  updatedAt?: string;
  warning?: string;
};

export function HSCodeFinder({
  productDescription,
  onSelect,
}: {
  productDescription: string;
  onSelect: (hsCode: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [result, setResult] = useState<HSCodeResult | null>(null);

  const canSearch = productDescription.trim().length >= 10;

  const handleFind = async () => {
    setLoading(true);
    setError(false);
    setResult(null);

    try {
      const res = await fetch("/api/ai/hs-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productDescription }),
      });
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
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!canSearch || loading}
        onClick={handleFind}
      >
        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
        Find HS Code with AI
      </Button>

      {!canSearch && (
        <p className="text-xs text-muted-foreground">Product description kam se kam 10 characters honi chahiye.</p>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
          <Loader />
          AI HS code dhoond raha hai...
        </div>
      )}

      {error && <p className="text-xs text-destructive">HS code fetch nahi ho paaya, dobara try karo.</p>}

      {result && (
        <div className="border border-border rounded-md p-3 bg-muted/40 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-foreground">{result.hsCode}</span>
              {result.verified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  Tariff Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  <AlertTriangle className="w-3 h-3" />
                  Unverified Suggestion
                </span>
              )}
            </div>
            <Button type="button" size="sm" onClick={() => onSelect(result.hsCode)}>
              Use this code
            </Button>
          </div>

          {result.warning && (
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
              {result.warning}
            </div>
          )}

          <p className="text-xs text-muted-foreground">{result.description}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {result.chapterHeading && <span>Chapter: {result.chapterHeading}</span>}
            {result.applicableDuties && <span>Duties: {result.applicableDuties}</span>}
          </div>

          {result.source && (
            <p className="text-[10px] text-muted-foreground/80 border-t border-border/50 pt-1 mt-1">
              Source: {result.source}
              {result.updatedAt && ` · Updated ${new Date(result.updatedAt).toLocaleDateString()}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}