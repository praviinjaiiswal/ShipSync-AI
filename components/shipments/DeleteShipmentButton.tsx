"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteShipmentButton({ shipmentId }: { shipmentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Ye shipment permanently delete ho jayega. Confirm karo?")) return;

    setLoading(true);
    const res = await fetch(`/api/shipments/${shipmentId}`, { method: "DELETE" });

    if (res.ok) {
      router.push("/shipments");
      router.refresh();
    } else {
      setLoading(false);
      alert("Delete nahi ho paaya, dobara try karo.");
    }
  };

  return (
    <Button variant="outline" onClick={handleDelete} disabled={loading}>
      <Trash2 className="w-4 h-4 mr-2" />
      {loading ? "Deleting..." : "Delete"}
    </Button>
  );
}