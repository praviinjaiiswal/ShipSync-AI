import type {
  CanonicalInvoiceData,
  CanonicalPackingListData,
  CanonicalBillOfLadingData,
  DiscrepancyItem,
  DiscrepancyReport,
} from './canonical-types';
import type { ImportShipment } from '@prisma/client';

export interface CrossDocumentInput {
  shipment: Pick<
    ImportShipment,
    'id' | 'importerName' | 'supplierName' | 'hsCode' | 'invoiceValue' | 'currency' | 'portOfImport'
  >;
  invoice?: CanonicalInvoiceData;
  packingList?: CanonicalPackingListData;
  billOfLading?: CanonicalBillOfLadingData;
}

/**
 * Cross-Document Discrepancy Detector Engine.
 * Cross-references data points between Commercial Invoice, Packing List, Bill of Lading,
 * and the statutory Import Shipment declaration.
 */
export function detectDiscrepancies(input: CrossDocumentInput): DiscrepancyReport {
  const { shipment, invoice, packingList, billOfLading } = input;
  const discrepancies: DiscrepancyItem[] = [];

  // ==========================================
  // 1. Weight Discrepancies
  // ==========================================
  if (packingList) {
    // Statutory Rule: Net weight can NEVER exceed Gross weight
    if (packingList.netWeightKg > packingList.grossWeightKg) {
      discrepancies.push({
        type: 'WEIGHT',
        severity: 'ERROR',
        field: 'netWeightKg',
        expected: `<= ${packingList.grossWeightKg} KGS (Gross Weight)`,
        actual: `${packingList.netWeightKg} KGS (Net Weight)`,
        message: 'Statutory Violation: Net weight exceeds gross weight on Packing List.',
        docSources: ['PACKING_LIST'],
      });
    }

    // Cross-check: Packing List Gross Weight vs Bill of Lading Gross Weight
    if (billOfLading?.grossWeightKg && billOfLading.grossWeightKg > 0) {
      const diff = Math.abs(packingList.grossWeightKg - billOfLading.grossWeightKg);
      const varianceRatio = diff / billOfLading.grossWeightKg;

      // Variance > 1% flags a customs inspection risk warning
      if (varianceRatio > 0.01) {
        discrepancies.push({
          type: 'WEIGHT',
          severity: 'WARNING',
          field: 'grossWeightKg',
          expected: `${billOfLading.grossWeightKg} KGS (Bill of Lading)`,
          actual: `${packingList.grossWeightKg} KGS (Packing List)`,
          message: `Gross weight variance between BL and Packing List is ${(varianceRatio * 100).toFixed(1)}% (>1% tolerance).`,
          docSources: ['PACKING_LIST', 'BILL_OF_LADING'],
        });
      }
    }
  }

  // ==========================================
  // 2. Value & Currency Discrepancies
  // ==========================================
  if (invoice) {
    // Value mismatch vs declared invoice value
    const valueDiff = Math.abs(invoice.totalAmount - shipment.invoiceValue);
    if (valueDiff > 0.01) {
      discrepancies.push({
        type: 'VALUE',
        severity: 'ERROR',
        field: 'invoiceValue',
        expected: `${shipment.currency} ${shipment.invoiceValue.toFixed(2)} (Declared Declaration)`,
        actual: `${invoice.currency} ${invoice.totalAmount.toFixed(2)} (Commercial Invoice)`,
        message: 'Commercial Invoice total amount differs from declared import shipment value.',
        docSources: ['COMMERCIAL_INVOICE', 'IMPORT_DECLARATION'],
      });
    }

    // Currency mismatch
    if (invoice.currency.toUpperCase() !== shipment.currency.toUpperCase()) {
      discrepancies.push({
        type: 'CURRENCY',
        severity: 'ERROR',
        field: 'currency',
        expected: shipment.currency,
        actual: invoice.currency,
        message: `Currency mismatch: Commercial Invoice is in ${invoice.currency}, but declaration is in ${shipment.currency}.`,
        docSources: ['COMMERCIAL_INVOICE', 'IMPORT_DECLARATION'],
      });
    }

    // HS Code mismatch check
    if (invoice.items && invoice.items.length > 0) {
      const invoiceHsCodes = invoice.items
        .map((item) => item.hsCode?.replace(/\s/g, ''))
        .filter(Boolean);

      if (invoiceHsCodes.length > 0) {
        const declaredHs = shipment.hsCode.replace(/\s/g, '');
        const hasMatch = invoiceHsCodes.some((code) => code === declaredHs);
        if (!hasMatch) {
          discrepancies.push({
            type: 'HS_CODE',
            severity: 'ERROR',
            field: 'hsCode',
            expected: declaredHs,
            actual: invoiceHsCodes.join(', '),
            message: `HS Code mismatch: Invoice specifies [${invoiceHsCodes.join(', ')}], but declaration specifies ${declaredHs}.`,
            docSources: ['COMMERCIAL_INVOICE', 'IMPORT_DECLARATION'],
          });
        }
      }
    }
  }

  // ==========================================
  // 3. Quantity Discrepancies
  // ==========================================
  if (invoice && packingList) {
    if (invoice.totalQuantity && packingList.items) {
      const plTotalQty = packingList.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      if (plTotalQty > 0 && plTotalQty !== invoice.totalQuantity) {
        discrepancies.push({
          type: 'QUANTITY',
          severity: 'ERROR',
          field: 'totalQuantity',
          expected: `${invoice.totalQuantity} Units (Commercial Invoice)`,
          actual: `${plTotalQty} Units (Packing List)`,
          message: 'Quantity mismatch between Commercial Invoice and Packing List items.',
          docSources: ['COMMERCIAL_INVOICE', 'PACKING_LIST'],
        });
      }
    }
  }

  // ==========================================
  // 4. Party Name Discrepancies
  // ==========================================
  if (invoice) {
    // Importer name check (fuzzy case-insensitive substring)
    const invBuyer = invoice.buyerName.toLowerCase();
    const declBuyer = shipment.importerName.toLowerCase();
    if (!invBuyer.includes(declBuyer) && !declBuyer.includes(invBuyer)) {
      discrepancies.push({
        type: 'PARTY',
        severity: 'WARNING',
        field: 'importerName',
        expected: shipment.importerName,
        actual: invoice.buyerName,
        message: 'Importer/Buyer party name does not match between Commercial Invoice and declaration.',
        docSources: ['COMMERCIAL_INVOICE', 'IMPORT_DECLARATION'],
      });
    }

    // Supplier name check
    const invSeller = invoice.sellerName.toLowerCase();
    const declSeller = shipment.supplierName.toLowerCase();
    if (!invSeller.includes(declSeller) && !declSeller.includes(invSeller)) {
      discrepancies.push({
        type: 'PARTY',
        severity: 'WARNING',
        field: 'supplierName',
        expected: shipment.supplierName,
        actual: invoice.sellerName,
        message: 'Supplier/Seller party name does not match between Commercial Invoice and declaration.',
        docSources: ['COMMERCIAL_INVOICE', 'IMPORT_DECLARATION'],
      });
    }
  }

  const errorCount = discrepancies.filter((d) => d.severity === 'ERROR').length;
  const warningCount = discrepancies.filter((d) => d.severity === 'WARNING').length;

  return {
    hasBlockingErrors: errorCount > 0,
    totalDiscrepancies: discrepancies.length,
    errorCount,
    warningCount,
    discrepancies,
    checkedAt: new Date().toISOString(),
  };
}
