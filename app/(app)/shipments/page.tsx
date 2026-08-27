"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { ShipmentTable } from "@/components/shipments/ShipmentTable";
import { ShipmentTableSkeleton } from "@/components/shipments/ShipmentTableSkeleton";
import { useDebounce } from "@/hooks/useDebounce";

const STATUS_OPTIONS = ["", "DRAFT", "DOCUMENTS_READY", "UNDER_REVIEW", "CLEARED", "SHIPPED", "DELIVERED"];

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setLoading(true);
    setError(false);

    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (status) params.set("status", status);

    fetch(`/api/shipments?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => {
        setShipments(data.shipments);
        setTotalPages(data.totalPages);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [debouncedSearch, status, page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Shipments</h1>
          <p className="text-sm text-muted-foreground mt-1">Apne saare export shipments manage karo</p>
        </div>
        <Link
          href="/shipments/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-brand-orange-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Shipment
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search buyer or product..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-muted rounded-md border border-transparent focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
          />
        </div>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-sm bg-muted rounded-md border border-transparent focus:border-brand-orange focus:outline-none"
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {loading && <ShipmentTableSkeleton />}

      {!loading && error && (
        <div className="border border-destructive/30 bg-destructive/10 rounded-lg p-6 text-center text-sm text-destructive">
          Shipments load nahi ho paaye. Page refresh karke try karo.
        </div>
      )}

      {!loading && !error && (
        <>
          <ShipmentTable shipments={shipments} />

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm border border-border rounded-md disabled:opacity-40 hover:bg-muted"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm border border-border rounded-md disabled:opacity-40 hover:bg-muted"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}