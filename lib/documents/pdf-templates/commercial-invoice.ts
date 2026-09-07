import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { CompanyDetails, drawLetterhead, drawSignatoryBlock, drawPageNumber, formatAmount } from './types';

export interface CommercialInvoiceData {
  invoiceNumber?: string;
  invoiceDate?: string;
  buyerName?: string;
  buyerCountry?: string;
  buyerAddress?: string;
  originCountry?: string;
  destinationCountry?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  incoterm?: string;
  currency?: string;
  lineItems?: Array<{
    itemNo?: number;
    description: string;
    hsCode: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    totalAmount: number;
  }>;
  fobValue?: number;
  totalAmount?: number;
  declaration?: string;
}

export async function renderCommercialInvoicePdf(
  data: CommercialInvoiceData,
  company: CompanyDetails
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 dimensions
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const invoiceNo = data.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
  const invoiceDate = data.invoiceDate || new Date().toISOString().split('T')[0];
  const currency = (data.currency || 'USD').toUpperCase().replace(/₹/g, 'INR');

  let y = drawLetterhead(
    page,
    fontBold,
    fontRegular,
    company,
    'COMMERCIAL INVOICE',
    `INVOICE NO: ${invoiceNo}`
  );

  // Metadata Grid
  const leftX = 40;
  const rightX = 310;
  const colWidth = 245;

  // Box 1: Exporter
  page.drawRectangle({
    x: leftX,
    y: y - 55,
    width: colWidth,
    height: 55,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 0.5,
  });
  page.drawText('EXPORTER / CONSIGNOR:', { x: leftX + 5, y: y - 10, size: 7, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(company.name.slice(0, 45), { x: leftX + 5, y: y - 20, size: 8, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText((company.address || 'India').slice(0, 55), { x: leftX + 5, y: y - 30, size: 7, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(`IEC: ${company.ieCode || 'N/A'} | GSTIN: ${company.gstNumber || 'N/A'}`, { x: leftX + 5, y: y - 40, size: 7, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

  // Box 2: Invoice Details
  page.drawRectangle({
    x: rightX,
    y: y - 55,
    width: colWidth,
    height: 55,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 0.5,
  });
  page.drawText(`Invoice No: ${invoiceNo}`, { x: rightX + 5, y: y - 12, size: 8, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText(`Date: ${invoiceDate}`, { x: rightX + 5, y: y - 24, size: 7.5, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(`Incoterm: ${data.incoterm || 'FOB'}`, { x: rightX + 5, y: y - 36, size: 7.5, font: fontBold, color: rgb(0.12, 0.23, 0.38) });
  page.drawText(`Country of Origin: India`, { x: rightX + 5, y: y - 48, size: 7.5, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

  y -= 65;

  // Box 3: Consignee
  page.drawRectangle({
    x: leftX,
    y: y - 50,
    width: colWidth,
    height: 50,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 0.5,
  });
  page.drawText('CONSIGNEE / BUYER:', { x: leftX + 5, y: y - 10, size: 7, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText((data.buyerName || 'Valued Overseas Buyer').slice(0, 45), { x: leftX + 5, y: y - 20, size: 8, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText((data.buyerAddress || data.buyerCountry || 'Overseas Address').slice(0, 50), { x: leftX + 5, y: y - 30, size: 7, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(`Destination: ${data.destinationCountry || data.buyerCountry || 'Overseas'}`, { x: leftX + 5, y: y - 40, size: 7, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

  // Box 4: Transport Details
  page.drawRectangle({
    x: rightX,
    y: y - 50,
    width: colWidth,
    height: 50,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 0.5,
  });
  page.drawText(`Port of Loading: ${data.portOfLoading || 'Nhava Sheva (INNSA1)'}`, { x: rightX + 5, y: y - 12, size: 7.5, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(`Port of Discharge: ${data.portOfDischarge || 'Destination Port'}`, { x: rightX + 5, y: y - 24, size: 7.5, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(`Terms of Payment: CAD / Letter of Credit`, { x: rightX + 5, y: y - 36, size: 7.5, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

  y -= 65;

  // Table Header
  const tableWidth = 515;
  page.drawRectangle({
    x: leftX,
    y: y - 18,
    width: tableWidth,
    height: 18,
    color: rgb(0.9, 0.93, 0.96),
    borderColor: rgb(0.75, 0.8, 0.85),
    borderWidth: 0.5,
  });

  page.drawText('SR', { x: leftX + 5, y: y - 12, size: 7.5, font: fontBold });
  page.drawText('DESCRIPTION OF GOODS', { x: leftX + 30, y: y - 12, size: 7.5, font: fontBold });
  page.drawText('HS CODE', { x: leftX + 260, y: y - 12, size: 7.5, font: fontBold });
  page.drawText('QTY', { x: leftX + 330, y: y - 12, size: 7.5, font: fontBold });
  page.drawText(`RATE (${currency})`, { x: leftX + 380, y: y - 12, size: 7.5, font: fontBold });
  page.drawText(`TOTAL (${currency})`, { x: leftX + 440, y: y - 12, size: 7.5, font: fontBold });

  y -= 20;

  // Line items
  const items = data.lineItems && data.lineItems.length > 0 ? data.lineItems : [
    {
      itemNo: 1,
      description: 'Manufactured Industrial Export Goods',
      hsCode: '85044090',
      quantity: 1,
      unit: 'NOS',
      unitPrice: data.totalAmount || data.fobValue || 50000,
      totalAmount: data.totalAmount || data.fobValue || 50000,
    },
  ];

  let totalInvoiceSum = 0;
  items.forEach((item, index) => {
    const itemTotal = item.totalAmount || (item.quantity * item.unitPrice);
    totalInvoiceSum += itemTotal;

    page.drawText(String(index + 1), { x: leftX + 5, y, size: 7.5, font: fontRegular });
    page.drawText(item.description.slice(0, 42), { x: leftX + 30, y, size: 7.5, font: fontRegular });
    page.drawText(item.hsCode || '85044090', { x: leftX + 260, y, size: 7.5, font: fontRegular });
    page.drawText(`${item.quantity} ${item.unit || 'NOS'}`, { x: leftX + 330, y, size: 7.5, font: fontRegular });
    page.drawText(formatAmount(item.unitPrice, currency).replace(`${currency} `, ''), { x: leftX + 380, y, size: 7.5, font: fontRegular });
    page.drawText(formatAmount(itemTotal, currency).replace(`${currency} `, ''), { x: leftX + 440, y, size: 7.5, font: fontRegular });

    y -= 14;
  });

  // Table bottom border
  page.drawLine({
    start: { x: leftX, y },
    end: { x: leftX + tableWidth, y },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });

  y -= 18;

  // Total Summary Box
  const totalValue = data.totalAmount || totalInvoiceSum;
  page.drawRectangle({
    x: leftX + 280,
    y: y - 25,
    width: 235,
    height: 30,
    color: rgb(0.96, 0.98, 1.0),
    borderColor: rgb(0.7, 0.8, 0.9),
    borderWidth: 0.75,
  });

  page.drawText('TOTAL INVOICE VALUE:', {
    x: leftX + 290,
    y: y - 16,
    size: 8.5,
    font: fontBold,
    color: rgb(0.12, 0.23, 0.38),
  });

  page.drawText(formatAmount(totalValue, currency), {
    x: leftX + 410,
    y: y - 16,
    size: 9,
    font: fontBold,
    color: rgb(0.1, 0.5, 0.2),
  });

  y -= 45;

  // Statutory Declaration
  page.drawRectangle({
    x: leftX,
    y: y - 45,
    width: tableWidth,
    height: 45,
    color: rgb(0.98, 0.98, 0.98),
    borderColor: rgb(0.85, 0.85, 0.85),
    borderWidth: 0.5,
  });

  page.drawText('STATUTORY DECLARATIONS & UNDERTAKINGS:', { x: leftX + 6, y: y - 10, size: 7, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(
    '1. We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
    { x: leftX + 6, y: y - 20, size: 6.5, font: fontRegular, color: rgb(0.35, 0.35, 0.35) }
  );
  page.drawText(
    '2. Supply meant for export under Letter of Undertaking (LUT) without payment of integrated tax (IGST) per CGST Rule 96A.',
    { x: leftX + 6, y: y - 30, size: 6.5, font: fontRegular, color: rgb(0.35, 0.35, 0.35) }
  );
  page.drawText(
    '3. Proceeds will be realized in accordance with statutory RBI Foreign Exchange Management Act (FEMA) timelines.',
    { x: leftX + 6, y: y - 40, size: 6.5, font: fontRegular, color: rgb(0.35, 0.35, 0.35) }
  );

  y -= 60;

  // Signatory
  drawSignatoryBlock(page, fontBold, fontRegular, company.name, y);
  drawPageNumber(page, fontRegular, 1, 1);

  return pdfDoc.save();
}
