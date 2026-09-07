"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, Phone, Navigation, CheckCircle2, Clock, FileText, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TransporterBooking {
  id: string;
  transporterName: string;
  contactNumber: string;
  vehicleNumber: string;
  vehicleType?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  pickupLocation: string;
  deliveryLocation: string;
  scheduledTime: string | Date;
  actualPickupTime?: string | Date | null;
  actualDeliveryTime?: string | Date | null;
  status: "BOOKED" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";
  ewayBillNumber?: string | null;
  notes?: string | null;
}

interface TransporterBookingCardProps {
  bookings: TransporterBooking[];
  onNewBookingClick: () => void;
}

const STATUS_BADGE_STYLES: Record<string, string> = {
  BOOKED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  PICKED_UP: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  IN_TRANSIT: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  DELIVERED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  CANCELLED: "bg-destructive/10 text-destructive",
};

export function TransporterBookingCard({ bookings, onNewBookingClick }: TransporterBookingCardProps) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusUpdate = async (bookingId: string, nextStatus: string) => {
    setUpdatingId(bookingId);
    try {
      const res = await fetch(`/api/logistics/transporters/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="border border-border rounded-xl p-5 bg-card space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-foreground">Transporter & Drayage Coordination</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onNewBookingClick}
          className="text-xs h-7 text-blue-600 border-blue-500/30 hover:bg-blue-500/10"
        >
          + Book Transporter
        </Button>
      </div>

      {bookings.length === 0 ? (
        <div className="p-4 bg-muted/40 rounded-lg text-center text-xs text-muted-foreground">
          No transporter booked yet. Dispatch trailers for port drayage or delivery movement.
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const isUpdating = updatingId === booking.id;

            return (
              <div
                key={booking.id}
                className="p-3.5 border border-border rounded-lg bg-muted/20 space-y-2.5 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-foreground text-sm">{booking.transporterName}</span>
                    <div className="flex items-center gap-2 text-muted-foreground mt-0.5">
                      <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px] font-semibold text-foreground">
                        {booking.vehicleNumber}
                      </span>
                      {booking.vehicleType && <span>• {booking.vehicleType}</span>}
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      STATUS_BADGE_STYLES[booking.status] || "bg-muted text-muted-foreground"
                    }`}
                  >
                    {booking.status.replace("_", " ")}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground pt-1">
                  <div className="flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">
                      <strong>From:</strong> {booking.pickupLocation}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">
                      <strong>To:</strong> {booking.deliveryLocation}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between pt-1 text-[11px] text-muted-foreground border-t border-border">
                  <div className="flex items-center gap-3">
                    {booking.driverName && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        Driver: {booking.driverName} {booking.driverPhone ? `(${booking.driverPhone})` : ""}
                      </span>
                    )}
                    {booking.ewayBillNumber && (
                      <span className="flex items-center gap-1 font-mono">
                        <FileText className="w-3 h-3" />
                        e-Way: {booking.ewayBillNumber}
                      </span>
                    )}
                  </div>

                  {/* Status Progression Actions */}
                  <div className="flex items-center gap-1.5">
                    {booking.status === "BOOKED" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStatusUpdate(booking.id, "PICKED_UP")}
                        disabled={isUpdating}
                        className="h-6 text-[11px] px-2 text-amber-600 hover:bg-amber-500/10"
                      >
                        {isUpdating && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                        Mark Picked Up →
                      </Button>
                    )}
                    {booking.status === "PICKED_UP" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStatusUpdate(booking.id, "IN_TRANSIT")}
                        disabled={isUpdating}
                        className="h-6 text-[11px] px-2 text-purple-600 hover:bg-purple-500/10"
                      >
                        {isUpdating && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                        Mark In Transit →
                      </Button>
                    )}
                    {booking.status === "IN_TRANSIT" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStatusUpdate(booking.id, "DELIVERED")}
                        disabled={isUpdating}
                        className="h-6 text-[11px] px-2 text-emerald-600 hover:bg-emerald-500/10"
                      >
                        {isUpdating && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                        Mark Delivered ✓
                      </Button>
                    )}
                    {booking.status === "DELIVERED" && (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
