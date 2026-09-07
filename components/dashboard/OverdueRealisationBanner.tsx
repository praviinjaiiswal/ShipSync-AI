"use client";

import React from "react";
import useSWR from "swr";
import Link from "next/link";
import { AlertTriangle, Clock, ArrowRight, ShieldAlert } from "lucide-react";
import { fetcher } from "@/lib/api-client";

interface BrcAlert {
  id: string;
  shipmentId: string;
  buyerName: string;
  productDesc: string;
  invoiceValue: number;
  amountRealised: number;
  outstandingAmount: number;
  currency: string;
  overdueDate: string;
  daysRemaining: number;
  urgency: "OVERDUE" | "CRITICAL" | "WARNING" | "NORMAL";
  status: string;
}

interface AlertsResponse {
  success: boolean;
  totalPending: number;
  overdueCount: number;
  criticalCount: number;
  alerts: BrcAlert[];
}

export function OverdueRealisationBanner() {
  const { data, error } = useSWR<AlertsResponse>(
    "/api/financial/realisations/alerts",
    fetcher
  );

  if (!data || data.totalPending === 0) return null;

  const { overdueCount, criticalCount, alerts } = data;
  const criticalOrOverdue = alerts.filter(
    (a) => a.urgency === "OVERDUE" || a.urgency === "CRITICAL"
  );

  if (criticalOrOverdue.length === 0) return null;

  return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              RBI Export Realisation Statutory Deadline Alert
            </h3>
            <p className="text-xs text-muted-foreground">
              {overdueCount > 0
                ? `${overdueCount} shipment(s) have EXCEEDED the statutory 9-month export realization deadline.`
                : `${criticalCount} shipment(s) are within 30 days of the RBI 9-month deadline.`}
              {" Un-realized shipments block RoDTEP and Duty Drawback incentive claims."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {overdueCount > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600 text-white">
              {overdueCount} Overdue
            </span>
          )}
          {criticalCount > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              {criticalCount} Critical (&lt;30d)
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-border/60 bg-background/80 rounded-lg border border-border/80 overflow-hidden">
        {criticalOrOverdue.slice(0, 3).map((alert) => (
          <div
            key={alert.id}
            className="flex items-center justify-between p-3 text-xs hover:bg-muted/40 transition-colors"
          >
            <div className="space-y-0.5">
              <div className="font-semibold text-foreground">
                {alert.buyerName} — {alert.productDesc}
              </div>
              <div className="text-muted-foreground">
                Outstanding: <strong className="text-foreground">{alert.currency} {alert.outstandingAmount.toLocaleString("en-IN")}</strong>
                {" • "}
                {alert.urgency === "OVERDUE" ? (
                  <span className="text-rose-600 font-semibold">
                    Overdue by {Math.abs(alert.daysRemaining)} days
                  </span>
                ) : (
                  <span className="text-amber-600 font-semibold">
                    {alert.daysRemaining} days remaining
                  </span>
                )}
              </div>
            </div>

            <Link
              href={`/shipments/${alert.shipmentId}`}
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              Resolve BRC <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
