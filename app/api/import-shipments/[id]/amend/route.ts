import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { importAmendmentSchema } from '@/lib/validations';
import { calculateCustomsDuty } from '@/lib/duty-calculator';
import { NotFoundError, ValidationError } from '@/lib/errors';

export const POST = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'import_shipment:amend');

  const shipment = await prisma.importShipment.findFirst({
    where: {
      id: params.id,
      companyId: ctx.companyId,
    },
    include: {
      billOfEntry: true,
    },
  });

  if (!shipment) {
    throw new NotFoundError('Import shipment not found');
  }

  const body = await req.json();
  const parsed = importAmendmentSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError('Invalid amendment data', parsed.error.flatten());
  }

  const { reason, invoiceValue, hsCode, importerName, supplierName, portOfImport } = parsed.data;

  // If HS code is being changed, verify it exists in tariff
  const newHsCode = hsCode || shipment.hsCode;
  if (hsCode && hsCode !== shipment.hsCode) {
    const validRate = await prisma.importDutyRate.findUnique({
      where: { hsCode },
    });
    if (!validRate) {
      throw new ValidationError(`HS Code ${hsCode} does not exist in Customs Tariff.`);
    }
  }

  const newInvoiceValue = invoiceValue || shipment.invoiceValue;
  const newAssessableValue = Math.round(newInvoiceValue * 1.01 * 100) / 100;

  // Snapshot previous values
  const previousValues = {
    invoiceValue: shipment.invoiceValue,
    assessableValue: shipment.assessableValue,
    hsCode: shipment.hsCode,
    importerName: shipment.importerName,
    supplierName: shipment.supplierName,
    portOfImport: shipment.portOfImport,
  };

  const newValues = {
    invoiceValue: newInvoiceValue,
    assessableValue: newAssessableValue,
    hsCode: newHsCode,
    importerName: importerName || shipment.importerName,
    supplierName: supplierName || shipment.supplierName,
    portOfImport: portOfImport || shipment.portOfImport,
  };

  // Determine next amendment version
  const currentAmendmentsCount = await prisma.importAmendment.count({
    where: { importShipmentId: shipment.id },
  });
  const nextVersion = currentAmendmentsCount + 1;

  // Recalculate duty if BOE exists
  let updatedBoe = null;
  if (shipment.billOfEntry) {
    const recalculatedDuty = await calculateCustomsDuty(
      ctx.companyId,
      newHsCode,
      newInvoiceValue
    );

    updatedBoe = await prisma.billOfEntry.update({
      where: { id: shipment.billOfEntry.id },
      data: {
        dutyBreakdown: recalculatedDuty as any,
        totalDutyPayable: recalculatedDuty.totalDutyPayable,
      },
    });
  }

  // Record amendment & update shipment in transaction
  const [amendment, updatedShipment] = await prisma.$transaction([
    prisma.importAmendment.create({
      data: {
        companyId: ctx.companyId,
        importShipmentId: shipment.id,
        version: nextVersion,
        amendedBy: ctx.userId,
        reason,
        previousValues: previousValues as any,
        newValues: newValues as any,
      },
    }),
    prisma.importShipment.update({
      where: { id: shipment.id },
      data: {
        invoiceValue: newInvoiceValue,
        assessableValue: newAssessableValue,
        hsCode: newHsCode,
        importerName: importerName || shipment.importerName,
        supplierName: supplierName || shipment.supplierName,
        portOfImport: portOfImport || shipment.portOfImport,
      },
    }),
    prisma.activity.create({
      data: {
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: 'IMPORT_SHIPMENT_AMENDED',
        details: `Import Shipment ${shipment.id} amended to v${nextVersion}: ${reason}`,
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    amendment,
    shipment: updatedShipment,
    billOfEntry: updatedBoe,
  });
});
