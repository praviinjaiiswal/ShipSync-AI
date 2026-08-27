"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { shipmentSchema, ShipmentFormData } from "@/lib/validations";

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "AED"];
const INCOTERMS = ["FOB", "CIF", "DDP", "EXW", "DAP"];

export function ShipmentForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ShipmentFormData>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: { currency: "USD", incoterm: "FOB" },
  });

  const onSubmit = async (data: ShipmentFormData) => {
    setSubmitError("");
    const res = await fetch("/api/shipments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      setSubmitError("Shipment create nahi ho paaya. Dobara try karo.");
      return;
    }

    const shipment = await res.json();
    router.push(`/shipments/${shipment.id}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="buyerName">Buyer Name</Label>
          <Input id="buyerName" {...register("buyerName")} placeholder="Acme Corp" />
          {errors.buyerName && <p className="text-xs text-destructive">{errors.buyerName.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="buyerCountry">Buyer Country</Label>
          <Input id="buyerCountry" {...register("buyerCountry")} placeholder="Germany" />
          {errors.buyerCountry && <p className="text-xs text-destructive">{errors.buyerCountry.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="buyerEmail">Buyer Email (optional)</Label>
        <Input id="buyerEmail" {...register("buyerEmail")} placeholder="buyer@company.com" />
        {errors.buyerEmail && <p className="text-xs text-destructive">{errors.buyerEmail.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="productDesc">Product Description</Label>
        <textarea
          id="productDesc"
          {...register("productDesc")}
          rows={3}
          placeholder="CNC machined steel brackets for industrial use..."
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        {errors.productDesc && <p className="text-xs text-destructive">{errors.productDesc.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="hsCode">HS Code (8 digits)</Label>
          <Input id="hsCode" {...register("hsCode")} placeholder="73181500" maxLength={8} />
          {errors.hsCode && <p className="text-xs text-destructive">{errors.hsCode.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="value">Value</Label>
          <Input id="value" type="number" step="0.01" {...register("value")} placeholder="5000" />
          {errors.value && <p className="text-xs text-destructive">{errors.value.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Currency</Label>
          <Select defaultValue="USD" onValueChange={(v) => setValue("currency", v as ShipmentFormData["currency"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5 max-w-xs">
        <Label>Incoterm</Label>
        <Select defaultValue="FOB" onValueChange={(v) => setValue("incoterm", v as ShipmentFormData["incoterm"])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INCOTERMS.map((i) => (
              <SelectItem key={i} value={i}>
                {i}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting} className="bg-brand-orange text-brand-orange-foreground hover:opacity-90">
          {isSubmitting ? "Creating..." : "Create Shipment"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}