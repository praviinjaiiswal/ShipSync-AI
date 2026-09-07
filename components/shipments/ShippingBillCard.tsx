"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Lock,
  ShieldCheck,
  Anchor,
  FileEdit,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
  Ship,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LeoModal } from "./LeoModal";
import { EgmModal } from "./EgmModal";
import { ExportAmendmentModal } from "./ExportAmendmentModal";

interface ShippingBillCardProps {
  shipment: {
    id: string;
    buyerName: string;
    value: number;
    currency: string;
    hsCode: string;
    status: string;
    isLocked: boolean;
    portOfLoading?: string | null;
    portOfDischarge?: string | null;
    buyerCountry?: string | null;
    shippingBill?: {
      id: string;
      sbNumber: string;
      createdAt: string | Date;
      fobValue: number;
      isLocked: boolean;
      leoNumber?: string | null;
      leoDate?: string | Date | null;
      leoOfficer?: string | null;
      inspectionRemarks?: string | null;
      egmNumber?: string | null;
      egmDate?: string | Date | null;
      rotationNumber?: string | null;
      shippingLineCode?: string | null;
      containerNumbers: string[];
      sealNumbers: string[];
      totalIncentiveAmount: number;
      incentiveStatus: string;
    } | null;
    amendments?: Array<{
      id: string;
      version: number | string;
      reason: string;
      previousData: any;
      newData: any;
      createdAt: string | Date;
    }>;
  };
}

