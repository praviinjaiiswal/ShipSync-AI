"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";

type HSCodeResult = {
  hsCode: string;
  description: string;
  chapterHeading: string;
  applicableDuties: string;
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
        <div className="border border-border rounded-md p-3 bg-muted/40 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm font-semibold text-foreground">{result.hsCode}</span>
            <Button type="button" size="sm" onClick={() => onSelect(result.hsCode)}>
              Use this code
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{result.description}</p>
          <p className="text-xs text-muted-foreground">Chapter: {result.chapterHeading}</p>
          <p className="text-xs text-muted-foreground">Duties: {result.applicableDuties}</p>
        </div>
      )}
    </div>
  );
}