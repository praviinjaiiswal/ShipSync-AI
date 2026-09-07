import { z } from 'zod';

export const commercialInvoiceSchema = z.object({
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  buyerName: z.string().optional(),
  buyerCountry: z.string().optional(),
  buyerAddress: z.string().optional(),
  originCountry: z.string().default('India'),
  destinationCountry: z.string().optional(),
  portOfLoading: z.string().optional(),
  portOfDischarge: z.string().optional(),
  incoterm: z.string().default('FOB'),
  currency: z.string().default('USD'),
  fobValue: z.number().optional(),
  totalAmount: z.number().optional(),
  lineItems: z.array(
    z.object({
      itemNo: z.number().optional(),
      description: z.string(),
      hsCode: z.string(),
      quantity: z.number(),
      unit: z.string().optional(),
      unitPrice: z.number(),
      totalAmount: z.number(),
    })
  ).optional(),
});

export const packingListSchema = z.object({
  packingListNumber: z.string().optional(),
  packingListDate: z.string().optional(),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  buyerName: z.string().optional(),
  buyerCountry: z.string().optional(),
  portOfLoading: z.string().optional(),
  portOfDischarge: z.string().optional(),
  totalPackages: z.number().optional(),
  totalNetWeightKg: z.number().optional(),
  totalGrossWeightKg: z.number().optional(),
  containerNumber: z.string().optional(),
  sealNumber: z.string().optional(),
  packages: z.array(
    z.object({
      packageNo: z.string(),
      description: z.string(),
      quantity: z.number(),
      unit: z.string().optional(),
      netWeightKg: z.number(),
      grossWeightKg: z.number(),
      dimensionsCm: z.string().optional(),
    })
  ).optional(),
});

export const certificateOfOriginSchema = z.object({
  certificateNumber: z.string().optional(),
  issueDate: z.string().optional(),
  consignorName: z.string().optional(),
  consignorAddress: z.string().optional(),
  consigneeName: z.string().optional(),
  consigneeAddress: z.string().optional(),
  consigneeCountry: z.string().optional(),
  transportDetails: z.string().optional(),
  portOfLoading: z.string().optional(),
  portOfDischarge: z.string().optional(),
  originCountry: z.string().default('India'),
  invoiceNumber: z.string().optional(),
  items: z.array(
    z.object({
      itemNo: z.number().optional(),
      description: z.string(),
      hsCode: z.string(),
      quantity: z.number(),
      grossWeightKg: z.number().optional(),
    })
  ).optional(),
});

export const shippingBillSchema = z.object({
  shippingBillNumber: z.string().optional(),
  shippingBillDate: z.string().optional(),
  customsStation: z.string().optional(),
  chaName: z.string().optional(),
  chaLicense: z.string().optional(),
  exporterIec: z.string().optional(),
  adCode: z.string().optional(),
  buyerName: z.string().optional(),
  buyerCountry: z.string().optional(),
  destinationPort: z.string().optional(),
  fobValue: z.number().optional(),
  currency: z.string().default('USD'),
  exchangeRate: z.number().default(85.0),
  fobValueInr: z.number().optional(),
  rodtepRate: z.number().optional(),
  drawbackRate: z.number().optional(),
  items: z.array(
    z.object({
      itemNo: z.number().optional(),
      description: z.string(),
      hsCode: z.string(),
      quantity: z.number(),
      fobValueInr: z.number(),
    })
  ).optional(),
});

export const billOfLadingSchema = z.object({
  blNumber: z.string().optional(),
  issueDate: z.string().optional(),
  shipperName: z.string().optional(),
  shipperAddress: z.string().optional(),
  consigneeName: z.string().optional(),
  consigneeAddress: z.string().optional(),
  notifyParty: z.string().optional(),
  vesselName: z.string().optional(),
  voyageNumber: z.string().optional(),
  portOfLoading: z.string().optional(),
  portOfDischarge: z.string().optional(),
  placeOfDelivery: z.string().optional(),
  containerNumber: z.string().optional(),
  sealNumber: z.string().optional(),
  grossWeightKg: z.number().optional(),
  measurementCbm: z.number().optional(),
  totalPackages: z.number().optional(),
  packageType: z.string().optional(),
  descriptionOfGoods: z.string().optional(),
  freightTerm: z.string().default('FREIGHT PREPAID'),
});

export const lutSchema = z.object({
  arnNumber: z.string().optional(),
  arnDate: z.string().optional(),
  financialYear: z.string().default('2024-2026'),
  jurisdiction: z.string().optional(),
  authorizedSignatoryName: z.string().optional(),
  authorizedSignatoryDesignation: z.string().optional(),
  witness1Name: z.string().optional(),
  witness1Address: z.string().optional(),
  witness2Name: z.string().optional(),
  witness2Address: z.string().optional(),
});

export const billOfEntrySchema = z.object({
  beNumber: z.string().optional(),
  beDate: z.string().optional(),
  customsPort: z.string().optional(),
  igmNumber: z.string().optional(),
  igmDate: z.string().optional(),
  chaName: z.string().optional(),
  chaLicense: z.string().optional(),
  importerIec: z.string().optional(),
  supplierName: z.string().optional(),
  supplierCountry: z.string().optional(),
  blNumber: z.string().optional(),
  invoiceNumber: z.string().optional(),
  cifValue: z.number().optional(),
  currency: z.string().default('USD'),
  assessableValueInr: z.number().optional(),
  bcdRate: z.number().optional(),
  bcdAmountInr: z.number().optional(),
  swsAmountInr: z.number().optional(),
  igstRate: z.number().optional(),
  igstAmountInr: z.number().optional(),
  totalDutyInr: z.number().optional(),
});

export function validateDocPayload(docType: string, raw: any) {
  const norm = docType.toUpperCase().replace(/\s+/g, '_');
  switch (norm) {
    case 'COMMERCIAL_INVOICE':
      return commercialInvoiceSchema.safeParse(raw);
    case 'PACKING_LIST':
      return packingListSchema.safeParse(raw);
    case 'CERTIFICATE_OF_ORIGIN':
      return certificateOfOriginSchema.safeParse(raw);
    case 'SHIPPING_BILL':
      return shippingBillSchema.safeParse(raw);
    case 'BILL_OF_LADING':
    case 'BILL_OF_LADING_DRAFT':
      return billOfLadingSchema.safeParse(raw);
    case 'LUT':
      return lutSchema.safeParse(raw);
    case 'BILL_OF_ENTRY':
      return billOfEntrySchema.safeParse(raw);
    default:
      return commercialInvoiceSchema.safeParse(raw);
  }
}
