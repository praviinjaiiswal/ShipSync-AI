"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import {
  Banknote,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  ShieldCheck,
  Plus,
  History,
} from "lucide-react";
import { fetcher } from "@/lib/api-client";

interface ExportRealisation {
  id: string;
  invoiceValue: number;
  amountRealised: number;
  currency: string;
  realisationDate: string | null;
  bankReferenceNumber: string | null;
  brcDocumentUrl: string | null;
  status: "PENDING" | "PARTIALLY_REALISED" | "FULLY_REALISED" | "OVERDUE";
  overdueDate: string;
  isOverdue: boolean;
  remarks: string | null;
  recordedBy: string;
  recorder?: { name: string; email: string };
  confirmer?: { name: string; email: string };
  confirmedAt?: string;
  createdAt: string;
}

interface ExportRealisationCardProps {
  shipmentId: string;
  invoiceValue: number;
  currency: string;
  userRole?: string;
}

export function ExportRealisationCard({
  shipmentId,
  invoiceValue,
  currency,
  userRole = "OPS_EXECUTIVE",
}: ExportRealisationCardProps) {
  const { data, error, mutate } = useSWR<{ success: boolean; realisations: ExportRealisation[] }>(
    `/api/financial/realisations?shipmentId=${shipmentId}`,
    fetcher
  );

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedRealisation, setSelectedRealisation] = useState<ExportRealisation | null>(null);

  // Record Form state
  const [amountRealised, setAmountRealised] = useState<string>("");
  const [bankReference, setBankReference] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const realisations = data?.realisations || [];
  const latestRealisation = realisations[0];
  const canConfirm = ["OWNER", "ADMIN"].includes(userRole);

  const totalRealised = realisations.reduce((acc, r) => acc + (r.amountRealised || 0), 0);
  const percentageRealised = invoiceValue > 0 ? Math.min(100, Math.round((totalRealised / invoiceValue) * 100)) : 0;

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);

    try {
      const res = await fetch("/api/financial/realisations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipmentId,
          amountRealised: parseFloat(amountRealised) || 0,
          bankReferenceNumber: bankReference.trim() || undefined,
          remarks: remarks.trim() || undefined,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to record export realization");
      }

      setIsRecordModalOpen(false);
      setAmountRealised("");
      setBankReference("");
      setRemarks("");
      mutate();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSubmit = async (status: "PARTIALLY_REALISED" | "FULLY_REALISED") => {
    if (!selectedRealisation) return;
    setLoading(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/financial/realisations/${selectedRealisation.id}/confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          remarks: "Statutory BRC approved by authorized personnel",
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to confirm realization");
      }

      setIsConfirmModalOpen(false);
      setSelectedRealisation(null);
      mutate();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, isOverdue: boolean) => {
    if (isOverdue || status === "OVERDUE") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <AlertTriangle className="h-3 w-3" />
          RBI Overdue (9 Months)
        </span>
      );
    }
    switch (status) {
      case "FULLY_REALISED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            Fully Realised
          </span>
        );
      case "PARTIALLY_REALISED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3" />
            Partially Realised
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <Clock className="h-3 w-3" />
            Pending BRC
          </span>
        );
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Banknote className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Bank Realisation Certificate (BRC) & Inward Remittance
            </h3>
            <p className="text-xs text-muted-foreground">
              Statutory 9-month export realization compliance under RBI FEMA regulations
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsRecordModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          Record BRC / Remittance
        </button>
      </div>

      {/* Realization Progress */}
      <div className="bg-muted/40 rounded-lg p-4 mb-4 border border-border/60">
        <div className="flex items-center justify-between mb-2 text-xs font-medium">
          <span className="text-muted-foreground">Realisation Progress</span>
          <span className="text-foreground">
            {currency} {totalRealised.toLocaleString("en-IN")} of {currency} {invoiceValue.toLocaleString("en-IN")} ({percentageRealised}%)
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              percentageRealised >= 100
                ? "bg-emerald-500"
                : percentageRealised > 0
                ? "bg-amber-500"
                : "bg-slate-300 dark:bg-slate-700"
            }`}
            style={{ width: `${percentageRealised}%` }}
          />
        </div>
      </div>

      {/* Realisations List */}
      {realisations.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-border rounded-lg text-xs text-muted-foreground">
          No foreign exchange realization recorded yet. BRC is required for claiming RoDTEP/Drawback incentives.
        </div>
      ) : (
        <div className="space-y-3">
          {realisations.map((realisation) => (
            <div
              key={realisation.id}
              className="flex items-center justify-between p-3.5 rounded-lg border border-border/80 bg-background hover:bg-muted/30 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getStatusBadge(realisation.status, realisation.isOverdue)}
                  {realisation.bankReferenceNumber && (
                    <span className="text-xs font-mono font-medium text-foreground">
                      Ref: {realisation.bankReferenceNumber}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Realised: <strong className="text-foreground">{realisation.currency} {realisation.amountRealised.toLocaleString("en-IN")}</strong>
                  {" • "}
                  Recorded by: {realisation.recorder?.name || realisation.recorder?.email || "Team Member"}
                  {" • "}
                  Due date: {format(new Date(realisation.overdueDate), "dd MMM yyyy")}
                </div>
                {realisation.remarks && (
                  <p className="text-xs text-muted-foreground italic">&ldquo;{realisation.remarks}&rdquo;</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {canConfirm && realisation.status !== "FULLY_REALISED" && (
                  <button
                    onClick={() => {
                      setSelectedRealisation(realisation);
                      setIsConfirmModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded text-xs font-medium border border-emerald-600/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                  >
                    Confirm BRC
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h4 className="text-base font-semibold text-foreground">Record Export Realisation / BRC</h4>
            <p className="text-xs text-muted-foreground">
              Log foreign currency payment received via Authorized Dealer (AD) bank.
            </p>

            {formError && (
              <div className="p-2.5 rounded text-xs bg-destructive/10 text-destructive border border-destructive/20">
                {formError}
              </div>
            )}

            <form onSubmit={handleRecordSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Amount Realised ({currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amountRealised}
                  onChange={(e) => setAmountRealised(e.target.value)}
                  placeholder={`e.g. ${invoiceValue}`}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Bank Reference Number (e-BRC / IRM / FIRC)
                </label>
                <input
                  type="text"
                  value={bankReference}
                  onChange={(e) => setBankReference(e.target.value)}
                  placeholder="e.g. HDFC-BRC-2026-98124"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Remarks / Inward Remittance Notes
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. 100% advance TT received via AD Code 0510012"
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? "Recording..." : "Save Realisation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal (Role-Restricted) */}
      {isConfirmModalOpen && selectedRealisation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h4 className="text-base font-semibold text-foreground">Confirm Export Realisation (Admin Approval)</h4>
            <p className="text-xs text-muted-foreground">
              Authorize this realization as certified by the AD Bank. This unlocks incentive claiming under FTP 2023.
            </p>

            <div className="p-3 rounded-lg bg-muted text-xs space-y-1">
              <div>Ref: <strong className="text-foreground">{selectedRealisation.bankReferenceNumber || "N/A"}</strong></div>
              <div>Amount: <strong className="text-foreground">{selectedRealisation.currency} {selectedRealisation.amountRealised.toLocaleString("en-IN")}</strong></div>
              <div>Invoice Value: <strong className="text-foreground">{currency} {invoiceValue.toLocaleString("en-IN")}</strong></div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleConfirmSubmit("PARTIALLY_REALISED")}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-amber-500/30 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 disabled:opacity-50"
              >
                Approve as Partial
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleConfirmSubmit("FULLY_REALISED")}
                className="px-4 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? "Confirming..." : "Approve as Fully Realised"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
