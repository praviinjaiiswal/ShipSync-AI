import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { CompanyDetails, drawLetterhead, drawSignatoryBlock, drawPageNumber, formatAmount } from './types';

export interface CertificateOfOriginData {
  certificateNumber?: string;
  issueDate?: string;
  consignorName?: string;
  consignorAddress?: string;
  consigneeName?: string;
  consigneeAddress?: string;
  consigneeCountry?: string;
  transportDetails?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  items?: Array<{
    itemNo?: number;
    description: string;
    hsCode: string;
    quantity: number;
    grossWeightKg?: number;
  }>;
  invoiceNumber?: string;
  invoiceDate?: string;
  originCountry?: string;
}

export async function renderCertificateOfOriginPdf(
  data: CertificateOfOriginData,
  company: CompanyDetails
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const certNo = data.certificateNumber || `COO-${Date.now().toString().slice(-6)}`;
  const certDate = data.issueDate || new Date().toISOString().split('T')[0];

  let y = drawLetterhead(
    page,
    fontBold,
    fontRegular,
    company,
    'CERTIFICATE OF ORIGIN',
    `CERTIFICATE NO: ${certNo}`
  );

  const leftX = 40;
  const colWidth = 245;

  // Box 1: Consignor (Exporter)
  page.drawRectangle({
    x: leftX,
    y: y - 55,
    width: colWidth,
    height: 55,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 0.5,
  });
  page.drawText('1. GOODS CONSIGNED FROM (EXPORTER):', { x: leftX + 5, y: y - 10, size: 7, font: fontBold });
  page.drawText(company.name.slice(0, 45), { x: leftX + 5, y: y - 20, size: 8, font: fontBold });
  page.drawText((company.address || 'India').slice(0, 50), { x: leftX + 5, y: y - 30, size: 7, font: fontRegular });
  page.drawText(`IEC: ${company.ieCode || 'N/A'} | Country: REPUBLIC OF INDIA`, { x: leftX + 5, y: y - 40, size: 7, font: fontRegular });

  // Box 2: Consignee
  page.drawRectangle({
    x: leftX + colWidth + 25,
    y: y - 55,
    width: colWidth,
    height: 55,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 0.5,
  });
  page.drawText('2. GOODS CONSIGNED TO (IMPORTER):', { x: leftX + colWidth + 30, y: y - 10, size: 7, font: fontBold });
  page.drawText((data.consigneeName || 'Valued Overseas Importer').slice(0, 45), { x: leftX + colWidth + 30, y: y - 20, size: 8, font: fontBold });
  page.drawText((data.consigneeAddress || data.consigneeCountry || 'Overseas Address').slice(0, 50), { x: leftX + colWidth + 30, y: y - 30, size: 7, font: fontRegular });
  page.drawText(`Destination Country: ${data.consigneeCountry || 'Overseas'}`, { x: leftX + colWidth + 30, y: y - 40, size: 7, font: fontRegular });

  y -= 65;

  // Box 3: Transport details
  page.drawRectangle({
    x: leftX,
    y: y - 35,
    width: 515,
    height: 35,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 0.5,
  });
  page.drawText('3. MEANS OF TRANSPORT AND ROUTE:', { x: leftX + 5, y: y - 10, size: 7, font: fontBold });
  page.drawText(`Port of Loading: ${data.portOfLoading || 'Nhava Sheva, India (INNSA1)'}  |  Discharge: ${data.portOfDischarge || 'Destination Port'}`, { x: leftX + 5, y: y - 22, size: 7.5, font: fontRegular });

  y -= 45;

  // Itemized Table
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
  page.drawText('MARKS & PACKAGES', { x: leftX + 45, y: y - 12, size: 7.5, font: fontBold });
  page.drawText('DESCRIPTION OF GOODS', { x: leftX + 165, y: y - 12, size: 7.5, font: fontBold });
  page.drawText('ITC-HS CODE', { x: leftX + 355, y: y - 12, size: 7.5, font: fontBold });
  page.drawText('QUANTITY', { x: leftX + 445, y: y - 12, size: 7.5, font: fontBold });

  y -= 20;

  const items = data.items && data.items.length > 0 ? data.items : [
    {
      itemNo: 1,
      description: 'Manufactured Industrial Components',
      hsCode: '85044090',
      quantity: 500,
      grossWeightKg: 1250,
    },
  ];

  items.forEach((it, idx) => {
    page.drawText(String(idx + 1), { x: leftX + 5, y, size: 7.5, font: fontRegular });
    page.drawText('SS-PKG-01/10', { x: leftX + 45, y, size: 7.5, font: fontRegular });
    page.drawText(it.description.slice(0, 36), { x: leftX + 165, y, size: 7.5, font: fontRegular });
    page.drawText(it.hsCode, { x: leftX + 355, y, size: 7.5, font: fontRegular });
    page.drawText(`${it.quantity} UNITS`, { x: leftX + 445, y, size: 7.5, font: fontRegular });
    y -= 16;
  });

  page.drawLine({
    start: { x: leftX, y },
    end: { x: leftX + tableWidth, y },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });

  y -= 25;

  // Origin Criterion Box
  page.drawRectangle({
    x: leftX,
    y: y - 35,
    width: tableWidth,
    height: 35,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 0.5,
  });

  page.drawText('4. ORIGIN CRITERION (NON-PREFERENTIAL):', { x: leftX + 6, y: y - 10, size: 7, font: fontBold });
  page.drawText(
    'The goods described above were manufactured in India and satisfy substantial transformation requirements.',
    { x: leftX + 6, y: y - 22, size: 7, font: fontRegular, color: rgb(0.3, 0.3, 0.3) }
  );

  y -= 50;

  // Dual Declarations (Exporter Declaration & Chamber Certification)
  // Left: Exporter Declaration
  page.drawRectangle({
    x: leftX,
    y: y - 100,
    width: colWidth,
    height: 100,
    borderColor: rgb(0.75, 0.75, 0.75),
    borderWidth: 0.5,
  });
  page.drawText('5. DECLARATION BY THE EXPORTER:', { x: leftX + 5, y: y - 12, size: 7, font: fontBold });
  page.drawText(
    'I, the undersigned, hereby declare that the above details and statements are correct; that all the goods were produced in the REPUBLIC OF INDIA.',
    { x: leftX + 5, y: y - 25, size: 6.5, font: fontRegular, color: rgb(0.35, 0.35, 0.35) }
  );
  page.drawText(`Dated: ${certDate}`, { x: leftX + 5, y: y - 55, size: 7, font: fontRegular });
  page.drawText(`For ${company.name.slice(0, 30)}`, { x: leftX + 5, y: y - 75, size: 7.5, font: fontBold });
  page.drawText('Authorized Signatory', { x: leftX + 5, y: y - 88, size: 7, font: fontRegular });

  // Right: Competent Authority Certification
  page.drawRectangle({
    x: leftX + colWidth + 25,
    y: y - 100,
    width: colWidth,
    height: 100,
    borderColor: rgb(0.75, 0.75, 0.75),
    borderWidth: 0.5,
  });
  page.drawText('6. CERTIFICATION (CHAMBER OF COMMERCE):', { x: leftX + colWidth + 30, y: y - 12, size: 7, font: fontBold });
  page.drawText(
    'It is hereby certified, on the basis of control carried out, that the declaration by the exporter is truthful and correct.',
    { x: leftX + colWidth + 30, y: y - 25, size: 6.5, font: fontRegular, color: rgb(0.35, 0.35, 0.35) }
  );
  page.drawText(`Place and Date: Mumbai, ${certDate}`, { x: leftX + colWidth + 30, y: y - 55, size: 7, font: fontRegular });
  page.drawText('Indian Chamber of Commerce & Trade Promotion', { x: leftX + colWidth + 30, y: y - 75, size: 7.5, font: fontBold });
  page.drawText('Competent Issuing Officer (Digital Verification)', { x: leftX + colWidth + 30, y: y - 88, size: 7, font: fontRegular });

  drawPageNumber(page, fontRegular, 1, 1);

  return pdfDoc.save();
}
