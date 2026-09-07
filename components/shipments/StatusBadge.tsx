const statusStyles: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  DOCUMENTS_READY: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  UNDER_REVIEW: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  SHIPPING_BILL_GENERATED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  CUSTOMS_CLEARED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  GATE_IN: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  CLEARED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  SHIPPED: "bg-brand-orange/10 text-brand-orange",
  DELIVERED: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  DOCUMENTS_READY: "Documents Ready",
  UNDER_REVIEW: "Under Review",
  SHIPPING_BILL_GENERATED: "SB Filed",
  CUSTOMS_CLEARED: "LEO Cleared",
  GATE_IN: "Port Gate-In",
  CLEARED: "Cleared",
  SHIPPED: "Shipped (EGM)",
  DELIVERED: "Delivered",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
        statusStyles[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}