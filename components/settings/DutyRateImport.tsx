"use client";

import { useRef, useState } from "react";
import { UploadCloud, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DutyRateImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [imported, setImported] = useState<number | null>(null);

  const handleFile = async (file: File) => {
    setError("");
    setImported(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/duty-rates/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import fail ho gaya");
      setImported(data.imported);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        DGFT ki official Appendix 4R CSV yahan upload karo (columns: <code>hs_code, description, rodtep_rate, rodtep_cap, duty_drawback_rate</code>).
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
        <UploadCloud className="w-4 h-4 mr-1.5" />
        {uploading ? "Importing..." : "Import DGFT CSV"}
      </Button>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {imported !== null && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {imported} HS codes import ho gaye.
        </p>
      )}
    </div>
  );
}