import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { CompanyDetails, drawLetterhead, drawSignatoryBlock, drawPageNumber } from './types';

export interface BillOfLadingData {
  blNumber?: string;
  issueDate?: string;
  shipperName?: string;
  shipperAddress?: string;
  consigneeName?: string;
  consigneeAddress?: string;
  notifyParty?: string;
  vesselName?: string;
  voyageNumber?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  placeOfDelivery?: string;
  containerNumber?: string;
  sealNumber?: string;
  grossWeightKg?: number;
  measurementCbm?: number;
  totalPackages?: number;
  packageType?: string;
  descriptionOfGoods?: string;
  freightTerm?: 'FREIGHT_PREPAID' | 'FREIGHT_COLLECT' | string;
}

export async function renderBillOfLadingPdf(
  data: BillOfLadingData,
  company: CompanyDetails
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const blNo = data.blNumber || `MEDU${Date.now().toString().slice(-8)}`;
  const blDate = data.issueDate || new Date().toISOString().split('T')[0];
  const freight = (data.freightTerm || 'FREIGHT PREPAID').replace(/_/g, ' ');

  let y = drawLetterhead(
    page,
    fontBold,
    fontRegular,
    company,
    'BILL OF LADING FOR OCEAN TRANSPORT',
    `DRAFT B/L NO: ${blNo}`
  );

  const leftX = 40;
  const colWidth = 245;

  // Box 1: Shipper
  page.drawRectangle({
    x: leftX,
    y: y - 55,
    width: colWidth,
    height: 55,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 0.5,
  });
  page.drawText('SHIPPER / EXPORTER:', { x: leftX + 5, y: y - 10, size: 7, font: fontBold });
  page.drawText(company.name.slice(0, 45), { x: leftX + 5, y: y - 20, size: 8, font: fontBold });
  page.drawText((company.address || 'India').slice(0, 50), { x: leftX + 5, y: y - 30, size: 7, font: fontRegular });
  page.drawText(`IEC: ${company.ieCode || 'N/A'} | Country: INDIA`, { x: leftX + 5, y: y - 40, size: 7, font: fontRegular });

  // Box 2: Consignee
  page.drawRectangle({
    x: leftX + colWidth + 25,
    y: y - 55,
    width: colWidth,
    height: 55,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 0.5,
  });
  page.drawText('CONSIGNEE (OR TO ORDER):', { x: leftX + colWidth + 30, y: y - 10, size: 7, font: fontBold });
  page.drawText((data.consigneeName || 'TO ORDER OF APPLICANT BANK').slice(0, 45), { x: leftX + colWidth + 30, y: y - 20, size: 8, font: fontBold });
  page.drawText((data.consigneeAddress || 'As per Documentary Letter of Credit').slice(0, 50), { x: leftX + colWidth + 30, y: y - 30, size: 7, font: fontRegular });

  y -= 65;

  // Box 3: Notify Party
  page.drawRectangle({
    x: leftX,
    y: y - 45,
    width: 515,
    height: 45,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 0.5,
  });
  page.drawText('NOTIFY PARTY / INTERMEDIARY AGENT:', { x: leftX + 5, y: y - 10, size: 7, font: fontBold });
  page.drawText((data.notifyParty || data.consigneeName || 'Same as Consignee').slice(0, 60), { x: leftX + 5, y: y - 22, size: 7.5, font: fontRegular });
  page.drawText('Carrier undertakes to notify the party named above upon vessel arrival at destination port.', { x: leftX + 5, y: y - 34, size: 6.5, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

  y -= 55;

  // Vessel & Routing Grid
  page.drawRectangle({
    x: leftX,
    y: y - 45,
    width: 515,
    height: 45,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 0.5,
  });
  page.drawText(`Ocean Vessel / Voyage: ${data.vesselName || 'MSC LAUREN'} / ${data.voyageNumber || '2601W'}`, { x: leftX + 5, y: y - 12, size: 7.5, font: fontBold });
  page.drawText(`Port of Loading: ${data.portOfLoading || 'Nhava Sheva (INNSA1)'}`, { x: leftX + 5, y: y - 24, size: 7.5, font: fontRegular });
  page.drawText(`Port of Discharge: ${data.portOfDischarge || 'Jebel Ali, UAE'}`, { x: leftX + 270, y: y - 24, size: 7.5, font: fontRegular });
  page.drawText(`Place of Delivery: ${data.placeOfDelivery || data.portOfDischarge || 'Destination CFS'}`, { x: leftX + 5, y: y - 36, size: 7.5, font: fontRegular });
  page.drawText(`Freight Condition: ${freight}`, { x: leftX + 270, y: y - 36, size: 7.5, font: fontBold, color: rgb(0.12, 0.23, 0.38) });

  y -= 60;

  // Container & Cargo Table
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

  page.drawText('CONTAINER & SEAL', { x: leftX + 5, y: y - 12, size: 7.5, font: fontBold });
  page.drawText('MARKS & NUMBERS', { x: leftX + 130, y: y - 12, size: 7.5, font: fontBold });
  page.drawText('DESCRIPTION OF GOODS', { x: leftX + 235, y: y - 12, size: 7.5, font: fontBold });
  page.drawText('GROSS WT', { x: leftX + 410, y: y - 12, size: 7.5, font: fontBold });
  page.drawText('CBM', { x: leftX + 475, y: y - 12, size: 7.5, font: fontBold });

  y -= 20;

  const ctnNo = data.containerNumber || 'MSCU9988771';
  const sealNo = data.sealNumber || 'IN-CUS-8812';
  const grossWt = (data.grossWeightKg || 3250.5).toFixed(2);
  const cbm = (data.measurementCbm || 14.5).toFixed(2);
  const desc = data.descriptionOfGoods || 'Shipper load, stow and count (SLAC): Electronic Equipment';

  page.drawText(`${ctnNo}\nSeal: ${sealNo}`, { x: leftX + 5, y, size: 7.5, font: fontRegular });
  page.drawText('SS-2026-IND\n(1 - 25 CTNS)', { x: leftX + 130, y, size: 7.5, font: fontRegular });
  page.drawText(desc.slice(0, 36), { x: leftX + 235, y, size: 7.5, font: fontRegular });
  page.drawText(`${grossWt} KG`, { x: leftX + 410, y, size: 7.5, font: fontRegular });
  page.drawText(`${cbm} CBM`, { x: leftX + 475, y, size: 7.5, font: fontRegular });

  y -= 25;

  page.drawLine({
    start: { x: leftX, y },
    end: { x: leftX + tableWidth, y },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });

  y -= 35;

  // Carriage Contract & Limitation of Liability Notice
  page.drawRectangle({
    x: leftX,
    y: y - 45,
    width: tableWidth,
    height: 45,
    color: rgb(0.98, 0.98, 0.98),
    borderColor: rgb(0.85, 0.85, 0.85),
    borderWidth: 0.5,
  });

  page.drawText('TERMS OF CARRIAGE & HAGUE-VISBY CLAUSE PARAMOUNT:', { x: leftX + 6, y: y - 10, size: 7, font: fontBold });
  page.drawText('Received by the Carrier in apparent good order and condition. The carriage is subject to Carrier standard terms and conditions.', { x: leftX + 6, y: y - 20, size: 6.5, font: fontRegular, color: rgb(0.35, 0.35, 0.35) });
  page.drawText('Number of Original Bills of Lading: 3 (THREE). One original accomplished, others to stand void.', { x: leftX + 6, y: y - 30, size: 6.5, font: fontBold, color: rgb(0.2, 0.2, 0.2) });

  y -= 65;

  drawSignatoryBlock(page, fontBold, fontRegular, company.name, y, 'As Agents for the Master / Carrier');
  drawPageNumber(page, fontRegular, 1, 1);

  return pdfDoc.save();
}
