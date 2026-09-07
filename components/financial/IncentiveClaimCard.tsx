"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import {
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Send,
  Award,
  FileCheck,
} from "lucide-react";
import { fetcher } from "@/lib/api-client";

interface IncentiveClaim {
  id: string;
  scheme: "RODTEP" | "DRAWBACK";
  claimedAmount: number;
  sanctionedAmount: number | null;
  status: "DRAFT" | "FILED" | "SANCTIONED" | "CREDITED" | "REJECTED";
  scrollNumber: string | null;
  scrollDate: string | null;
  filingDate: string | null;
  sanctionDate: string | null;
  creditDate: string | null;
  bankAccountRef: string | null;
  remarks: string | null;
  recordedBy: string;
  recorder?: { name: string; email: string };
  sanctioner?: { name: string; email: string };
  createdAt: string;
}

interface IncentiveClaimCardProps {
  shipmentId: string;
  shipmentStatus: string;
  calculatedIncentives?: {
    rodtepAmount: number;
    drawbackAmount: number;
  };
  userRole?: string;
}

export function IncentiveClaimCard({
  shipmentId,
  shipmentStatus,
  calculatedIncentives,
  userRole = "OPS_EXECUTIVE",
}: IncentiveClaimCardProps) {
  const { data, mutate } = useSWR<{ success: boolean; claims: IncentiveClaim[] }>(
    `/api/financial/incentive-claims?shipmentId=${shipmentId}`,
    fetcher
  );

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSanctionModalOpen, setIsSanctionModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<IncentiveClaim | null>(null);

  // Create Form State
  const [scheme, setScheme] = useState<"RODTEP" | "DRAWBACK">("RODTEP");
  const [claimedAmount, setClaimedAmount] = useState<string>("");

  // Sanction Form State
  const [sanctionedAmount, setSanctionedAmount] = useState<string>("");
  const [scrollNumber, setScrollNumber] = useState("");
  const [sanctionStatus, setSanctionStatus] = useState<"SANCTIONED" | "CREDITED">("SANCTIONED");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const claims = data?.claims || [];
  const canSanction = ["OWNER", "ADMIN"].includes(userRole);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/financial/incentive-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipmentId,
          scheme,
          claimedAmount: parseFloat(claimedAmount) || 0,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to create claim");
      }

      setIsCreateModalOpen(false);
      setClaimedAmount("");
      mutate();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClaim = async (claimId: string) => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/financial/incentive-claims/${claimId}/file`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Statutory filing submitted via DGFT/ICEGATE" }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to file claim");
      }

      mutate();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSanctionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/financial/incentive-claims/${selectedClaim.id}/sanction`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sanctionedAmount: parseFloat(sanctionedAmount) || 0,
          scrollNumber: scrollNumber.trim(),
          status: sanctionStatus,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to sanction claim");
      }

      setIsSanctionModalOpen(false);
      setSelectedClaim(null);
      setScrollNumber("");
      setSanctionedAmount("");
      mutate();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CREDITED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            Credited to Bank
          </span>
        );
      case "SANCTIONED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
            <Award className="h-3 w-3" />
            Scroll Sanctioned
          </span>
        );
      case "FILED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 border border-purple-500/20">
            <Send className="h-3 w-3" />
            Filed with Customs
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 border border-slate-500/20">
            <Clock className="h-3 w-3" />
            Draft Claim
          </span>
        );
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Statutory Incentive Claims (RoDTEP & Duty Drawback)
            </h3>
            <p className="text-xs text-muted-foreground">
              Gated by export shipping status, non-overdue BRC realization, and verified documentation
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setClaimedAmount(
              scheme === "RODTEP"
                ? (calculatedIncentives?.rodtepAmount || 0).toString()
                : (calculatedIncentives?.drawbackAmount || 0).toString()
            );
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          New Claim
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg text-xs bg-rose-500/10 text-rose-600 border border-rose-500/20">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Claims List */}
      {claims.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-border rounded-lg text-xs text-muted-foreground">
          No incentive claims generated yet. Create a draft claim from calculated RoDTEP/Drawback incentives.
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => (
            <div
              key={claim.id}
              className="p-3.5 rounded-lg border border-border/80 bg-background hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(claim.status)}
                    <span className="text-xs font-bold text-foreground">
                      {claim.scheme === "RODTEP" ? "RoDTEP Scheme (FTP 2023)" : "Duty Drawback (AIR)"}
                    </span>
                    {claim.scrollNumber && (
                      <span className="text-xs font-mono font-medium text-muted-foreground">
                        Scroll: {claim.scrollNumber}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Claimed: <strong className="text-foreground">₹{claim.claimedAmount.toLocaleString("en-IN")}</strong>
                    {claim.sanctionedAmount !== null && (
                      <>
                        {" • "}
                        Sanctioned: <strong className="text-emerald-600">₹{claim.sanctionedAmount.toLocaleString("en-IN")}</strong>
                      </>
                    )}
                    {" • "}
                    Created: {format(new Date(claim.createdAt), "dd MMM yyyy")}
                  </div>

                  {claim.remarks && (
                    <p className="text-xs text-muted-foreground italic">&ldquo;{claim.remarks}&rdquo;</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {claim.status === "DRAFT" && (
                    <button
                      onClick={() => handleFileClaim(claim.id)}
                      disabled={loading}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                      <Send className="h-3 w-3" />
                      File Claim
                    </button>
                  )}

                  {canSanction && (claim.status === "FILED" || claim.status === "SANCTIONED") && (
                    <button
                      onClick={() => {
                        setSelectedClaim(claim);
                        setSanctionedAmount(claim.claimedAmount.toString());
                        setIsSanctionModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-blue-600/30 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                    >
                      <Award className="h-3 w-3" />
                      Record Scroll
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h4 className="text-base font-semibold text-foreground">Create Incentive Claim</h4>
            <p className="text-xs text-muted-foreground">
              Select statutory scheme and amount to claim against this export shipment.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Scheme</label>
                <select
                  value={scheme}
                  onChange={(e) => {
                    const s = e.target.value as "RODTEP" | "DRAWBACK";
                    setScheme(s);
                    setClaimedAmount(
                      s === "RODTEP"
                        ? (calculatedIncentives?.rodtepAmount || 0).toString()
                        : (calculatedIncentives?.drawbackAmount || 0).toString()
                    );
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="RODTEP">RoDTEP (FTP 2023 Appendix 4R)</option>
                  <option value="DRAWBACK">Duty Drawback (All Industry Rates)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Claimed Amount (INR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={claimedAmount}
                  onChange={(e) => setClaimedAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Save Draft Claim"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Sanction / Credit Modal */}
      {isSanctionModalOpen && selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h4 className="text-base font-semibold text-foreground">Record Customs Sanction Scroll</h4>
            <p className="text-xs text-muted-foreground">
              Enter ICEGATE scroll number and sanctioned incentive amount.
            </p>

            <form onSubmit={handleSanctionSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  ICEGATE Scroll Number *
                </label>
                <input
                  type="text"
                  required
                  value={scrollNumber}
                  onChange={(e) => setScrollNumber(e.target.value)}
                  placeholder="e.g. SCR-2026-98124"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Sanctioned Amount (INR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={sanctionedAmount}
                  onChange={(e) => setSanctionedAmount(e.target.value)}
                  placeholder={`Claimed: ₹${selectedClaim.claimedAmount}`}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Status</label>
                <select
                  value={sanctionStatus}
                  onChange={(e) => setSanctionStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="SANCTIONED">Sanctioned (Scroll Issued)</option>
                  <option value="CREDITED">Credited to Bank Account</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSanctionModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Recording..." : "Record Sanction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
