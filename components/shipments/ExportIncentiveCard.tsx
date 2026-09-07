"use client";

import { useState, useEffect } from "react";
import { IndianRupee, TrendingUp, AlertCircle, CheckCircle2, ShieldCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportIncentiveCardProps {
  shipmentId: string;
  hsCode: string;
  fobValue: number;
  currency: string;
  shippingBill?: {
    rodtepRate: number | null;
    rodtepAmount: number | null;
    drawbackRate: number | null;
    drawbackAmount: number | null;
    exportDutyRate: number | null;
    exportDutyAmount: number | null;
    totalIncentiveAmount: number | null;
    incentiveStatus: string;
  } | null;
}

export function ExportIncentiveCard({
  shipmentId,
  hsCode,
  fobValue,
  currency,
  shippingBill,
}: ExportIncentiveCardProps) {
  const [data, setData] = useState<{
    rodtepRate: number;
    rodtepAmount: number;
    rodtepCapPerUnit?: number | null;
    isRoDTEPCapped: boolean;
    drawbackRate: number;
    drawbackAmount: number;
    exportDutyRate: number;
    exportDutyAmount: number;
    totalIncentiveAmount: number;
    sourceNotification: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIncentives = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/incentives`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to load incentives");
      setData(json.breakdown);
    } catch (err: any) {
      setError(err.message || "Could not fetch incentive rates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncentives();
  }, [shipmentId, hsCode, fobValue]);

  const rodtepRatePct = data ? (data.rodtepRate * 100).toFixed(2) : (shippingBill?.rodtepRate ? (shippingBill.rodtepRate * 100).toFixed(2) : "0.00");
  const rodtepAmt = data ? data.rodtepAmount : (shippingBill?.rodtepAmount ?? 0);

  const dbkRatePct = data ? (data.drawbackRate * 100).toFixed(2) : (shippingBill?.drawbackRate ? (shippingBill.drawbackRate * 100).toFixed(2) : "0.00");
  const dbkAmt = data ? data.drawbackAmount : (shippingBill?.drawbackAmount ?? 0);

  const exportDutyRatePct = data ? (data.exportDutyRate * 100).toFixed(2) : (shippingBill?.exportDutyRate ? (shippingBill.exportDutyRate * 100).toFixed(2) : "0.00");
  const exportDutyAmt = data ? data.exportDutyAmount : (shippingBill?.exportDutyAmount ?? 0);

  const totalIncentive = data ? data.totalIncentiveAmount : (shippingBill?.totalIncentiveAmount ?? (rodtepAmt + dbkAmt - exportDutyAmt));
  const incentiveStatus = shippingBill?.incentiveStatus || "CALCULATED";

  return (
    <div className="border border-border rounded-xl p-5 bg-card space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-semibold text-foreground">Export Incentive Realization Engine</h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
              incentiveStatus === "SCROLL_GENERATED" || incentiveStatus === "CREDITED"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
            }`}
          >
            {incentiveStatus === "SCROLL_GENERATED" ? "Customs Scroll Ready" : incentiveStatus}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchIncentives}
            disabled={loading}
            className="h-7 w-7 p-0"
            title="Refresh Incentive Rates"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 text-xs text-destructive p-3 bg-destructive/10 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* RoDTEP */}
            <div className="p-3 bg-muted/40 rounded-lg space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>RoDTEP Scheme</span>
                <span className="font-semibold text-foreground">{rodtepRatePct}%</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold text-foreground">
                  ₹{rodtepAmt.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
              {data?.isRoDTEPCapped && (
                <p className="text-[10px] text-amber-600 font-medium">
                  Unit cap applied: ₹{data.rodtepCapPerUnit}/unit
                </p>
              )}
            </div>

            {/* Duty Drawback */}
            <div className="p-3 bg-muted/40 rounded-lg space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Duty Drawback (AIR)</span>
                <span className="font-semibold text-foreground">{dbkRatePct}%</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold text-foreground">
                  ₹{dbkAmt.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">Customs AIR Schedule</p>
            </div>

            {/* Net Realization */}
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-1">
              <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                <span>Net Benefit</span>
                <IndianRupee className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{totalIncentive.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
              {exportDutyAmt > 0 ? (
                <p className="text-[10px] text-destructive font-medium">
                  Less Export Duty: ₹{exportDutyAmt.toLocaleString()} ({exportDutyRatePct}%)
                </p>
              ) : (
                <p className="text-[10px] text-emerald-700 dark:text-emerald-300">
                  Zero Export Duty (Exempt)
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{data?.sourceNotification || "Statutory Foreign Trade Policy (FTP 2023)"}</span>
            </div>
            <span>FOB Base: {currency} {fobValue.toLocaleString()}</span>
          </div>
        </>
      )}
    </div>
  );
}
