"use client";

import Link from "next/link";
import { StatusBadge } from "./StatusBadge";

type Shipment = {
  id: string;
  buyerName: string;
  buyerCountry: string;
  productDesc: string;
  value: number;
  currency: string;
  status: string;
  createdAt: string;
};

export function ShipmentTable({ shipments }: { shipments: Shipment[] }) {
  if (shipments.length === 0) {
    return (
      <div className="border border-border rounded-lg p-10 text-center text-sm text-muted-foreground">
        Koi shipment nahi mila. Naya shipment banao "New Shipment" button se.
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
          <tr>
            <th className="text-left font-medium px-4 py-3">Buyer</th>
            <th className="text-left font-medium px-4 py-3">Country</th>
            <th className="text-left font-medium px-4 py-3">Product</th>
            <th className="text-right font-medium px-4 py-3">Value</th>
            <th className="text-left font-medium px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {shipments.map((s) => (
            <tr key={s.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3">
                <Link href={`/shipments/${s.id}`} className="font-medium text-foreground hover:text-brand-orange">
                  {s.buyerName}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{s.buyerCountry}</td>
              <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{s.productDesc}</td>
              <td className="px-4 py-3 text-right text-foreground">
                {s.currency} {s.value.toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={s.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}