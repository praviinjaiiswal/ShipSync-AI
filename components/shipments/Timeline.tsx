import { Check } from "lucide-react";

const STEPS = [
  "DRAFT",
  "DOCUMENTS_READY",
  "UNDER_REVIEW",
  "SHIPPING_BILL_GENERATED",
  "CUSTOMS_CLEARED",
  "GATE_IN",
  "SHIPPED",
  "DELIVERED",
];

const STEP_LABELS: Record<string, string> = {
  DRAFT: "Draft Created",
  DOCUMENTS_READY: "Docs Ready",
  UNDER_REVIEW: "Review",
  SHIPPING_BILL_GENERATED: "Shipping Bill Filed",
  CUSTOMS_CLEARED: "LEO Granted",
  GATE_IN: "Port Gate-In",
  CLEARED: "LEO Granted",
  SHIPPED: "EGM Filed / Shipped",
  DELIVERED: "Delivered",
};

export function Timeline({ currentStatus }: { currentStatus: string }) {
  const normalizedStatus = currentStatus === "CLEARED" ? "CUSTOMS_CLEARED" : currentStatus;
  const currentIndex = STEPS.indexOf(normalizedStatus);

  return (
    <div className="space-y-0">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isLast = i === STEPS.length - 1;

        return (
          <div key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  isDone
                    ? "bg-brand-orange text-brand-orange-foreground"
                    : isCurrent
                    ? "border-2 border-brand-orange bg-background"
                    : "border-2 border-border bg-background"
                }`}
              >
                {isDone && <Check className="w-3.5 h-3.5" />}
                {isCurrent && <div className="w-2 h-2 rounded-full bg-brand-orange" />}
              </div>
              {!isLast && (
                <div className={`w-0.5 flex-1 min-h-6 ${isDone ? "bg-brand-orange" : "bg-border"}`} />
              )}
            </div>
            <div className="pb-6">
              <p className={`text-sm font-medium ${isCurrent ? "text-brand-orange" : "text-foreground"}`}>
                {STEP_LABELS[step]}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}