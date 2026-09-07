"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  ShieldCheck,
  Receipt,
} from "lucide-react";
import { fetcher } from "@/lib/api-client";

interface DutyPayment {
  id: string;
  challanNumber: string;
  amountPaid: number;
  calculatedDuty: number;
  paymentDate: string;
  paymentReference: string | null;
  paymentMode: string;
  status: "PENDING" | "VERIFIED" | "MISMATCH" | "REJECTED";
  discrepancyReason: string | null;
  receiptDocumentUrl: string | null;
  recordedBy: string;
  recorder?: { name: string; email: string };
  confirmer?: { name: string; email: string };
  billOfEntry?: { beNumber: string; totalDutyPayable: number; paymentStatus: string };
  createdAt: string;
}

interface DutyPaymentCardProps {
  importShipmentId: string;
  billOfEntry?: {
    id: string;
    beNumber: string;
    totalDutyPayable: number;
    paymentStatus: string;
  } | null;
  userRole?: string;
}

export function DutyPaymentCard({
  importShipmentId,
  billOfEntry,
  userRole = "OPS_EXECUTIVE",
}: DutyPaymentCardProps) {
  const { data, mutate } = useSWR<{ success: boolean; payments: DutyPayment[] }>(
    `/api/financial/duty-payments?importShipmentId=${importShipmentId}`,
    fetcher
  );

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<DutyPayment | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Form State
  const [challanNumber, setChallanNumber] = useState("");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentMode, setPaymentMode] = useState("ICEGATE_E_PAYMENT");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const payments = data?.payments || [];
  const canConfirm = ["OWNER", "ADMIN"].includes(userRole);
  const calculatedDuty = billOfEntry?.totalDutyPayable || 0;

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);

    try {
      const res = await fetch("/api/financial/duty-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          importShipmentId,
          challanNumber: challanNumber.trim(),
          amountPaid: parseFloat(amountPaid) || 0,
          paymentReference: paymentRef.trim() || undefined,
          paymentMode,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to record duty payment");
      }

      setIsRecordModalOpen(false);
      setChallanNumber("");
      setAmountPaid("");
      setPaymentRef("");
      mutate();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSubmit = async (confirmAction: "CONFIRM" | "REJECT") => {
    if (!selectedPayment) return;
    setLoading(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/financial/duty-payments/${selectedPayment.id}/confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmAction,
          notes: confirmAction === "CONFIRM" ? "Payment verified against ICEGATE e-challan scroll" : "Challan rejected due to discrepancy",
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to confirm duty payment");
      }

      setIsConfirmModalOpen(false);
      setSelectedPayment(null);
      mutate();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            Duty Paid & Verified
          </span>
        );
      case "MISMATCH":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertTriangle className="h-3 w-3" />
            Duty Mismatch
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3" />
            Awaiting Admin Verification
          </span>
        );
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Customs Duty Payment & ICEGATE E-Challan
            </h3>
            <p className="text-xs text-muted-foreground">
              Statutory duty reconciliation for Bill of Entry {billOfEntry?.beNumber || "N/A"}
            </p>
          </div>
        </div>

        {billOfEntry && (
          <button
            onClick={() => {
              setAmountPaid(calculatedDuty.toString());
              setIsRecordModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Record Challan Payment
          </button>
        )}
      </div>

      {/* Calculated Statutory Duty Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="p-3.5 rounded-lg bg-muted/40 border border-border/70">
          <div className="text-xs text-muted-foreground">Assessed Statutory Duty (BoE)</div>
          <div className="text-lg font-bold text-foreground">
            ₹{calculatedDuty.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Status: <strong className="text-foreground">{billOfEntry?.paymentStatus || "PENDING"}</strong>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-muted/40 border border-border/70">
          <div className="text-xs text-muted-foreground">Total Duty Paid</div>
          <div className="text-lg font-bold text-foreground">
            ₹{payments.filter((p) => p.status === "VERIFIED").reduce((sum, p) => sum + p.amountPaid, 0).toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Decoupled from SaaS billing • ICEGATE Treasury Receipt
          </div>
        </div>
      </div>

      {/* Payment Records */}
      {payments.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-border rounded-lg text-xs text-muted-foreground">
          No customs duty payment recorded yet. Record the ICEGATE e-challan to advance status to DUTY_PAID.
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className={`p-3.5 rounded-lg border transition-colors ${
                payment.status === "MISMATCH"
                  ? "border-rose-500/40 bg-rose-500/5"
                  : "border-border/80 bg-background hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(payment.status)}
                    <span className="text-xs font-mono font-bold text-foreground">
                      Challan #{payment.challanNumber}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({payment.paymentMode})
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Amount Paid: <strong className="text-foreground">₹{payment.amountPaid.toLocaleString("en-IN")}</strong>
                    {" • "}
                    Recorded by: {payment.recorder?.name || "Team Member"}
                    {" • "}
                    Date: {format(new Date(payment.paymentDate), "dd MMM yyyy")}
                  </div>

                  {payment.paymentReference && (
                    <div className="text-xs text-muted-foreground font-mono">
                      Bank Ref/UTR: {payment.paymentReference}
                    </div>
                  )}

                  {payment.discrepancyReason && (
                    <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                      ⚠️ {payment.discrepancyReason}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {canConfirm && payment.status !== "VERIFIED" && payment.status !== "REJECTED" && (
                    <button
                      onClick={() => {
                        setSelectedPayment(payment);
                        setIsConfirmModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded text-xs font-medium border border-blue-600/30 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                    >
                      Verify Payment
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record Challan Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h4 className="text-base font-semibold text-foreground">Record Customs Duty Payment</h4>
            <p className="text-xs text-muted-foreground">
              Enter ICEGATE e-challan details. Amount will be validated server-side against ₹{calculatedDuty.toLocaleString("en-IN")}.
            </p>

            {formError && (
              <div className="p-2.5 rounded text-xs bg-destructive/10 text-destructive border border-destructive/20">
                {formError}
              </div>
            )}

            <form onSubmit={handleRecordSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  ICEGATE Challan Number *
                </label>
                <input
                  type="text"
                  required
                  value={challanNumber}
                  onChange={(e) => setChallanNumber(e.target.value)}
                  placeholder="e.g. 20261009823412"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Amount Paid (INR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder={`Calculated: ₹${calculatedDuty}`}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="ICEGATE_E_PAYMENT">ICEGATE E-Payment</option>
                  <option value="NEFT_RTGS">NEFT / RTGS</option>
                  <option value="NET_BANKING">Authorized Net Banking</option>
                  <option value="OTHER">Other Statutory Gateway</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Bank Transaction Reference / UTR
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. SBIN0001239871"
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
                  {loading ? "Validating..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify Modal */}
      {isConfirmModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h4 className="text-base font-semibold text-foreground">Verify Customs Duty Payment (Admin Confirmation)</h4>
            <p className="text-xs text-muted-foreground">
              Confirming this payment will mark Bill of Entry duty as PAID and update shipment status to DUTY_PAID.
            </p>

            <div className="p-3 rounded-lg bg-muted text-xs space-y-1">
              <div>Challan: <strong className="text-foreground">{selectedPayment.challanNumber}</strong></div>
              <div>Amount Paid: <strong className="text-foreground">₹{selectedPayment.amountPaid.toLocaleString("en-IN")}</strong></div>
              <div>Calculated Duty: <strong className="text-foreground">₹{selectedPayment.calculatedDuty.toLocaleString("en-IN")}</strong></div>
              {selectedPayment.discrepancyReason && (
                <div className="text-rose-600 font-semibold">{selectedPayment.discrepancyReason}</div>
              )}
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
                onClick={() => handleConfirmSubmit("REJECT")}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-rose-500/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-50"
              >
                Reject Challan
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleConfirmSubmit("CONFIRM")}
                className="px-4 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Mark Paid"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
