import { Loader } from "@/components/ui/loader";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back — yahan tumhara shipment overview aayega.
        </p>
      </div>

      <div className="border border-border rounded-lg p-6 bg-card flex items-center gap-3">
        <Loader />
        <span className="text-sm text-muted-foreground">Shipment data Step 4 me connect hoga</span>
      </div>
    </div>
  );
}