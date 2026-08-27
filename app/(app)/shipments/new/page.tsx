import { ShipmentForm } from "@/components/shipments/ShipmentForm";

export default function NewShipmentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">New Shipment</h1>
        <p className="text-sm text-muted-foreground mt-1">Naya export shipment create karo</p>
      </div>

      <ShipmentForm />
    </div>
  );
}