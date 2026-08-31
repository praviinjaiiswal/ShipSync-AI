"use client";

import useSWR from "swr";
import { LicenseForm } from "@/components/settings/LicenseForm";
import { LicenseList } from "@/components/settings/LicenseList";
import { TeamSection } from "@/components/team/TeamSection";
import { BillingSection } from "@/components/settings/BillingSection";
import { DutyRateImport } from "@/components/settings/DutyRateImport";
import { fetcher } from "@/lib/fetcher";

type License = {
  id: string;
  type: string;
  name: string;
  licenseNumber: string | null;
  expiryDate: string;
};

export default function SettingsPage() {
  const { data: licenses, isLoading, mutate } = useSWR<License[]>("/api/licenses", fetcher);

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your licenses and certificates</p>
      </div>

      <div className="border border-border rounded-lg p-5 bg-card space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Licenses & Certificates</h2>
        <LicenseList licenses={licenses ?? []} loading={isLoading} mutate={mutate} />
      </div>

      <div className="border border-border rounded-lg p-5 bg-card">
        <h2 className="text-sm font-semibold text-foreground mb-4">Add New License</h2>
        <LicenseForm onCreated={() => mutate()} />
      </div>

      <div className="border border-border rounded-lg p-5 bg-card">
        <h2 className="text-sm font-semibold text-foreground mb-4">Team</h2>
        <TeamSection />
      </div>

      <div className="border border-border rounded-lg p-5 bg-card">
        <h2 className="text-sm font-semibold text-foreground mb-4">Billing</h2>
        <BillingSection />
      </div>

      <div className="border border-border rounded-lg p-5 bg-card">
        <h2 className="text-sm font-semibold text-foreground mb-4">DGFT Duty Incentive Rates</h2>
        <DutyRateImport />
      </div>
    </div>
  );
}