import React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Anchor, Globe, FileText, Lock, Building, Calendar, Hash, ShieldCheck } from 'lucide-react';
import { prisma } from '@/app/lib/prisma';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { ImportStatusBadge } from '@/components/imports/ImportStatusBadge';
import { ImportTimeline } from '@/components/imports/ImportTimeline';
import { DutyCalculatorCard } from '@/components/imports/DutyCalculatorCard';
import { BillOfEntryCard } from '@/components/imports/BillOfEntryCard';
import { AmendmentHistoryModal } from '@/components/imports/AmendmentHistoryModal';
import { PolicyNoticeBanner } from '@/components/imports/PolicyNoticeBanner';
import { calculateCustomsDuty } from '@/lib/duty-calculator';
import { CustomsFilingCard } from '@/components/customs/CustomsFilingCard';
import { ImportDocumentSection } from '@/components/documents/ImportDocumentSection';
import { LogisticsPanel } from '@/components/logistics/LogisticsPanel';
import { DutyPaymentCard } from '@/components/financial/DutyPaymentCard';

export default async function ImportDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');

  if (!user.companyId) redirect('/onboarding');

  const shipment = await prisma.importShipment.findFirst({
    where: {
      id: params.id,
      companyId: user.companyId,
    },
    include: {
      billOfEntry: true,
      amendments: {
        orderBy: { version: 'desc' },
      },
      documents: {
        orderBy: { createdAt: 'desc' },
      },
      logisticsEvents: {
        include: { recorder: { select: { name: true, email: true } } },
        orderBy: { timestamp: 'desc' },
      },
      transporterBookings: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!shipment) notFound();

  // Fetch policy for HS Code
  const policy = await prisma.restrictedItemsList.findUnique({
    where: { hsCode: shipment.hsCode },
  });

  // Calculate duty breakdown
  let initialDuty = null;
  try {
    initialDuty = await calculateCustomsDuty(
      user.companyId,
      shipment.hsCode,
      shipment.invoiceValue
    );
  } catch {
    // If rate not maintained yet, initialDuty remains null
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back Link */}
      <Link
        href="/imports"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Import Shipments
      </Link>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {shipment.supplierName}
            </h1>
            <ImportStatusBadge status={shipment.status} />
            {shipment.isLocked && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                <Lock className="w-3 h-3" /> Locked
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Imported by <span className="font-semibold text-slate-700 dark:text-slate-300">{shipment.importerName}</span> (IEC: {shipment.importerIEC}) via {shipment.portOfImport}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AmendmentHistoryModal
            shipmentId={shipment.id}
            amendments={shipment.amendments as any}
            currentValues={{
              invoiceValue: shipment.invoiceValue,
              hsCode: shipment.hsCode,
              importerName: shipment.importerName,
              supplierName: shipment.supplierName,
            }}
            currency={shipment.currency}
          />
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Policy Banner */}
          <PolicyNoticeBanner
            policy={policy?.policy || 'FREE'}
            policyCondition={policy?.policyCondition}
            requiredLicenseType={policy?.requiredLicenseType}
          />

          {/* Shipment Manifest Details */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
              Commercial Manifest & Port Clearance Details
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-slate-400">8-Digit HS Code</p>
                <p className="font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">{shipment.hsCode}</p>
              </div>

              <div>
                <p className="text-slate-400">Declared CIF Value</p>
                <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {shipment.currency} {shipment.invoiceValue.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Statutory Assessable Value</p>
                <p className="font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                  {shipment.currency} {shipment.assessableValue.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Incoterm</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{shipment.incoterm}</p>
              </div>

              <div>
                <p className="text-slate-400">Port of Import</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{shipment.portOfImport}</p>
              </div>

              <div>
                <p className="text-slate-400">Supplier Country</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{shipment.supplierCountry}</p>
              </div>

              <div>
                <p className="text-slate-400">IGM Number</p>
                <p className="font-mono font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {shipment.igmNumber || '—'}
                </p>
              </div>

              <div>
                <p className="text-slate-400">BL / AWB Number</p>
                <p className="font-mono font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {shipment.blOrAwbNumber || '—'}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Registration Date</p>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {new Date(shipment.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Bill of Entry Section */}
          <BillOfEntryCard
            shipmentId={shipment.id}
            billOfEntry={shipment.billOfEntry as any}
            currency={shipment.currency}
          />

          {/* Customs Duty Payment & Challan Verification (Chunk 6) */}
          <DutyPaymentCard
            importShipmentId={shipment.id}
            billOfEntry={shipment.billOfEntry as any}
            userRole={user.role}
          />

          {/* Physical Logistics Operations & Milestones (Chunk 5) */}
          <LogisticsPanel
            importShipmentId={shipment.id}
            isExport={false}
            events={shipment.logisticsEvents as any}
            bookings={shipment.transporterBookings as any}
          />

          {/* Supporting Documents & e-Sanchit Preparation Pipeline (Chunk 3) */}
          <ImportDocumentSection
            shipmentId={shipment.id}
            initialDocuments={shipment.documents as any}
            userRole={user.role}
          />

          {/* Customs Gateway Transmission (Chunk 2) */}
          <CustomsFilingCard
            shipmentId={shipment.id}
            currentStatus={shipment.status}
            beNumber={shipment.billOfEntry?.beNumber}
            isLocked={shipment.isLocked}
            userRole={user.role}
          />

          {/* Duty Breakdown Card */}
          <DutyCalculatorCard
            shipmentId={shipment.id}
            initialBreakdown={initialDuty}
            currency={shipment.currency}
            isLocked={shipment.isLocked}
          />
        </div>

        {/* Right Column: Status State Machine Timeline */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
              Customs Clearance State Machine
            </h3>
            <ImportTimeline
              shipmentId={shipment.id}
              currentStatus={shipment.status}
              hasBoe={Boolean(shipment.billOfEntry)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
