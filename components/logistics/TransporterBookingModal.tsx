"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Truck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TransporterBookingModalProps {
  shipmentId?: string;
  importShipmentId?: string;
  isOpen: boolean;
  onClose: () => void;
  defaultPickup?: string;
  defaultDelivery?: string;
}

export function TransporterBookingModal({
  shipmentId,
  importShipmentId,
  isOpen,
  onClose,
  defaultPickup = "Exporter Factory / CFS Nhava Sheva",
  defaultDelivery = "JNPT Port Terminal Gate",
}: TransporterBookingModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [transporterName, setTransporterName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("40ft Multi-Axle Trailer");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [pickupLocation, setPickupLocation] = useState(defaultPickup);
  const [deliveryLocation, setDeliveryLocation] = useState(defaultDelivery);
  const [scheduledTime, setScheduledTime] = useState(new Date().toISOString().slice(0, 16));
  const [ewayBillNumber, setEwayBillNumber] = useState("");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/logistics/transporters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipmentId: shipmentId || undefined,
          importShipmentId: importShipmentId || undefined,
          transporterName,
          contactNumber,
          contactPerson: contactPerson || undefined,
          vehicleNumber,
          vehicleType,
          driverName: driverName || undefined,
          driverPhone: driverPhone || undefined,
          pickupLocation,
          deliveryLocation,
          scheduledTime: new Date(scheduledTime).toISOString(),
          ewayBillNumber: ewayBillNumber || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.message || "Failed to book transporter");
      }

      onClose();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30 sticky top-0 bg-card z-10">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-semibold text-foreground">Book Transporter & Drayage</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="transporterName">Transporter Company Name *</Label>
              <Input
                id="transporterName"
                value={transporterName}
                onChange={(e) => setTransporterName(e.target.value)}
                placeholder="e.g. VRL Logistics / Mahavir Roadlines"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactNumber">Dispatch Contact Number *</Label>
              <Input
                id="contactNumber"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="e.g. +91 98200 12345"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
              <Input
                id="vehicleNumber"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="e.g. MH-46-AR-1234"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehicleType">Vehicle Type</Label>
              <Input
                id="vehicleType"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                placeholder="e.g. 40ft Multi-Axle Trailer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="driverName">Driver Name</Label>
              <Input
                id="driverName"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="e.g. Rajesh Yadav"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="driverPhone">Driver Mobile</Label>
              <Input
                id="driverPhone"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                placeholder="e.g. +91 97000 54321"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="pickupLocation">Pickup Location *</Label>
              <Input
                id="pickupLocation"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deliveryLocation">Delivery Location *</Label>
              <Input
                id="deliveryLocation"
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="scheduledTime">Scheduled Pickup Time *</Label>
              <Input
                id="scheduledTime"
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ewayBillNumber">GST e-Way Bill Number</Label>
              <Input
                id="ewayBillNumber"
                value={ewayBillNumber}
                onChange={(e) => setEwayBillNumber(e.target.value)}
                placeholder="12-digit e-way bill"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Dispatch Notes / Gate Pass Instructions</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Collect container EIR copy and customs out pass"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Transporter Booking
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
