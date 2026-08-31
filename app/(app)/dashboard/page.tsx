import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { IncentiveSummaryCard } from "@/components/dashboard/IncentiveSummaryCard";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back — recent team activity yahan dikhegi.</p>
      </div>

      <IncentiveSummaryCard />

      <div className="border border-border rounded-lg p-6 bg-card">
        <h2 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h2>
        <ActivityFeed />
      </div>
    </div>
  );
}