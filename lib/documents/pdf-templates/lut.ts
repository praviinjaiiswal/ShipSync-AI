import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { CompanyDetails, drawLetterhead, drawPageNumber } from './types';

export interface LutData {
  arnNumber?: string;
  arnDate?: string;
  financialYear?: string;
  jurisdiction?: string;
  authorizedSignatoryName?: string;
  authorizedSignatoryDesignation?: string;
  witness1Name?: string;
  witness1Address?: string;
  witness2Name?: string;
  witness2Address?: string;
}

export async function renderLutPdf(
  data: LutData,
  company: CompanyDetails
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const arn = data.arnNumber || `AD27${Date.now().toString().slice(-10)}Z`;
  const fy = data.financialYear || '2024-2026';
  const arnDate = data.arnDate || new Date().toISOString().split('T')[0];

  let y = drawLetterhead(
    page,
    fontBold,
    fontRegular,
    company,
    'FORM GST RFD-11: LETTER OF UNDERTAKING (LUT)',
    `RULE 96A CGST RULES | FY: ${fy}`
  );

  const leftX = 40;
  const tableWidth = 515;

  // ARN Banner
  page.drawRectangle({
    x: leftX,
    y: y - 32,
    width: tableWidth,
    height: 32,
    color: rgb(0.95, 0.98, 0.96),
    borderColor: rgb(0.7, 0.85, 0.75),
    borderWidth: 0.75,
  });

  page.drawText(`APPLICATION REFERENCE NUMBER (ARN): ${arn}`, { x: leftX + 10, y: y - 14, size: 8.5, font: fontBold, color: rgb(0.1, 0.4, 0.2) });
  page.drawText(`Filing Date: ${arnDate}  |  Validity: Entire Financial Year ${fy}`, { x: leftX + 10, y: y - 24, size: 7.5, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });

  y -= 48;

  // Taxpayer Particulars Table
  page.drawRectangle({
    x: leftX,
    y: y - 65,
    width: tableWidth,
    height: 65,
    borderColor: rgb(0.75, 0.75, 0.75),
    borderWidth: 0.5,
  });

  page.drawText('TAXPAYER STATUTORY IDENTIFICATION:', { x: leftX + 6, y: y - 10, size: 7, font: fontBold });
  page.drawText(`GSTIN: ${company.gstNumber || '27AAAAA0000A1Z5'}`, { x: leftX + 6, y: y - 22, size: 8, font: fontBold });
  page.drawText(`Legal Name: ${company.name}`, { x: leftX + 6, y: y - 34, size: 7.5, font: fontRegular });
  page.drawText(`Registered Address: ${(company.address || 'Principal Place of Business, Maharashtra, India').slice(0, 90)}`, { x: leftX + 6, y: y - 46, size: 7, font: fontRegular });
  page.drawText(`Jurisdictional Office: ${data.jurisdiction || 'Division II, Range IV, Mumbai Central GST Commissionerate'}`, { x: leftX + 6, y: y - 58, size: 7, font: fontRegular });

  y -= 80;

  // Statutory Undertaking Text
  page.drawText('STATUTORY UNDERTAKINGS PURSUANT TO RULE 96A:', { x: leftX, y, size: 8, font: fontBold, color: rgb(0.12, 0.23, 0.38) });
  y -= 14;

  const undertakings = [
    '1. To export the goods or services supplied without payment of integrated tax within a period of fifteen days after the expiry of three months, or such further period as may be allowed by the Commissioner, from the date of issue of the invoice for export.',
    '2. To pay the integrated tax along with interest at the rate of eighteen percent specified under sub-section (1) of section 50 in the event of failure to export the goods or services within the period specified in clause (1) above.',
    '3. To observe all the provisions of the Goods and Services Tax Act, 2017 and rules made thereunder in respect of export of goods or services without payment of integrated tax.',
    '4. To realize foreign exchange remittance proceeds within the timeframe mandated by the Reserve Bank of India (RBI) under the Foreign Exchange Management Act, 1999 (FEMA).',
  ];

  undertakings.forEach((clause) => {
    page.drawText(clause.slice(0, 110), { x: leftX, y, size: 7, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    if (clause.length > 110) {
      y -= 9;
      page.drawText(clause.slice(110), { x: leftX + 12, y, size: 7, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    }
    y -= 14;
  });

  y -= 15;

  // Signatory & Witness Box
  const colWidth = 245;

  // Left: Authorized Signatory
  page.drawRectangle({
    x: leftX,
    y: y - 85,
    width: colWidth,
    height: 85,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 0.5,
  });

  page.drawText('SIGNATURE OF AUTHORIZED SIGNATORY:', { x: leftX + 5, y: y - 10, size: 7, font: fontBold });
  page.drawText(`Name: ${data.authorizedSignatoryName || 'Principal Director / Officer'}`, { x: leftX + 5, y: y - 24, size: 7.5, font: fontRegular });
  page.drawText(`Designation: ${data.authorizedSignatoryDesignation || 'Director / Authorized Signatory'}`, { x: leftX + 5, y: y - 36, size: 7.5, font: fontRegular });
  page.drawText(`Date & Place: ${arnDate}, Mumbai`, { x: leftX + 5, y: y - 48, size: 7.5, font: fontRegular });
  page.drawText('(Digitally signed under CGST Common Portal OTP / DSC)', { x: leftX + 5, y: y - 72, size: 6.5, font: fontBold, color: rgb(0.1, 0.4, 0.2) });

  // Right: Witnesses
  page.drawRectangle({
    x: leftX + colWidth + 25,
    y: y - 85,
    width: colWidth,
    height: 85,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 0.5,
  });

  page.drawText('WITNESS PARTICULARS (CGST MANDATE):', { x: leftX + colWidth + 30, y: y - 10, size: 7, font: fontBold });
  page.drawText(`1. ${data.witness1Name || 'Rajesh V. Sharma'}, Mumbai (Chartered Accountant)`, { x: leftX + colWidth + 30, y: y - 24, size: 7, font: fontRegular });
  page.drawText(`   Address: Marine Lines, Mumbai - 400020`, { x: leftX + colWidth + 30, y: y - 34, size: 6.5, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(`2. ${data.witness2Name || 'Vikramaditya Rao'}, Mumbai (Compliance Officer)`, { x: leftX + colWidth + 30, y: y - 48, size: 7, font: fontRegular });
  page.drawText(`   Address: Andheri East, Mumbai - 400069`, { x: leftX + colWidth + 30, y: y - 58, size: 6.5, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
  page.drawText('(Verified against GST Common Portal records)', { x: leftX + colWidth + 30, y: y - 72, size: 6.5, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

  drawPageNumber(page, fontRegular, 1, 1);

  return pdfDoc.save();
}
