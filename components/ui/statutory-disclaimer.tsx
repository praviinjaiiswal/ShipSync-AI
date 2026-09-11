import React from "react";
import { ShieldAlert } from "lucide-react";

export function StatutoryDisclaimer({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`pt-2 border-t border-border/60 text-[11px] text-muted-foreground flex items-start gap-1.5 leading-relaxed ${className}`}
    >
      <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500/80" />
      <span>
        <strong>Statutory Notice:</strong> ShipSync AI provides advisory assistance, not statutory or legal advice. Always verify HS codes, duty calculations, and compliance requirements with a licensed Customs House Agent (CHA) or relevant authority before filing.
      </span>
    </div>
  );
}
