"use client";

import { useEffect, useState } from "react";
import { LicenseForm } from "@/components/settings/LicenseForm";
import { LicenseList } from "@/components/settings/LicenseList";

type License = {
  id: string;
  type: string;
  name: string;
  licenseNumber: string | null;
  expiryDate: string;
};

export default function SettingsPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/licenses")
      .then((res) => res.json())
      .then(setLicenses)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Licenses aur certificates manage karo</p>
      </div>

      <div className="border border-border rounded-lg p-5 bg-card space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Licenses & Certificates</h2>
        <LicenseList
          licenses={licenses}
          loading={loading}
          onDeleted={(id) => setLicenses((prev) => prev.filter((l: any) => l.id !== id))}
        />
      </div>

      <div className="border border-border rounded-lg p-5 bg-card">
        <h2 className="text-sm font-semibold text-foreground mb-4">Add New License</h2>
        <LicenseForm
          onCreated={(license) => setLicenses((prev) => [...prev, license])}
        />
      </div>
    </div>
  );
}       