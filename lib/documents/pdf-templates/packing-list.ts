import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { CompanyDetails, drawLetterhead, drawSignatoryBlock, drawPageNumber } from './types';

export interface PackingListData {
  packingListNumber?: string;
  packingListDate?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  buyerName?: string;
  buyerCountry?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  packages?: Array<{
    packageNo: string;
    description: string;
    quantity: number;
    unit?: string;
    netWeightKg: number;
    grossWeightKg: number;
    dimensionsCm?: string;
  }>;
  totalPackages?: number;
  totalNetWeightKg?: number;
  totalGrossWeightKg?: number;
  containerNumber?: string;
  sealNumber?: string;
}

export async function renderPackingListPdf(
  data: PackingListData,
  company: CompanyDetails
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const plNo = data.packingListNumber || `PL-${Date.now().toString().slice(-6)}`;
  const plDate = data.packingListDate || new Date().toISOString().split('T')[0];

  let y = drawLetterhead(
    page,
    fontBold,
    fontRegular,
    company,
    'PACKING LIST',
    `PL NO: ${plNo}`
  );

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
  page.drawText('EXPORTER / PACKER:', { x: leftX + 5, y: y - 10, size: 7, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(company.name.slice(0, 45), { x: leftX + 5, y: y - 20, size: 8, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText((company.address || 'India').slice(0, 55), { x: leftX + 5, y: y - 30, size: 7, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(`IEC: ${company.ieCode || 'N/A'} | GSTIN: ${company.gstNumber || 'N/A'}`, { x: leftX + 5, y: y - 40, size: 7, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

  // Box 2: Reference & Dates
  page.drawRectangle({
    x: rightX,
    y: y - 55,
    width: colWidth,
    height: 55,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 0.5,
  });
  page.drawText(`Packing List No: ${plNo}`, { x: rightX + 5, y: y - 12, size: 8, font: fontBold });
  page.drawText(`Date: ${plDate}`, { x: rightX + 5, y: y - 24, size: 7.5, font: fontRegular });
  page.drawText(`Invoice Ref: ${data.invoiceNumber || 'Attached Commercial Invoice'}`, { x: rightX + 5, y: y - 36, size: 7.5, font: fontBold });
  page.drawText(`Container No: ${data.containerNumber || 'TGHU9918231'} | Seal: ${data.sealNumber || 'IN-CUS-8812'}`, { x: rightX + 5, y: y - 48, size: 7.5, font: fontRegular });

  y -= 65;

  // Box 3: Consignee & Route
  page.drawRectangle({
    x: leftX,
    y: y - 45,
    width: 515,
    height: 45,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 0.5,
  });
  page.drawText(`CONSIGNEE: ${(data.buyerName || 'Valued Overseas Consignee').slice(0, 50)} (${data.buyerCountry || 'Overseas'})`, { x: leftX + 5, y: y - 12, size: 7.5, font: fontBold });
  page.drawText(`Port of Loading: ${data.portOfLoading || 'Nhava Sheva (INNSA1)'}  |  Port of Discharge: ${data.portOfDischarge || 'Final Discharge Port'}`, { x: leftX + 5, y: y - 26, size: 7.5, font: fontRegular });
  page.drawText(`Packaging Type: Corrugated Export Cartons on ISPM-15 Heat Treated Pallets`, { x: leftX + 5, y: y - 38, size: 7, font: fontRegular, color: rgb(0.35, 0.35, 0.35) });

  y -= 60;

  // Table
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

  page.drawText('PKG NO', { x: leftX + 5, y: y - 12, size: 7.5, font: fontBold });
  page.drawText('DESCRIPTION OF PACKAGES', { x: leftX + 55, y: y - 12, size: 7.5, font: fontBold });
  page.drawText('QTY', { x: leftX + 270, y: y - 12, size: 7.5, font: fontBold });
  page.drawText('DIMENSIONS', { x: leftX + 325, y: y - 12, size: 7.5, font: fontBold });
  page.drawText('NET WT (KG)', { x: leftX + 395, y: y - 12, size: 7.5, font: fontBold });
  page.drawText('GROSS WT (KG)', { x: leftX + 455, y: y - 12, size: 7.5, font: fontBold });

  y -= 20;

  const pkgList = data.packages && data.packages.length > 0 ? data.packages : [
    {
      packageNo: '1 - 10',
      description: 'Cartons containing industrial electrical modules',
      quantity: 10,
      unit: 'CARTONS',
      netWeightKg: data.totalNetWeightKg || 450,
      grossWeightKg: data.totalGrossWeightKg || 500,
      dimensionsCm: '60x40x40 cm',
    },
  ];

  let calcNet = 0;
  let calcGross = 0;
  let calcCount = 0;

  pkgList.forEach((pkg) => {
    calcNet += pkg.netWeightKg;
    calcGross += pkg.grossWeightKg;
    calcCount += pkg.quantity;

    page.drawText(pkg.packageNo, { x: leftX + 5, y, size: 7.5, font: fontRegular });
    page.drawText(pkg.description.slice(0, 42), { x: leftX + 55, y, size: 7.5, font: fontRegular });
    page.drawText(`${pkg.quantity} ${pkg.unit || 'CTN'}`, { x: leftX + 270, y, size: 7.5, font: fontRegular });
    page.drawText(pkg.dimensionsCm || 'Standard', { x: leftX + 325, y, size: 7.5, font: fontRegular });
    page.drawText(pkg.netWeightKg.toFixed(2), { x: leftX + 400, y, size: 7.5, font: fontRegular });
    page.drawText(pkg.grossWeightKg.toFixed(2), { x: leftX + 465, y, size: 7.5, font: fontRegular });

    y -= 14;
  });

  page.drawLine({
    start: { x: leftX, y },
    end: { x: leftX + tableWidth, y },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });

  y -= 18;

  // Weight Totals Banner
  const totalNet = data.totalNetWeightKg || calcNet;
  const totalGross = data.totalGrossWeightKg || calcGross;
  const totalPkgs = data.totalPackages || calcCount;

  page.drawRectangle({
    x: leftX,
    y: y - 28,
    width: tableWidth,
    height: 32,
    color: rgb(0.95, 0.98, 0.96),
    borderColor: rgb(0.7, 0.85, 0.75),
    borderWidth: 0.75,
  });

  page.drawText(`TOTAL PACKAGES: ${totalPkgs} UNITS`, { x: leftX + 15, y: y - 18, size: 8.5, font: fontBold, color: rgb(0.1, 0.35, 0.2) });
  page.drawText(`TOTAL NET WEIGHT: ${totalNet.toFixed(2)} KGS`, { x: leftX + 180, y: y - 18, size: 8.5, font: fontBold, color: rgb(0.1, 0.35, 0.2) });
  page.drawText(`TOTAL GROSS WEIGHT: ${totalGross.toFixed(2)} KGS`, { x: leftX + 350, y: y - 18, size: 8.5, font: fontBold, color: rgb(0.1, 0.35, 0.2) });

  y -= 50;

  // Packaging Compliance Certification
  page.drawText('PACKAGING INTEGRITY & STATUTORY CERTIFICATION:', { x: leftX, y, size: 7.5, font: fontBold });
  y -= 10;
  page.drawText('We certify that goods are packed in seaworthy export-grade packing suitable for ocean/air freight.', { x: leftX, y, size: 7, font: fontRegular, color: rgb(0.35, 0.35, 0.35) });
  y -= 9;
  page.drawText('All solid wood packaging material is certified compliant with ISPM-15 phytosanitary treatment regulations.', { x: leftX, y, size: 7, font: fontRegular, color: rgb(0.35, 0.35, 0.35) });

  y -= 55;

  drawSignatoryBlock(page, fontBold, fontRegular, company.name, y, 'Authorized Packer & Signatory');
  drawPageNumber(page, fontRegular, 1, 1);

  return pdfDoc.save();
}
