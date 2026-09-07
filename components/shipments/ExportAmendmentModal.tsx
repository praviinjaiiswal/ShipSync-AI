"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, FileEdit, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ExportAmendmentModalProps {
  shipmentId: string;
  initialData: {
    fobValue: number;
    hsCode: string;
    buyerName: string;
    portOfDischarge?: string | null;
    countryOfDestination?: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function ExportAmendmentModal({
  shipmentId,
  initialData,
  isOpen,
  onClose,
}: ExportAmendmentModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reason, setReason] = useState("");
  const [fobValue, setFobValue] = useState(String(initialData.fobValue));
  const [hsCode, setHsCode] = useState(initialData.hsCode);
  const [buyerName, setBuyerName] = useState(initialData.buyerName);
  const [portOfDischarge, setPortOfDischarge] = useState(initialData.portOfDischarge || "");
  const [countryOfDestination, setCountryOfDestination] = useState(initialData.countryOfDestination || "");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/shipments/${shipmentId}/amend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          fobValue: parseFloat(fobValue),
          hsCode,
          buyerName,
          portOfDischarge: portOfDischarge || undefined,
          countryOfDestination: countryOfDestination || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.message || "Failed to record export amendment");
      }

      onClose();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-2">
            <FileEdit className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-base font-semibold text-foreground">Record Statutory Export Amendment</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md">
              {error}
            </div>
          )}

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Under Section 149 of the Indian Customs Act, changes to declared Shipping Bill values
              are versioned and logged. Changing FOB value or HS Code will automatically recalculate
              statutory export incentives.
            </span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason">Statutory Justification / Amendment Reason *</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Revised commercial invoice pricing per addendum dated 2026-09-05"
              required
              minLength={5}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fobValue">Declared FOB Value *</Label>
              <Input
                id="fobValue"
                type="number"
                step="0.01"
                value={fobValue}
                onChange={(e) => setFobValue(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hsCode">HS Code (8-digit) *</Label>
              <Input
                id="hsCode"
                value={hsCode}
                onChange={(e) => setHsCode(e.target.value)}
                placeholder="e.g. 84713010"
                maxLength={8}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="buyerName">Foreign Buyer Name</Label>
            <Input
              id="buyerName"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="portOfDischarge">Port of Discharge</Label>
              <Input
                id="portOfDischarge"
                value={portOfDischarge}
                onChange={(e) => setPortOfDischarge(e.target.value)}
                placeholder="e.g. NLRTM / Rotterdam"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="countryOfDestination">Country of Destination</Label>
              <Input
                id="countryOfDestination"
                value={countryOfDestination}
                onChange={(e) => setCountryOfDestination(e.target.value)}
                placeholder="e.g. Netherlands"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Statutory Amendment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
