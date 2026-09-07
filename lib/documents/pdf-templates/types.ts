import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib';

export interface CompanyDetails {
  name: string;
  address?: string | null;
  ieCode?: string | null;
  gstNumber?: string | null;
  panNumber?: string | null;
  email?: string | null;
}

export function formatAmount(amount: number | string | undefined | null, currency = 'INR'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : (amount || 0);
  const safeCurr = (currency || 'INR').toUpperCase().replace(/₹/g, 'INR');
  const formattedNum = num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${safeCurr} ${formattedNum}`;
}

export function drawLetterhead(
  page: PDFPage,
  fontBold: PDFFont,
  fontRegular: PDFFont,
  company: CompanyDetails,
  title: string,
  subtitle?: string
): number {
  const { width, height } = page.getSize();
  let y = height - 40;

  // Header band
  page.drawRectangle({
    x: 35,
    y: y - 5,
    width: width - 70,
    height: 2,
    color: rgb(0.12, 0.23, 0.38),
  });

  // Company Name
  page.drawText(company.name.toUpperCase(), {
    x: 40,
    y,
    size: 14,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.3),
  });

  y -= 14;

  // Statutory Tax & Trade Identifiers
  const idParts: string[] = [];
  if (company.ieCode) idParts.push(`IEC: ${company.ieCode}`);
  if (company.gstNumber) idParts.push(`GSTIN: ${company.gstNumber}`);
  if (company.panNumber) idParts.push(`PAN: ${company.panNumber}`);

  if (idParts.length > 0) {
    page.drawText(idParts.join('  |  '), {
      x: 40,
      y,
      size: 8,
      font: fontBold,
      color: rgb(0.3, 0.35, 0.4),
    });
    y -= 11;
  }

  // Address
  if (company.address) {
    page.drawText(company.address.slice(0, 100), {
      x: 40,
      y,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 11;
  }

  y -= 8;

  // Document Title Banner
  page.drawRectangle({
    x: 35,
    y: y - 18,
    width: width - 70,
    height: 22,
    color: rgb(0.93, 0.95, 0.98),
  });

  page.drawText(title.toUpperCase(), {
    x: 45,
    y: y - 12,
    size: 11,
    font: fontBold,
    color: rgb(0.12, 0.23, 0.38),
  });

  if (subtitle) {
    const subWidth = fontRegular.widthOfTextAtSize(subtitle, 8);
    page.drawText(subtitle, {
      x: width - 45 - subWidth,
      y: y - 11,
      size: 8,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.45),
    });
  }

  return y - 30;
}

export function drawSignatoryBlock(
  page: PDFPage,
  fontBold: PDFFont,
  fontRegular: PDFFont,
  companyName: string,
  y: number,
  designation = 'Authorized Signatory'
): void {
  const { width } = page.getSize();
  const boxX = width - 240;

  page.drawText(`For ${companyName}`, {
    x: boxX,
    y,
    size: 8.5,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawLine({
    start: { x: boxX, y: y - 30 },
    end: { x: boxX + 180, y: y - 30 },
    thickness: 0.75,
    color: rgb(0.6, 0.6, 0.6),
  });

  page.drawText(designation, {
    x: boxX,
    y: y - 42,
    size: 8,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText('(Digitally Generated — Valid under Indian Customs Regulations)', {
    x: boxX,
    y: y - 52,
    size: 6.5,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });
}

export function drawPageNumber(page: PDFPage, fontRegular: PDFFont, pageNum: number, totalPages = 1): void {
  const { width } = page.getSize();
  page.drawText(`Page ${pageNum} of ${totalPages}`, {
    x: width / 2 - 20,
    y: 20,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });
}
