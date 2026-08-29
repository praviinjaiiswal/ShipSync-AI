"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { licenseSchema, LicenseFormData } from "@/lib/validations";

const LICENSE_TYPES = ["IEC", "RCMC", "LUT", "BIS_CERTIFICATE", "GST_CERTIFICATE", "OTHER"];

export function LicenseForm({ onCreated }: { onCreated: (license: any) => void }) {
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LicenseFormData>({
    resolver: zodResolver(licenseSchema),
    defaultValues: { type: "IEC" },
  });

  const onSubmit = async (data: LicenseFormData) => {
    setSubmitError("");
    const res = await fetch("/api/licenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      setSubmitError("License add nahi ho paaya, dobara try karo.");
      return;
    }

    const license = await res.json();
    onCreated(license);
    reset({ type: "IEC", name: "", licenseNumber: "", issueDate: "", expiryDate: "" });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select defaultValue="IEC" onValueChange={(v) => setValue("type", v as LicenseFormData["type"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LICENSE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} placeholder="IEC Certificate" />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="licenseNumber">License Number (optional)</Label>
        <Input id="licenseNumber" {...register("licenseNumber")} placeholder="0312XXXXXX" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="issueDate">Issue Date (optional)</Label>
          <Input id="issueDate" type="date" {...register("issueDate")} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="expiryDate">Expiry Date</Label>
          <Input id="expiryDate" type="date" {...register("expiryDate")} />
          {errors.expiryDate && <p className="text-xs text-destructive">{errors.expiryDate.message}</p>}
        </div>
      </div>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <Button type="submit" disabled={isSubmitting} className="bg-brand-orange text-brand-orange-foreground hover:opacity-90">
        {isSubmitting ? "Adding..." : "Add License"}
      </Button>
    </form>
  );
}