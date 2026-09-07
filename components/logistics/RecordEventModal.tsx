"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Truck, CheckCircle2, ShieldCheck, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LOGISTICS_EVENT_TYPES } from "@/lib/validations";

interface RecordEventModalProps {
  shipmentId?: string;
  importShipmentId?: string;
  isOpen: boolean;
  onClose: () => void;
  defaultLocation?: string;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  PORT_ARRIVAL: "Port / Buffer Yard Arrival",
  EXAMINATION_SCHEDULED: "Customs Examination Scheduled",
  EXAMINATION_COMPLETED: "Physical Examination Completed",
  STUFFING_SCHEDULED: "Container Stuffing Scheduled",
  STUFFING_COMPLETED: "Stuffing & Sealing Completed",
  LOADED_ON_VESSEL: "Loaded on Board Vessel / Mate's Receipt",
  LEO_ISSUED: "Customs Let Export Order (LEO)",
  OUT_OF_CHARGE_ISSUED: "Customs Out of Charge (OOC)",
};

export function RecordEventModal({
  shipmentId,
  importShipmentId,
  isOpen,
  onClose,
  defaultLocation = "CFS Dronagiri / Nhava Sheva",
}: RecordEventModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [eventType, setEventType] = useState<string>("EXAMINATION_COMPLETED");
  const [location, setLocation] = useState(defaultLocation);
  const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [officerName, setOfficerName] = useState("");
  const [containerNumber, setContainerNumber] = useState("");
  const [sealNumber, setSealNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/logistics/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipmentId: shipmentId || undefined,
          importShipmentId: importShipmentId || undefined,
          eventType,
          location,
          timestamp: new Date(timestamp).toISOString(),
          officerOrInspectorName: officerName || undefined,
          containerNumber: containerNumber || undefined,
          sealNumber: sealNumber || undefined,
          remarks: remarks || undefined,
          attachments: attachmentUrl ? [attachmentUrl] : [],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.message || "Failed to record logistics milestone");
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
      <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-semibold text-foreground">Record Physical Milestone</h3>
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

          <div className="space-y-1.5">
            <Label htmlFor="eventType">Physical Milestone Type *</Label>
            <select
              id="eventType"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            >
              {LOGISTICS_EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {EVENT_TYPE_LABELS[type] || type}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="location">Facility / Location *</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. CFS Dronagiri / Nhava Sheva"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timestamp">Event Date & Time *</Label>
              <Input
                id="timestamp"
                type="datetime-local"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="containerNumber">Container Number</Label>
              <Input
                id="containerNumber"
                value={containerNumber}
                onChange={(e) => setContainerNumber(e.target.value)}
                placeholder="e.g. MSCU9876543"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sealNumber">Customs / Carrier Seal No.</Label>
              <Input
                id="sealNumber"
                value={sealNumber}
                onChange={(e) => setSealNumber(e.target.value)}
                placeholder="e.g. SEAL-008129"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="officerName">Customs Inspector / Surveyor Name</Label>
            <Input
              id="officerName"
              value={officerName}
              onChange={(e) => setOfficerName(e.target.value)}
              placeholder="e.g. Inspector K. Raman / Surveyor T. Rao"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="remarks">Inspection Remarks / Seal Verification Notes</Label>
            <Input
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. 100% sound packages, verification tag matched"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="attachmentUrl">Document / Scan URL (e.g. Examination Report, Mate's Receipt)</Label>
            <Input
              id="attachmentUrl"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              placeholder="https://... or doc reference number"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Logistics Milestone
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
