import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { CompanyDetails, drawLetterhead, drawSignatoryBlock, drawPageNumber, formatAmount } from './types';

export interface BillOfEntryData {
  beNumber?: string;
  beDate?: string;
  customsPort?: string;
  igmNumber?: string;
  igmDate?: string;
  chaName?: string;
  chaLicense?: string;
  importerIec?: string;
  supplierName?: string;
  supplierCountry?: string;
  blNumber?: string;
  invoiceNumber?: string;
  cifValue?: number;
  currency?: string;
  assessableValueInr?: number;
  bcdRate?: number;
  bcdAmountInr?: number;
  swsAmountInr?: number;
  igstRate?: number;
  igstAmountInr?: number;
  totalDutyInr?: number;
}

export async function renderBillOfEntryPdf(
  data: BillOfEntryData,
  company: CompanyDetails
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const beNo = data.beNumber || `BE-${Date.now().toString().slice(-7)}`;
  const beDate = data.beDate || new Date().toISOString().split('T')[0];
  const currency = (data.currency || 'USD').toUpperCase().replace(/₹/g, 'INR');

  let y = drawLetterhead(
    page,
    fontBold,
    fontRegular,
    company,
    'BILL OF ENTRY FOR HOME CONSUMPTION',
    `CUSTOMS FORM I | PORT: ${data.customsPort || 'NHAVA SHEVA (INNSA1)'}`
  );

  const leftX = 40;
  const rightX = 310;
  const colWidth = 245;

  // Box 1: Filing & Customs Port
  page.drawRectangle({
    x: leftX,
    y: y - 55,
    width: colWidth,
    height: 55,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 0.5,
  });
  page.drawText('CUSTOMS FILING RECORD:', { x: leftX + 5, y: y - 10, size: 7, font: fontBold });
  page.drawText(`BE Number: ${beNo}`, { x: leftX + 5, y: y - 22, size: 8, font: fontBold, color: rgb(0.12, 0.23, 0.38) });
  page.drawText(`BE Date: ${beDate}  |  Port: ${data.customsPort || 'INNSA1'}`, { x: leftX + 5, y: y - 34, size: 7.5, font: fontRegular });
  page.drawText(`Customs Broker: ${data.chaName || 'ShipSync CHA Logistics'} (${data.chaLicense || 'CHA-7718'})`, { x: leftX + 5, y: y - 46, size: 7, font: fontRegular });

  // Box 2: IGM & Vessel Inward
  page.drawRectangle({
    x: rightX,
    y: y - 55,
    width: colWidth,
    height: 55,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 0.5,
  });
  page.drawText('IGM & CARRIER PARTICULARS:', { x: rightX + 5, y: y - 10, size: 7, font: fontBold });
  page.drawText(`IGM No: ${data.igmNumber || '2398102'}  |  Date: ${data.igmDate || beDate}`, { x: rightX + 5, y: y - 22, size: 7.5, font: fontRegular });
  page.drawText(`B/L Number: ${data.blNumber || 'MEDU99182310'}`, { x: rightX + 5, y: y - 34, size: 7.5, font: fontRegular });
  page.drawText(`Importer IEC: ${company.ieCode || data.importerIec || 'N/A'} | GSTIN: ${company.gstNumber || 'N/A'}`, { x: rightX + 5, y: y - 46, size: 7, font: fontBold });

  y -= 65;

  // Box 3: Importer & Overseas Supplier
  page.drawRectangle({
    x: leftX,
    y: y - 40,
    width: 515,
    height: 40,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 0.5,
  });
  page.drawText(`IMPORTER: ${company.name}  |  GSTIN: ${company.gstNumber || 'N/A'}`, { x: leftX + 5, y: y - 12, size: 7.5, font: fontBold });
  page.drawText(`SUPPLIER: ${data.supplierName || 'Overseas Supplier Corp'} (${data.supplierCountry || 'Exporter Country'})  |  Country of Origin: ${data.supplierCountry || 'Global'}`, { x: leftX + 5, y: y - 24, size: 7.5, font: fontRegular });
  page.drawText(`Commercial Invoice Ref: ${data.invoiceNumber || 'INV-IMP-001'}  |  Valuation Method: Rule 3 Transaction Value`, { x: leftX + 5, y: y - 34, size: 6.5, font: fontRegular, color: rgb(0.35, 0.35, 0.35) });

  y -= 52;

  // Assessable Value Banner
  const cif = data.cifValue || 75000;
  const assessable = data.assessableValueInr || (cif * 85.0 * 1.01);

  page.drawRectangle({
    x: leftX,
    y: y - 28,
    width: 515,
    height: 28,
    color: rgb(0.95, 0.97, 1.0),
    borderColor: rgb(0.75, 0.82, 0.92),
    borderWidth: 0.75,
  });
  page.drawText(`INVOICE CIF VALUE: ${formatAmount(cif, currency)}`, { x: leftX + 15, y: y - 17, size: 8.5, font: fontBold, color: rgb(0.12, 0.23, 0.38) });
  page.drawText(`ASSESSABLE VALUE (CIF + 1%): ${formatAmount(assessable, 'INR')}`, { x: leftX + 245, y: y - 17, size: 8.5, font: fontBold, color: rgb(0.1, 0.45, 0.2) });

  y -= 40;

  // Statutory Customs Assessment Table
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

  page.drawText('STATUTORY DUTY HEAD', { x: leftX + 5, y: y - 12, size: 7.5, font: fontBold });
  page.drawText('NOTIFICATION / SCHEME', { x: leftX + 175, y: y - 12, size: 7.5, font: fontBold });
  page.drawText('RATE', { x: leftX + 340, y: y - 12, size: 7.5, font: fontBold });
  page.drawText('DUTY AMOUNT (INR)', { x: leftX + 420, y: y - 12, size: 7.5, font: fontBold });

  y -= 20;

  const bcdRate = data.bcdRate || 0.10;
  const bcdAmount = data.bcdAmountInr || (assessable * bcdRate);
  const swsAmount = data.swsAmountInr || (bcdAmount * 0.10);
  const igstRate = data.igstRate || 0.18;
  const igstAmount = data.igstAmountInr || ((assessable + bcdAmount + swsAmount) * igstRate);
  const totalDuty = data.totalDutyInr || (bcdAmount + swsAmount + igstAmount);

  const dutyRows = [
    { name: 'Basic Customs Duty (BCD)', notif: 'Customs Tariff Schedule First Schedule', rate: `${(bcdRate * 100).toFixed(1)}%`, amount: bcdAmount },
    { name: 'Social Welfare Surcharge (SWS)', notif: 'Finance Act 2018 (10% of BCD)', rate: '10.0%', amount: swsAmount },
    { name: 'Integrated Goods & Services Tax (IGST)', notif: 'Section 3(7) Customs Tariff Act', rate: `${(igstRate * 100).toFixed(1)}%`, amount: igstAmount },
  ];

  dutyRows.forEach((r) => {
    page.drawText(r.name, { x: leftX + 5, y, size: 7.5, font: fontRegular });
    page.drawText(r.notif.slice(0, 32), { x: leftX + 175, y, size: 7.5, font: fontRegular });
    page.drawText(r.rate, { x: leftX + 340, y, size: 7.5, font: fontRegular });
    page.drawText(formatAmount(r.amount, 'INR').replace('INR ', ''), { x: leftX + 420, y, size: 7.5, font: fontRegular });
    y -= 16;
  });

  page.drawLine({
    start: { x: leftX, y },
    end: { x: leftX + tableWidth, y },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });

  y -= 20;

  // Total Duty Payable Banner
  page.drawRectangle({
    x: leftX + 220,
    y: y - 28,
    width: 295,
    height: 32,
    color: rgb(0.98, 0.94, 0.94),
    borderColor: rgb(0.85, 0.6, 0.6),
    borderWidth: 0.75,
  });

  page.drawText('TOTAL CUSTOMS DUTY PAYABLE:', { x: leftX + 230, y: y - 18, size: 8, font: fontBold, color: rgb(0.6, 0.1, 0.1) });
  page.drawText(formatAmount(totalDuty, 'INR'), { x: leftX + 395, y: y - 18, size: 8.5, font: fontBold, color: rgb(0.7, 0.1, 0.1) });

  y -= 45;

  // Out of Charge (OOC) Customs Section
  page.drawRectangle({
    x: leftX,
    y: y - 60,
    width: tableWidth,
    height: 60,
    color: rgb(0.98, 0.99, 0.98),
    borderColor: rgb(0.65, 0.8, 0.65),
    borderWidth: 0.75,
  });

  page.drawText('CUSTOMS APPRAISEMENT & OUT OF CHARGE (OOC) ORDER:', { x: leftX + 8, y: y - 12, size: 7.5, font: fontBold, color: rgb(0.1, 0.4, 0.15) });
  page.drawText('Assessment Status: FACILITATED UNDER RISK MANAGEMENT SYSTEM (RMS) - SELF-ASSESSMENT ACCEPTED', { x: leftX + 8, y: y - 24, size: 7, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('Section 47 Customs Act 1962: "OUT OF CHARGE (OOC)" granted electronically upon customs duty payment verification.', { x: leftX + 8, y: y - 36, size: 7, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('Payment Challan Reference: ICEGATE-E-PAYMENT-CHALLAN-ACKNOWLEDGED', { x: leftX + 8, y: y - 48, size: 6.5, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

  y -= 80;

  drawSignatoryBlock(page, fontBold, fontRegular, company.name, y, 'Customs House Agent / Authorised Importer');
  drawPageNumber(page, fontRegular, 1, 1);

  return pdfDoc.save();
}
