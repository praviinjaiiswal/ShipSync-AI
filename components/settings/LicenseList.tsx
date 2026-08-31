"use client";

import { Trash2, FileBadge } from "lucide-react";
import { ExpiryBadge } from "./ExpiryBadge";
import { KeyedMutator } from "swr";

type License = {
  id: string;
  type: string;
  name: string;
  licenseNumber: string | null;
  expiryDate: string;
};

export function LicenseList({
  licenses,
  loading,
  mutate,
}: {
  licenses: License[];
  loading: boolean;
  mutate: KeyedMutator<License[]>;
}) {
  const handleDelete = async (id: string) => {
    if (!confirm("This license will be permanently deleted. Continue?")) return;

    const optimisticList = licenses.filter((l) => l.id !== id);

    mutate(
      (async () => {
        const res = await fetch(`/api/licenses/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
        return optimisticList;
      })(),
      {
        optimisticData: optimisticList,
        rollbackOnError: true,
        populateCache: true,
        revalidate: false,
      }
    ).catch(() => alert("Failed to delete. Please try again."));
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 bg-muted rounded-md animate-pulse" />
        ))}
      </div>
    );
  }

  if (licenses.length === 0) {
    return <p className="text-sm text-muted-foreground">No licenses or certificates added yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {licenses.map((license) => (
        <li
          key={license.id}
          className="flex items-center justify-between border border-border rounded-md px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <FileBadge className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {license.name} <span className="text-muted-foreground font-normal">({license.type.replace(/_/g, " ")})</span>
              </p>
              {license.licenseNumber && (
                <p className="text-xs text-muted-foreground">{license.licenseNumber}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ExpiryBadge expiryDate={license.expiryDate} />
            <button
              onClick={() => handleDelete(license.id)}
              className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10"
              aria-label="Delete license"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}