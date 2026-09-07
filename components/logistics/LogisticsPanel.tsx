"use client";

import { useState } from "react";
import {
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  MapPin,
  FileText,
  Plus,
  Box,
  Anchor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecordEventModal } from "./RecordEventModal";
import { TransporterBookingModal } from "./TransporterBookingModal";
import { TransporterBookingCard } from "./TransporterBookingCard";

interface LogisticsEvent {
  id: string;
  eventType: string;
  timestamp: string | Date;
  location: string;
  remarks?: string | null;
  attachments: string[];
  officerOrInspectorName?: string | null;
  containerNumber?: string | null;
  sealNumber?: string | null;
  recorder?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

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

interface LogisticsPanelProps {
  shipmentId?: string;
  importShipmentId?: string;
  isExport?: boolean;
  events?: LogisticsEvent[];
  bookings?: TransporterBooking[];
}

const MILESTONES_EXPORT = [
  { key: "PORT_ARRIVAL", label: "Port Buffer Arrival", icon: MapPin },
  { key: "EXAMINATION_COMPLETED", label: "Physical Examination", icon: FileCheck },
  { key: "STUFFING_COMPLETED", label: "Stuffing & Sealing", icon: Box },
  { key: "LEO_ISSUED", label: "Customs LEO Order", icon: ShieldCheck },
  { key: "LOADED_ON_VESSEL", label: "Loaded on Vessel", icon: Anchor },
];

const MILESTONES_IMPORT = [
  { key: "PORT_ARRIVAL", label: "Port / CFS Arrival", icon: MapPin },
  { key: "EXAMINATION_COMPLETED", label: "Customs Inspection", icon: FileCheck },
  { key: "OUT_OF_CHARGE_ISSUED", label: "Out of Charge (OOC)", icon: ShieldCheck },
  { key: "LOADED_ON_VESSEL", label: "Gate Pass Clearance", icon: Truck },
];

export function LogisticsPanel({
  shipmentId,
  importShipmentId,
  isExport = true,
  events = [],
  bookings = [],
}: LogisticsPanelProps) {
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isTransporterModalOpen, setIsTransporterModalOpen] = useState(false);

  const milestones = isExport ? MILESTONES_EXPORT : MILESTONES_IMPORT;
  const recordedTypes = new Set(events.map((e) => e.eventType));

  return (
    <div className="space-y-6">
      {/* 1. Milestone Checklist Card */}
      <div className="border border-border rounded-xl p-5 bg-card space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Physical Operations Checklist</h3>
              <p className="text-xs text-muted-foreground">CFS, Examination, Stuffing & On-Ground Milestones</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setIsEventModalOpen(true)}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white h-8"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Record Milestone
          </Button>
        </div>

        {/* Horizontal Checklist Progress */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          {milestones.map((m) => {
            const isDone = recordedTypes.has(m.key);
            const Icon = m.icon;

            return (
              <div
                key={m.key}
                className={`p-3 rounded-lg border text-xs flex flex-col justify-between space-y-2 transition-all ${
                  isDone
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                    : "bg-muted/30 border-border text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`w-4 h-4 ${isDone ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`} />
                  {isDone ? (
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-semibold leading-tight">{m.label}</p>
                  <p className="text-[10px] mt-0.5 opacity-80">{isDone ? "Completed" : "Pending Gate"}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Transporter Booking & Drayage Card */}
      <TransporterBookingCard
        bookings={bookings}
        onNewBookingClick={() => setIsTransporterModalOpen(true)}
      />

      {/* 3. Event History & Audit Log */}
      <div className="border border-border rounded-xl p-5 bg-card space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Logistics Event History ({events.length})</h3>
          </div>
        </div>

        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4 bg-muted/20 rounded-lg">
            No physical logistics events recorded yet. Click &quot;Record Milestone&quot; to log cargo arrival or examination.
          </p>
        ) : (
          <div className="space-y-3">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-foreground text-sm">
                      {evt.eventType.replace(/_/g, " ")}
                    </span>
                    <div className="flex items-center gap-2 text-muted-foreground mt-0.5 text-[11px]">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-indigo-500" />
                        {evt.location}
                      </span>
                      <span>•</span>
                      <span>{new Date(evt.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  {evt.recorder?.name && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      Logged by {evt.recorder.name}
                    </span>
                  )}
                </div>

                {(evt.containerNumber || evt.sealNumber || evt.officerOrInspectorName) && (
                  <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-border/60 text-[11px] text-muted-foreground">
                    {evt.containerNumber && (
                      <span>
                        Container: <strong className="text-foreground font-mono">{evt.containerNumber}</strong>
                      </span>
                    )}
                    {evt.sealNumber && (
                      <span>
                        Seal No: <strong className="text-foreground font-mono">{evt.sealNumber}</strong>
                      </span>
                    )}
                    {evt.officerOrInspectorName && (
                      <span>
                        Officer/Inspector: <strong className="text-foreground">{evt.officerOrInspectorName}</strong>
                      </span>
                    )}
                  </div>
                )}

                {evt.remarks && (
                  <p className="text-muted-foreground italic bg-background/50 p-2 rounded border border-border/40">
                    &ldquo;{evt.remarks}&rdquo;
                  </p>
                )}

                {evt.attachments.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    {evt.attachments.map((att, i) => (
                      <a
                        key={i}
                        href={att}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <FileText className="w-3 h-3" />
                        Attachment #{i + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <RecordEventModal
        shipmentId={shipmentId}
        importShipmentId={importShipmentId}
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
      />

      <TransporterBookingModal
        shipmentId={shipmentId}
        importShipmentId={importShipmentId}
        isOpen={isTransporterModalOpen}
        onClose={() => setIsTransporterModalOpen(false)}
      />
    </div>
  );
}
