import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { StatusBadge } from "@/components/shipments/StatusBadge";
import { Timeline } from "@/components/shipments/Timeline";
import { DeleteShipmentButton } from "@/components/shipments/DeleteShipmentButton";
import { ComplianceCheck } from "@/components/shipments/compliance-check";
import { RiskReport } from "@/components/shipments/risk-report";
import { SanctionsCheck } from "@/components/shipments/sanctions-check";
import { ShippingBillCard } from "@/components/shipments/ShippingBillCard";
import { ExportIncentiveCard } from "@/components/shipments/ExportIncentiveCard";
import { DocumentsPanel } from "@/components/shipments/documents-panel";
import { DocumentGenerator } from "@/components/shipments/document-generator";
import { LogisticsPanel } from "@/components/logistics/LogisticsPanel";
import { ExportRealisationCard } from "@/components/financial/ExportRealisationCard";
import { IncentiveClaimCard } from "@/components/financial/IncentiveClaimCard";
import { StatutoryDisclaimer } from "@/components/ui/statutory-disclaimer";

export default async function ShipmentDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const shipment = await prisma.shipment.findFirst({
    where: {
      id: params.id,
      companyId: user.companyId,
    },
    include: {
      documents: true,
      complianceChecks: true,
      riskReport: true,
      shippingBill: true,
      amendments: { orderBy: { createdAt: "desc" } },
      logisticsEvents: {
        include: { recorder: { select: { name: true, email: true } } },
        orderBy: { timestamp: "desc" },
      },
      transporterBookings: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!shipment) notFound();

  const declaredFob = shipment.shippingBill?.fobValue ?? shipment.value;

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/shipments" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" />
        Back to Shipments
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-heading font-bold text-foreground">{shipment.buyerName}</h1>
            <StatusBadge status={shipment.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">{shipment.buyerCountry}</p>
        </div>
        <DeleteShipmentButton shipmentId={shipment.id} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <ShippingBillCard shipment={shipment} />

          <ExportIncentiveCard
            shipmentId={shipment.id}
            hsCode={shipment.hsCode}
            fobValue={declaredFob}
            currency={shipment.currency}
            shippingBill={shipment.shippingBill}
          />

          <LogisticsPanel
            shipmentId={shipment.id}
            isExport={true}
            events={shipment.logisticsEvents}
            bookings={shipment.transporterBookings}
          />

          <ExportRealisationCard
            shipmentId={shipment.id}
            invoiceValue={declaredFob}
            currency={shipment.currency}
            userRole={user.role}
          />

          <IncentiveClaimCard
            shipmentId={shipment.id}
            shipmentStatus={shipment.status}
            calculatedIncentives={
              shipment.shippingBill
                ? {
                    rodtepAmount: shipment.shippingBill.rodtepAmount || 0,
                    drawbackAmount: shipment.shippingBill.drawbackAmount || 0,
                  }
                : undefined
            }
            userRole={user.role}
          />

          <div className="border border-border rounded-lg p-5 bg-card space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Shipment Details</h2>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">HS Code</p>
                <p className="text-foreground font-medium">{shipment.hsCode}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Declared Value</p>
                <p className="text-foreground font-medium">
                  {shipment.currency} {declaredFob.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Incoterm</p>
                <p className="text-foreground font-medium">{shipment.incoterm}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Buyer Email</p>
                <p className="text-foreground font-medium">{shipment.buyerEmail || "—"}</p>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground text-sm">Product Description</p>
              <p className="text-foreground text-sm mt-1">{shipment.productDesc}</p>
            </div>
          </div>

          <div className="border border-border rounded-lg p-5 bg-card">
            <h2 className="text-sm font-semibold text-foreground mb-3">AI Document Generator</h2>
            <DocumentGenerator shipmentId={shipment.id} />
          </div>

          <div className="border border-border rounded-lg p-5 bg-card">
            <h2 className="text-sm font-semibold text-foreground mb-3">Documents</h2>
            <DocumentsPanel shipmentId={shipment.id} initialDocuments={shipment.documents} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-border rounded-lg p-5 bg-card">
            <h2 className="text-sm font-semibold text-foreground mb-4">Status Timeline</h2>
            <Timeline currentStatus={shipment.status} />
          </div>

          <div className="border border-border rounded-lg p-5 bg-card">
            <h2 className="text-sm font-semibold text-foreground mb-3">Sanctions Screening</h2>
            <SanctionsCheck shipmentId={shipment.id} />
          </div>

          <div className="border border-border rounded-lg p-5 bg-card">
            <h2 className="text-sm font-semibold text-foreground mb-3">Compliance</h2>
            <ComplianceCheck shipmentId={shipment.id} />
          </div>

          <div className="border border-border rounded-lg p-5 bg-card">
            <h2 className="text-sm font-semibold text-foreground mb-3">Risk Assessment</h2>
            <RiskReport shipmentId={shipment.id} />
          </div>
        </div>
      </div>

      <StatutoryDisclaimer className="mt-6" />
    </div>
  );
}