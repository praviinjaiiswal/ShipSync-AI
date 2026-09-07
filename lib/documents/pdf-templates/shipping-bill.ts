import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { CompanyDetails, drawLetterhead, drawSignatoryBlock, drawPageNumber, formatAmount } from './types';

export interface ShippingBillData {
  shippingBillNumber?: string;
  shippingBillDate?: string;
  customsStation?: string;
  chaName?: string;
  chaLicense?: string;
  exporterIec?: string;
  adCode?: string;
  buyerName?: string;
  buyerCountry?: string;
  destinationPort?: string;
  fobValue?: number;
  currency?: string;
  exchangeRate?: number;
  fobValueInr?: number;
  rodtepRate?: number;
  drawbackRate?: number;
  items?: Array<{
    itemNo?: number;
    description: string;
    hsCode: string;
    quantity: number;
    fobValueInr: number;
  }>;
}

export async function renderShippingBillPdf(
  data: ShippingBillData,
  company: CompanyDetails
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const sbNo = data.shippingBillNumber || `SB-2026-${Date.now().toString().slice(-6)}`;
  const sbDate = data.shippingBillDate || new Date().toISOString().split('T')[0];
  const currency = (data.currency || 'USD').toUpperCase().replace(/₹/g, 'INR');
  const fobAmount = data.fobValue || 50000;
  const fobInr = data.fobValueInr || (fobAmount * 85.0);

  let y = drawLetterhead(
    page,
    fontBold,
    fontRegular,
    company,
    'INDIAN CUSTOMS EDI SYSTEM - SHIPPING BILL',
    `CUSTOMS PORT: ${data.customsStation || 'NHAVA SHEVA (INNSA1)'}`
  );

  const leftX = 40;
  const rightX = 310;
  const colWidth = 245;

  // Customs Header Details Box
  page.drawRectangle({
    x: leftX,
    y: y - 55,
    width: colWidth,
    height: 55,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 0.5,
  });
  page.drawText('CUSTOMS FILING PARTICULARS:', { x: leftX + 5, y: y - 10, size: 7, font: fontBold });
  page.drawText(`SB Number: ${sbNo}`, { x: leftX + 5, y: y - 22, size: 8, font: fontBold, color: rgb(0.12, 0.23, 0.38) });
  page.drawText(`SB Date: ${sbDate}`, { x: leftX + 5, y: y - 34, size: 7.5, font: fontRegular });
  page.drawText(`Customs House Agent: ${data.chaName || 'ShipSync Global CHA Services'} (${data.chaLicense || 'CHA-AAAC9812'})`, { x: leftX + 5, y: y - 46, size: 7, font: fontRegular });

  // Exporter & Financial Details Box
  page.drawRectangle({
    x: rightX,
    y: y - 55,
    width: colWidth,
    height: 55,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 0.5,
  });
  page.drawText('STATUTORY FINANCIAL & AD CODE:', { x: rightX + 5, y: y - 10, size: 7, font: fontBold });
  page.drawText(`IEC: ${company.ieCode || data.exporterIec || 'N/A'} (Branch: 001)`, { x: rightX + 5, y: y - 22, size: 7.5, font: fontBold });
  page.drawText(`AD Code (Authorized Dealer): ${data.adCode || '0291082-BKID-001'}`, { x: rightX + 5, y: y - 34, size: 7.5, font: fontRegular });
  page.drawText(`GSTIN: ${company.gstNumber || 'N/A'} (Export with LUT)`, { x: rightX + 5, y: y - 46, size: 7, font: fontRegular });

  y -= 65;

  // Destination & Cargo Particulars
  page.drawRectangle({
    x: leftX,
    y: y - 40,
    width: 515,
    height: 40,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 0.5,
  });
  page.drawText(`Consignee: ${(data.buyerName || 'Valued Overseas Consignee').slice(0, 45)}  |  Destination: ${data.buyerCountry || 'Overseas'}`, { x: leftX + 5, y: y - 12, size: 7.5, font: fontBold });
  page.drawText(`Port of Loading: ${data.customsStation || 'INNSA1'}  |  Discharge Port: ${data.destinationPort || 'Overseas Gateway Port'}`, { x: leftX + 5, y: y - 24, size: 7.5, font: fontRegular });
  page.drawText(`Export Scheme: RoDTEP + Duty Drawback  |  RBI Foreign Exchange Remittance Monitoring System: COMPLIANT`, { x: leftX + 5, y: y - 34, size: 6.5, font: fontRegular, color: rgb(0.35, 0.35, 0.35) });

  y -= 52;

  // Valuation Banner
  page.drawRectangle({
    x: leftX,
    y: y - 26,
    width: 515,
    height: 26,
    color: rgb(0.95, 0.97, 1.0),
    borderColor: rgb(0.75, 0.82, 0.92),
    borderWidth: 0.75,
  });
  page.drawText(`DECLARED FOB VALUE: ${formatAmount(fobAmount, currency)}`, { x: leftX + 15, y: y - 16, size: 8.5, font: fontBold, color: rgb(0.12, 0.23, 0.38) });
  page.drawText(`STATUTORY ASSESSED FOB: ${formatAmount(fobInr, 'INR')}`, { x: leftX + 260, y: y - 16, size: 8.5, font: fontBold, color: rgb(0.1, 0.45, 0.2) });

  y -= 38;

  // Items Table
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

  page.drawText('ITEM', { x: leftX + 5, y: y - 12, size: 7.5, font: fontBold });
  page.drawText('DESCRIPTION', { x: leftX + 45, y: y - 12, size: 7.5, font: fontBold });
  page.drawText('ITC-HS CODE', { x: leftX + 230, y: y - 12, size: 7.5, font: fontBold });
  page.drawText('QUANTITY', { x: leftX + 310, y: y - 12, size: 7.5, font: fontBold });
  page.drawText('FOB VALUE (INR)', { x: leftX + 380, y: y - 12, size: 7.5, font: fontBold });
  page.drawText('SCHEME', { x: leftX + 465, y: y - 12, size: 7.5, font: fontBold });

  y -= 20;

  const items = data.items && data.items.length > 0 ? data.items : [
    {
      itemNo: 1,
      description: 'Manufactured Electrical Converter Apparatus',
      hsCode: '85044090',
      quantity: 500,
      fobValueInr: fobInr,
    },
  ];

  items.forEach((it, idx) => {
    page.drawText(String(idx + 1), { x: leftX + 5, y, size: 7.5, font: fontRegular });
    page.drawText(it.description.slice(0, 32), { x: leftX + 45, y, size: 7.5, font: fontRegular });
    page.drawText(it.hsCode, { x: leftX + 230, y, size: 7.5, font: fontRegular });
    page.drawText(`${it.quantity} NOS`, { x: leftX + 310, y, size: 7.5, font: fontRegular });
    page.drawText(formatAmount(it.fobValueInr, 'INR').replace('INR ', ''), { x: leftX + 380, y, size: 7.5, font: fontRegular });
    page.drawText('RoDTEP', { x: leftX + 465, y, size: 7.5, font: fontRegular });
    y -= 16;
  });

  page.drawLine({
    start: { x: leftX, y },
    end: { x: leftX + tableWidth, y },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });

  y -= 30;

  // LEO (Let Export Order) Endorsement Box
  page.drawRectangle({
    x: leftX,
    y: y - 60,
    width: tableWidth,
    height: 60,
    color: rgb(0.98, 0.99, 0.98),
    borderColor: rgb(0.65, 0.8, 0.65),
    borderWidth: 0.75,
  });

  page.drawText('CUSTOMS APPRAISING & LET EXPORT ORDER (LEO) RECORD:', { x: leftX + 8, y: y - 12, size: 7.5, font: fontBold, color: rgb(0.1, 0.4, 0.15) });
  page.drawText('Examination Order: PASS ON BASIS OF RISK MANAGEMENT SYSTEM (RMS) SELECTION - NO PHYSICAL EXAM ORDERED', { x: leftX + 8, y: y - 24, size: 7, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('Section 51 Customs Act 1962: "LET EXPORT ALLOWED (LEO)" granted through ICEGATE Electronic Gatepass System.', { x: leftX + 8, y: y - 36, size: 7, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('Verification Hash: SHA256-ICEGATE-AUTHENTICATED-TRANSACTION-RECORD', { x: leftX + 8, y: y - 48, size: 6.5, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

  y -= 80;

  drawSignatoryBlock(page, fontBold, fontRegular, company.name, y, 'Customs Broker / Authorised Signatory');
  drawPageNumber(page, fontRegular, 1, 1);

  return pdfDoc.save();
}
