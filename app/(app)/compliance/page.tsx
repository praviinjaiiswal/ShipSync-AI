"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { StatusBadge } from "@/components/shipments/StatusBadge";

type ShipmentOverview = {
  id: string;
  buyerName: string;
  status: string;
  complianceScore: number | null;
  sanctionsCheck: { matchFound: boolean } | null;
  riskReport: { countryRiskScore: number; buyerRiskScore: number } | null;
};

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-muted-foreground">Not checked</span>;
  const color =
    score >= 70
      ? "text-emerald-600 dark:text-emerald-400"
      : score >= 40
      ? "text-amber-600 dark:text-amber-400"
      : "text-destructive";
  return <span className={`text-sm font-semibold ${color}`}>{score}/100</span>;
}

export default function ComplianceOverviewPage() {
  const [shipments, setShipments] = useState<ShipmentOverview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/compliance-overview")
      .then((res) => res.json())
      .then(setShipments)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Compliance Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Saari shipments ka compliance, sanctions aur risk status</p>
      </div>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted rounded-md animate-pulse" />
          ))}
        </div>
      )}

      {!loading && shipments.length === 0 && (
        <div className="border border-border rounded-lg p-10 text-center text-sm text-muted-foreground">
          Abhi koi shipment nahi hai.
        </div>
      )}

      {!loading && shipments.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="text-left font-medium px-4 py-3">Buyer</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3">Compliance Score</th>
                <th className="text-left font-medium px-4 py-3">Sanctions</th>
                <th className="text-left font-medium px-4 py-3">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shipments.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link href={`/shipments/${s.id}`} className="text-foreground font-medium hover:text-brand-orange">
                      {s.buyerName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBadge score={s.complianceScore} />
                  </td>
                  <td className="px-4 py-3">
                    {s.sanctionsCheck === null ? (
                      <span className="text-xs text-muted-foreground">Not checked</span>
                    ) : s.sanctionsCheck.matchFound ? (
                      <span className="flex items-center gap-1 text-xs text-destructive font-medium">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Match found
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Clear
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {s.riskReport
                      ? `Country: ${s.riskReport.countryRiskScore} · Buyer: ${s.riskReport.buyerRiskScore}`
                      : "Not assessed"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}