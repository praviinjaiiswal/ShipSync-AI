import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { StatusBadge } from "@/components/shipments/StatusBadge";
import { Timeline } from "@/components/shipments/Timeline";
import { DeleteShipmentButton } from "@/components/shipments/DeleteShipmentButton";
import { DocumentGenerator } from "@/components/shipments/document-generator";

export default async function ShipmentDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const shipment = await prisma.shipment.findFirst({
    where: { id: params.id, userId: user.id },
    include: { documents: true, complianceChecks: true, riskReport: true },
  });

  if (!shipment) notFound();

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
          <div className="border border-border rounded-lg p-5 bg-card space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Shipment Details</h2>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">HS Code</p>
                <p className="text-foreground font-medium">{shipment.hsCode}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Value</p>
                <p className="text-foreground font-medium">
                  {shipment.currency} {shipment.value.toLocaleString()}
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
            {shipment.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Abhi tak koi document upload nahi hua.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {shipment.documents.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between">
                    <span className="text-foreground">{doc.docType.replace(/_/g, " ")}</span>
                    <span className="text-muted-foreground text-xs">{doc.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="border border-border rounded-lg p-5 bg-card">
          <h2 className="text-sm font-semibold text-foreground mb-4">Status Timeline</h2>
          <Timeline currentStatus={shipment.status} />
        </div>
      </div>
    </div>
  );
}