export function ShippingBillCard({ shipment }: ShippingBillCardProps) {
  const router = useRouter();
  const sb = shipment.shippingBill;

  // Modals state
  const [isLeoOpen, setIsLeoOpen] = useState(false);
  const [isEgmOpen, setIsEgmOpen] = useState(false);
  const [isAmendOpen, setIsAmendOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [showAmendments, setShowAmendments] = useState(false);

  // Generate form state
  const [portOfLoading, setPortOfLoading] = useState(shipment.portOfLoading || "INNSA1 - Nhava Sheva");
  const [portOfDischarge, setPortOfDischarge] = useState(shipment.portOfDischarge || "");
  const [countryOfDestination, setCountryOfDestination] = useState(shipment.buyerCountry || "");
  const [containerNumber, setContainerNumber] = useState("");
  const [sealNumber, setSealNumber] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setGenerateError(null);

    try {
      const res = await fetch(`/api/shipments/${shipment.id}/shipping-bill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portOfLoading,
          portOfDischarge,
          countryOfDestination,
          containerNumbers: containerNumber ? [containerNumber] : [],
          sealNumbers: sealNumber ? [sealNumber] : [],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.message || "Failed to generate Shipping Bill");
      }

      setIsGenerateOpen(false);
      router.refresh();
    } catch (err: any) {
      setGenerateError(err.message || "Error generating Shipping Bill");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="border border-border rounded-xl p-5 bg-card space-y-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Customs Shipping Bill & Manifest</h2>
            <p className="text-xs text-muted-foreground">Export EDI Filing under Section 50/149</p>
          </div>
        </div>

        {sb?.isLocked && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">
            <Lock className="w-3 h-3" />
            <span>FOB Value Locked</span>
          </div>
        )}
      </div>

      {!sb ? (
        /* Unfiled State: CTA to Generate Shipping Bill */
        <div className="space-y-4">
          <div className="p-4 bg-muted/40 rounded-lg border border-dashed border-border text-center space-y-2">
            <Ship className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              No official Customs Shipping Bill has been generated yet for this export consignment.
              Filing locks commercial values and triggers RoDTEP/Drawback entitlement.
            </p>
            {!isGenerateOpen && (
              <Button
                onClick={() => setIsGenerateOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs mt-2"
              >
                Generate Shipping Bill
              </Button>
            )}
          </div>

          {isGenerateOpen && (
            <form onSubmit={handleGenerate} className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
              <h3 className="text-xs font-semibold text-foreground">Statutory Filing Parameters</h3>
              {generateError && (
                <p className="text-xs text-destructive p-2 bg-destructive/10 rounded">{generateError}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="pol" className="text-xs">Port of Loading *</Label>
                  <Input
                    id="pol"
                    value={portOfLoading}
                    onChange={(e) => setPortOfLoading(e.target.value)}
                    required
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pod" className="text-xs">Port of Discharge *</Label>
                  <Input
                    id="pod"
                    value={portOfDischarge}
                    onChange={(e) => setPortOfDischarge(e.target.value)}
                    placeholder="e.g. NLRTM / Rotterdam"
                    required
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dest" className="text-xs">Country of Destination *</Label>
                  <Input
                    id="dest"
                    value={countryOfDestination}
                    onChange={(e) => setCountryOfDestination(e.target.value)}
                    placeholder="e.g. Netherlands"
                    required
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="container" className="text-xs">Container No. (Optional)</Label>
                  <Input
                    id="container"
                    value={containerNumber}
                    onChange={(e) => setContainerNumber(e.target.value)}
                    placeholder="e.g. MSCU1234567"
                    className="text-xs h-8"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsGenerateOpen(false)}
                  disabled={generating}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={generating}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                >
                  {generating && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                  Confirm & Generate Number
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : (
        /* Filed State */
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-muted/40 rounded-lg">
              <span className="text-muted-foreground block text-[11px]">Shipping Bill Number</span>
              <span className="font-mono font-bold text-foreground text-sm">{sb.sbNumber}</span>
            </div>
            <div className="p-3 bg-muted/40 rounded-lg">
              <span className="text-muted-foreground block text-[11px]">Declared FOB Value</span>
              <span className="font-semibold text-foreground text-sm">
                {shipment.currency} {sb.fobValue.toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-muted/40 rounded-lg">
              <span className="text-muted-foreground block text-[11px]">Port of Loading</span>
              <span className="font-medium text-foreground">{shipment.portOfLoading || "—"}</span>
            </div>
            <div className="p-3 bg-muted/40 rounded-lg">
              <span className="text-muted-foreground block text-[11px]">Destination</span>
              <span className="font-medium text-foreground">
                {shipment.portOfDischarge ? `${shipment.portOfDischarge}, ` : ""}{shipment.buyerCountry || "—"}
              </span>
            </div>
          </div>

          {/* Milestone Status Grid: LEO & EGM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* LEO Box */}
            <div className="p-3.5 border border-border rounded-lg bg-card space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Let Export Order (LEO)</span>
                </div>
                {sb.leoNumber ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Granted
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Pending
                  </span>
                )}
              </div>

              {sb.leoNumber ? (
                <div className="text-xs space-y-1 text-muted-foreground pt-1">
                  <p>Ref: <strong className="text-foreground font-mono">{sb.leoNumber}</strong></p>
                  <p>Officer: <span className="text-foreground">{sb.leoOfficer}</span></p>
                  {sb.leoDate && (
                    <p>Date: <span className="text-foreground">{new Date(sb.leoDate).toLocaleDateString()}</span></p>
                  )}
                </div>
              ) : (
                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsLeoOpen(true)}
                    className="w-full text-xs h-7 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                  >
                    Record LEO Clearance
                  </Button>
                </div>
              )}
            </div>

            {/* EGM Box */}
            <div className="p-3.5 border border-border rounded-lg bg-card space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Anchor className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Export General Manifest (EGM)</span>
                </div>
                {sb.egmNumber ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    Filed
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">
                    Awaiting Sailing
                  </span>
                )}
              </div>

              {sb.egmNumber ? (
                <div className="text-xs space-y-1 text-muted-foreground pt-1">
                  <p>EGM: <strong className="text-foreground font-mono">{sb.egmNumber}</strong></p>
                  <p>Rotation: <span className="text-foreground">{sb.rotationNumber}</span> ({sb.shippingLineCode})</p>
                  {sb.egmDate && (
                    <p>Sailing Date: <span className="text-foreground">{new Date(sb.egmDate).toLocaleDateString()}</span></p>
                  )}
                </div>
              ) : (
                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEgmOpen(true)}
                    disabled={!sb.leoNumber}
                    className="w-full text-xs h-7 border-blue-500/40 text-blue-600 hover:bg-blue-500/10 disabled:opacity-50"
                  >
                    File EGM Manifest
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Action Row: Pre-LEO Amendment */}
          {!sb.leoNumber && (
            <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
              <span className="text-muted-foreground">
                Need to adjust declared values before customs clearance?
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAmendOpen(true)}
                className="h-7 text-xs text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/10"
              >
                <FileEdit className="w-3.5 h-3.5 mr-1" />
                Amend Declared Details (Pre-LEO)
              </Button>
            </div>
          )}

          {/* Versioned Amendments Accordion */}
          {shipment.amendments && shipment.amendments.length > 0 && (
            <div className="pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowAmendments(!showAmendments)}
                className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground font-medium py-1"
              >
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Statutory Amendment History ({shipment.amendments.length})
                </span>
                {showAmendments ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showAmendments && (
                <div className="space-y-2 mt-2">
                  {shipment.amendments.map((am) => (
                    <div key={am.id} className="p-3 bg-muted/40 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">
                          {typeof am.version === "number" ? `v${am.version}` : am.version}
                        </span>
                        <span className="text-muted-foreground text-[10px]">
                          {new Date(am.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-muted-foreground italic">&ldquo;{am.reason}&rdquo;</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <LeoModal
        shipmentId={shipment.id}
        isOpen={isLeoOpen}
        onClose={() => setIsLeoOpen(false)}
      />

      <EgmModal
        shipmentId={shipment.id}
        isOpen={isEgmOpen}
        onClose={() => setIsEgmOpen(false)}
      />

      <ExportAmendmentModal
        shipmentId={shipment.id}
        initialData={{
          fobValue: sb?.fobValue || shipment.value,
          hsCode: shipment.hsCode,
          buyerName: shipment.buyerName,
          portOfDischarge: shipment.portOfDischarge,
          countryOfDestination: shipment.buyerCountry,
        }}
        isOpen={isAmendOpen}
        onClose={() => setIsAmendOpen(false)}
      />
    </div>
  );
}
