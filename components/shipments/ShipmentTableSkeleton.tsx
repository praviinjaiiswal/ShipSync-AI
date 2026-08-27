export function ShipmentTableSkeleton() {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="divide-y divide-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-4 bg-muted rounded w-1/6" />
            <div className="h-4 bg-muted rounded w-1/5" />
            <div className="h-6 bg-muted rounded-full w-24 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}