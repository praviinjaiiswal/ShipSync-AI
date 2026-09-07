"use client";

import { useState } from "react";
import { Sparkles, FileCheck, Download, ExternalLink, AlertCircle } from "lucide-react";
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
  "BILL_OF_ENTRY",
];

interface GeneratedResult {
  success: boolean;
  version: number;
  signedUrl: string;
  fileSize: number;
  mimeType: string;
  message: string;
}

export function DocumentGenerator({ shipmentId }: { shipmentId: string }) {
  const [docType, setDocType] = useState("COMMERCIAL_INVOICE");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedResult | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai/generate-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipmentId, docType }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Document generation failed. Please retry.");
      }
      setResult(data);
    } catch (err: any) {
      setErrorMessage(err.message || "Document generation failed, please retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3.5">
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
          className="bg-brand-orange text-brand-orange-foreground hover:opacity-90 transition-opacity"
        >
          <Sparkles className="w-4 h-4 mr-1.5" />
          {loading ? "Generating PDF..." : "Generate Official PDF"}
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader />
          Drafting statutory content and rendering high-resolution PDF...
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2.5 rounded-md border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {result && (
        <div className="border border-emerald-500/30 rounded-lg p-4 bg-emerald-500/5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  {docType.replace(/_/g, " ")} (v{result.version})
                </h4>
                <p className="text-xs text-muted-foreground">
                  Statutory PDF • {(result.fileSize / 1024).toFixed(1)} KB • Rendered per Indian Customs Standards
                </p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
              Ready
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-emerald-500/15">
            <a
              href={result.signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View & Download PDF
            </a>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={loading}
              className="h-8 text-xs gap-1"
            >
              <Sparkles className="w-3 h-3 text-brand-orange" />
              Generate v{result.version + 1}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}