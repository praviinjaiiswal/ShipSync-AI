"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Loader } from "@/components/ui/loader";

const DOC_TYPES = [
  "COMMERCIAL_INVOICE",
  "PACKING_LIST",
  "CERTIFICATE_OF_ORIGIN",
  "SHIPPING_BILL",
  "BILL_OF_LADING",
  "LUT",
  "OTHER",
];

type UploadedDoc = {
  id: string;
  docType: string;
  fileUrl: string | null;
  status: string;
  createdAt: string;
};

export function FileUpload({
  shipmentId,
  onUploaded,
}: {
  shipmentId: string;
  onUploaded: (doc: UploadedDoc) => void;
}) {
  const [docType, setDocType] = useState("COMMERCIAL_INVOICE");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError("");

    if (file.size > 4 * 1024 * 1024) {
      setError("File 4MB se bada nahi ho sakta");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("docType", docType);

    try {
      const res = await fetch(`/api/shipments/${shipmentId}/documents`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("failed");
      const doc = await res.json();
      onUploaded(doc);
    } catch {
      setError("Upload fail ho gaya, dobara try karo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Select value={docType} onValueChange={setDocType}>
        <SelectTrigger className="max-w-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DOC_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {type.replace(/_/g, " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
          dragging ? "border-brand-orange bg-brand-orange/5" : "border-border hover:border-brand-orange/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {uploading ? (
          <>
            <Loader />
            <p className="text-xs text-muted-foreground">Upload ho raha hai...</p>
          </>
        ) : (
          <>
            <UploadCloud className="w-6 h-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Drag & drop karo ya click karke browse karo</p>
            <p className="text-xs text-muted-foreground">Max 4MB</p>
          </>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}