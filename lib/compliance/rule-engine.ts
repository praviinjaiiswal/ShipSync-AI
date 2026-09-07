import { prisma } from '@/app/lib/prisma';
import type { Shipment, Company } from '@prisma/client';

export interface RuleResult {
  rule: string;
  description: string;
  passed: boolean;
  severity: 'BLOCKING' | 'WARNING';
  message: string;
}

export interface ComplianceRulesOutput {
  passed: boolean;
  failedRules: RuleResult[];
  passedRules: RuleResult[];
  allRules: RuleResult[];
}

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const IEC_REGEX = /^[A-Z0-9]{10}$/i;

/**
 * Deterministic Statutory Compliance Rule Engine
 * Evaluates non-negotiable legal, tax, and customs requirements independent of AI.
 */
export async function runComplianceRules(
  shipment: Shipment,
  company: Company
): Promise<ComplianceRulesOutput> {
  const allRules: RuleResult[] = [];

  // -------------------------------------------------------------
  // 1. RULE_IEC_VALID: Valid, non-expired Importer Exporter Code
  // -------------------------------------------------------------
  const iecLicense = await prisma.license.findFirst({
    where: {
      companyId: company.id,
      type: 'IEC',
      expiryDate: { gt: new Date() },
    },
  });

  const hasValidIecLicense = Boolean(iecLicense);
  const hasValidCompanyIeCode = Boolean(company.ieCode && IEC_REGEX.test(company.ieCode.trim()));

  if (hasValidIecLicense || hasValidCompanyIeCode) {
    allRules.push({
      rule: 'RULE_IEC_VALID',
      description: 'Importer Exporter Code (IEC) Status',
      passed: true,
      severity: 'BLOCKING',
      message: `Verified valid IEC on file (${iecLicense?.licenseNumber || company.ieCode || 'Active DGFT License'}).`,
    });
  } else {
    allRules.push({
      rule: 'RULE_IEC_VALID',
      description: 'Importer Exporter Code (IEC) Status',
      passed: false,
      severity: 'BLOCKING',
      message: 'Company does not have a valid, non-expired Importer Exporter Code (IEC) on file or in Licenses.',
    });
  }

  // -------------------------------------------------------------
  // 2. RULE_HS_TARIFF_GROUNDED: Grounded in TariffSchedule
  // -------------------------------------------------------------
  const cleanHs = shipment.hsCode?.trim().replace(/\./g, '') || '';
  const tariffEntry = cleanHs.length >= 6
    ? await prisma.tariffSchedule.findFirst({
        where: {
          OR: [
            { hsCode: cleanHs },
            { hsCode: { startsWith: cleanHs.slice(0, 6) } },
          ],
        },
      })
    : null;

  if (tariffEntry) {
    allRules.push({
      rule: 'RULE_HS_TARIFF_GROUNDED',
      description: 'ITC-HS Tariff Grounding',
      passed: true,
      severity: 'BLOCKING',
      message: `HS Code ${cleanHs} verified against statutory schedule (${tariffEntry.description.slice(0, 60)}...).`,
    });
  } else {
    allRules.push({
      rule: 'RULE_HS_TARIFF_GROUNDED',
      description: 'ITC-HS Tariff Grounding',
      passed: false,
      severity: 'BLOCKING',
      message: `HS Code ${cleanHs || 'UNKNOWN'} is not grounded in the statutory Customs Tariff Schedule.`,
    });
  }

  // -------------------------------------------------------------
  // 3. RULE_GSTIN_FORMAT: Valid Statutory GSTIN Format
  // -------------------------------------------------------------
  if (company.gstNumber) {
    const isGstValid = GSTIN_REGEX.test(company.gstNumber.trim().toUpperCase());
    if (isGstValid) {
      allRules.push({
        rule: 'RULE_GSTIN_FORMAT',
        description: 'GSTIN Verification',
        passed: true,
        severity: 'BLOCKING',
        message: `Statutory 15-character GSTIN verified: ${company.gstNumber}.`,
      });
    } else {
      allRules.push({
        rule: 'RULE_GSTIN_FORMAT',
        description: 'GSTIN Verification',
        passed: false,
        severity: 'BLOCKING',
        message: `Company GSTIN '${company.gstNumber}' fails Indian statutory format requirements.`,
      });
    }
  } else {
    // If GST is optional for pure SEZ or LUT, we record warning or pass with notice
    allRules.push({
      rule: 'RULE_GSTIN_FORMAT',
      description: 'GSTIN Verification',
      passed: true,
      severity: 'WARNING',
      message: 'No GSTIN registered on company profile (assumed SEZ or non-taxable entity).',
    });
  }

  // -------------------------------------------------------------
  // 4. RULE_SANCTIONS_CLEARED: Buyer Sanctions Clearance
  // -------------------------------------------------------------
  const sanctionsCheck = await prisma.sanctionsCheck.findFirst({
    where: { shipmentId: shipment.id },
  });

  if (!sanctionsCheck) {
    allRules.push({
      rule: 'RULE_SANCTIONS_CLEARED',
      description: 'Statutory Sanctions & Denied Entity Clearance',
      passed: false,
      severity: 'BLOCKING',
      message: `Mandatory buyer screening (DGFT / SCOMET / US CSL) has not yet been executed for buyer '${shipment.buyerName}'.`,
    });
  } else if (sanctionsCheck.matchFound) {
    allRules.push({
      rule: 'RULE_SANCTIONS_CLEARED',
      description: 'Statutory Sanctions & Denied Entity Clearance',
      passed: false,
      severity: 'BLOCKING',
      message: `Buyer '${shipment.buyerName}' has unresolved statutory sanctions or denied entity list matches.`,
    });
  } else {
    allRules.push({
      rule: 'RULE_SANCTIONS_CLEARED',
      description: 'Statutory Sanctions & Denied Entity Clearance',
      passed: true,
      severity: 'BLOCKING',
      message: `Buyer '${shipment.buyerName}' cleared against all statutory Indian and international restricted lists.`,
    });
  }

  // -------------------------------------------------------------
  // 5. RULE_MANDATORY_DOCUMENTS: Commercial Invoice & Packing List
  // -------------------------------------------------------------
  const documents = await prisma.document.findMany({
    where: { shipmentId: shipment.id },
  });

  const hasInvoice = documents.some((d) => d.docType === 'COMMERCIAL_INVOICE');
  const hasPackingList = documents.some((d) => d.docType === 'PACKING_LIST');

  if (hasInvoice && hasPackingList) {
    allRules.push({
      rule: 'RULE_MANDATORY_DOCUMENTS',
      description: 'Mandatory Export Documentation',
      passed: true,
      severity: 'BLOCKING',
      message: 'Statutory baseline export documents (Commercial Invoice and Packing List) are present.',
    });
  } else {
    const missing: string[] = [];
    if (!hasInvoice) missing.push('Commercial Invoice');
    if (!hasPackingList) missing.push('Packing List');

    allRules.push({
      rule: 'RULE_MANDATORY_DOCUMENTS',
      description: 'Mandatory Export Documentation',
      passed: false,
      severity: 'BLOCKING',
      message: `Mandatory export documents missing: ${missing.join(', ')}. Commercial Invoice and Packing List are statutory prerequisites.`,
    });
  }

  const failedRules = allRules.filter((r) => !r.passed && r.severity === 'BLOCKING');
  const passedRules = allRules.filter((r) => r.passed);
  const passed = failedRules.length === 0;

  return {
    passed,
    failedRules,
    passedRules,
    allRules,
  };
}

/**
 * Convenient helper to evaluate compliance rules by shipmentId and companyId
 */
export async function evaluateComplianceRules(
  shipmentId: string,
  companyId: string
): Promise<{ overallPassed: boolean; hardRules: RuleResult[] }> {
  const shipment = await prisma.shipment.findFirst({
    where: { id: shipmentId, companyId },
  });
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!shipment || !company) {
    throw new Error('Shipment or Company not found for compliance evaluation');
  }

  const result = await runComplianceRules(shipment, company);
  return {
    overallPassed: result.passed,
    hardRules: result.allRules,
  };
}

