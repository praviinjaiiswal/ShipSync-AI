"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LeoModalProps {
  shipmentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function LeoModal({ shipmentId, isOpen, onClose }: LeoModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [leoNumber, setLeoNumber] = useState("");
  const [leoDate, setLeoDate] = useState(new Date().toISOString().slice(0, 16));
  const [leoOfficer, setLeoOfficer] = useState("");
  const [inspectionRemarks, setInspectionRemarks] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/shipments/${shipmentId}/leo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leoNumber,
          leoDate: new Date(leoDate).toISOString(),
          leoOfficer,
          inspectionRemarks: inspectionRemarks || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.message || "Failed to record Let Export Order");
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
      <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-semibold text-foreground">Record Let Export Order (LEO)</h3>
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

          <div className="space-y-1.5">
            <Label htmlFor="leoNumber">LEO Reference Number *</Label>
            <Input
              id="leoNumber"
              value={leoNumber}
              onChange={(e) => setLeoNumber(e.target.value)}
              placeholder="e.g. LEO/2026/INNSA1/98765"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="leoDate">LEO Grant Date & Time *</Label>
              <Input
                id="leoDate"
                type="datetime-local"
                value={leoDate}
                onChange={(e) => setLeoDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="leoOfficer">Customs Appraiser / Officer *</Label>
              <Input
                id="leoOfficer"
                value={leoOfficer}
                onChange={(e) => setLeoOfficer(e.target.value)}
                placeholder="e.g. Officer R. Sharma (ID: CUST-442)"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="remarks">Customs Examination Remarks</Label>
            <Input
              id="remarks"
              value={inspectionRemarks}
              onChange={(e) => setInspectionRemarks(e.target.value)}
              placeholder="e.g. 100% seal verified intact, RMS direct clearance"
            />
          </div>

          <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Statutory Effect
            </div>
            <p>
              Granting LEO updates shipment milestone to <strong>CUSTOMS_CLEARED</strong>.
              Subsequent amendments require formal Section 149 customs approval.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Issue Let Export Order
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
