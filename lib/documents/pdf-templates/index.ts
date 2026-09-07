import { CompanyDetails } from './types';
import { renderCommercialInvoicePdf } from './commercial-invoice';
import { renderPackingListPdf } from './packing-list';
import { renderCertificateOfOriginPdf } from './certificate-of-origin';
import { renderShippingBillPdf } from './shipping-bill';
import { renderBillOfLadingPdf } from './bill-of-lading-draft';
import { renderLutPdf } from './lut';
import { renderBillOfEntryPdf } from './bill-of-entry';

export * from './types';
export * from './commercial-invoice';
export * from './packing-list';
export * from './certificate-of-origin';
export * from './shipping-bill';
export * from './bill-of-lading-draft';
export * from './lut';
export * from './bill-of-entry';

/**
 * Unified statutory PDF document rendering dispatcher.
 * Matches each docType to its dedicated, real-world Indian trade/customs layout.
 * Strictly avoids raw unicode rupee symbols in standard fonts to prevent PDF rendering corruption.
 */
export async function renderPdfDocument(
  docType: string,
  data: any,
  company: CompanyDetails
): Promise<Uint8Array> {
  const normalizedType = docType.toUpperCase().replace(/\s+/g, '_');

  switch (normalizedType) {
    case 'COMMERCIAL_INVOICE':
      return renderCommercialInvoicePdf(data, company);

    case 'PACKING_LIST':
      return renderPackingListPdf(data, company);

    case 'CERTIFICATE_OF_ORIGIN':
      return renderCertificateOfOriginPdf(data, company);

    case 'SHIPPING_BILL':
      return renderShippingBillPdf(data, company);

    case 'BILL_OF_LADING':
    case 'BILL_OF_LADING_DRAFT':
      return renderBillOfLadingPdf(data, company);

    case 'LUT':
      return renderLutPdf(data, company);

    case 'BILL_OF_ENTRY':
      return renderBillOfEntryPdf(data, company);

    default:
      // For any OTHER document type, render as an official trade statement
      return renderCommercialInvoicePdf(data, company);
  }
}
