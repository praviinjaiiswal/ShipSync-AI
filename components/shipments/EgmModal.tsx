"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Anchor, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EgmModalProps {
  shipmentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EgmModal({ shipmentId, isOpen, onClose }: EgmModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [egmNumber, setEgmNumber] = useState("");
  const [rotationNumber, setRotationNumber] = useState("");
  const [shippingLineCode, setShippingLineCode] = useState("");
  const [sailingDate, setSailingDate] = useState(new Date().toISOString().slice(0, 16));

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/shipments/${shipmentId}/egm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          egmNumber,
          rotationNumber,
          shippingLineCode,
          sailingDate: new Date(sailingDate).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.message || "Failed to file Export General Manifest");
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
            <Anchor className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-semibold text-foreground">File Export General Manifest (EGM)</h3>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="egmNumber">EGM Number *</Label>
              <Input
                id="egmNumber"
                value={egmNumber}
                onChange={(e) => setEgmNumber(e.target.value)}
                placeholder="e.g. EGM-2026-9081"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rotationNumber">Vessel Rotation No. *</Label>
              <Input
                id="rotationNumber"
                value={rotationNumber}
                onChange={(e) => setRotationNumber(e.target.value)}
                placeholder="e.g. ROT/2026/0491"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="shippingLineCode">Carrier / Shipping Line *</Label>
              <Input
                id="shippingLineCode"
                value={shippingLineCode}
                onChange={(e) => setShippingLineCode(e.target.value)}
                placeholder="e.g. MAEU / MSC / CMA-CGM"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sailingDate">Vessel Sailing Date *</Label>
              <Input
                id="sailingDate"
                type="datetime-local"
                value={sailingDate}
                onChange={(e) => setSailingDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
              Customs Scroll Trigger
            </div>
            <p>
              Once EGM is filed by the carrier/CHA, customs verifies physical shipment departure and
              triggers automated <strong>Drawback / RoDTEP scroll generation</strong>.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              File EGM & Transition to Shipped
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
