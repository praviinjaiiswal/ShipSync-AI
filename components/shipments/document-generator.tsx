"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const DOC_TYPES = [
  "COMMERCIAL_INVOICE",
  "PACKING_LIST",
  "CERTIFICATE_OF_ORIGIN",
  "SHIPPING_BILL",
  "BILL_OF_LADING",
  "LUT",
  "OTHER",
];

export function DocumentGenerator({ shipmentId }: { shipmentId: string }) {
  const [docType, setDocType] = useState("COMMERCIAL_INVOICE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(false);
    setResult(null);

    try {
      const res = await fetch("/api/ai/generate-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipmentId, docType }),
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
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <Select value={docType} onValueChange={setDocType}>
          <SelectTrigger className="sm:max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOC_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="bg-brand-orange text-brand-orange-foreground hover:opacity-90"
        >
          <Sparkles className="w-4 h-4 mr-1.5" />
          {loading ? "Generating..." : "Generate Document"}
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader />
          AI document generate kar raha hai...
        </div>
      )}

      {error && <p className="text-sm text-destructive">Document generate nahi ho paaya, dobara try karo.</p>}

      {result && (
        <div className="border border-border rounded-md p-4 bg-muted/40 space-y-2">
          {Object.entries(result).map(([key, value]) => (
            <div key={key}>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {key.replace(/([A-Z])/g, " $1")}
              </p>
              <p className="text-sm text-foreground">
                {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}