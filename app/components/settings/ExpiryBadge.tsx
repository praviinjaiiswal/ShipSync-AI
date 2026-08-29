function daysUntil(date: string) {
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function ExpiryBadge({ expiryDate }: { expiryDate: string }) {
  const days = daysUntil(expiryDate);

  let label = "Valid";
  let style = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";

  if (days < 0) {
    label = "Expired";
    style = "bg-destructive/10 text-destructive";
  } else if (days <= 7) {
    label = `Expires in ${days}d`;
    style = "bg-destructive/10 text-destructive";
  } else if (days <= 30) {
    label = `Expires in ${days}d`;
    style = "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}