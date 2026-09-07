import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { NotFoundError } from '@/lib/errors';
import { detectDiscrepancies } from '@/lib/documents/discrepancy-detector';
import type {
  CanonicalInvoiceData,
  CanonicalPackingListData,
  CanonicalBillOfLadingData,
} from '@/lib/documents/canonical-types';

export const POST = withErrorHandler(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    const ctx = await requireTenantContext();
    assertPermission(ctx.role, 'import_shipment:read');

    const shipment = await prisma.importShipment.findFirst({
      where: { id: params.id, companyId: ctx.companyId },
      include: {
        documents: true,
      },
    });

    if (!shipment) {
      throw new NotFoundError('Import shipment not found');
    }

    // Locate canonical documents
    let invoice: CanonicalInvoiceData | undefined;
    let packingList: CanonicalPackingListData | undefined;
    let billOfLading: CanonicalBillOfLadingData | undefined;

    for (const doc of shipment.documents) {
      if (doc.docType === 'COMMERCIAL_INVOICE' && doc.extractedData) {
        invoice = doc.extractedData as unknown as CanonicalInvoiceData;
      } else if (doc.docType === 'PACKING_LIST' && doc.extractedData) {
        packingList = doc.extractedData as unknown as CanonicalPackingListData;
      } else if (doc.docType === 'BILL_OF_LADING' && doc.extractedData) {
        billOfLading = doc.extractedData as unknown as CanonicalBillOfLadingData;
      }
    }

    // Run discrepancy detector
    const report = detectDiscrepancies({
      shipment,
      invoice,
      packingList,
      billOfLading,
    });

    // Save report to all attached documents for audit trail
    if (shipment.documents.length > 0) {
      await prisma.document.updateMany({
        where: { importShipmentId: shipment.id, companyId: ctx.companyId },
        data: { discrepancies: report as any },
      });
    }

    return NextResponse.json({
      success: true,
      data: report,
      message: report.hasBlockingErrors
        ? `Cross-document check completed: ${report.errorCount} blocking error(s) detected.`
        : `Cross-document check passed: 0 blocking errors detected.`,
    });
  }
);
