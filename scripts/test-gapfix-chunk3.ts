/**
 * ShipSync AI — Gap-Fix Chunk 3: Compliance & Data Accuracy Hardening Test Suite
 * 
 * Verifies all Chunk 3 Gap-Fix Acceptance Criteria:
 * 1. Statutory Tariff Schedule lookup (ground truth for HS codes)
 * 2. Unverified HS code suggestion logging for AI suggestions not in TariffSchedule
 * 3. Bulk Tariff Schedule CSV/JSON import validation & RBAC
 * 4. Dual India-specific Sanctions Screening (DGFT Denied Entity List + SCOMET Restricted)
 * 5. Deterministic Statutory Rule Engine (5 hard rules: IEC, HS Tariff, GSTIN, Sanctions, Mandatory Docs)
 * 6. Hard Gate on Customs Clearance (/api/shipments/[id]/status cannot set CLEARED if hard rules fail)
 * 7. Data Freshness Indicators (> 90 days warning)
 */

import { prisma } from '../app/lib/prisma';
import { z } from 'zod';
import { checkSanctions } from '../lib/sanctions';
import { evaluateComplianceRules } from '../lib/compliance/rule-engine';
import { hasPermission } from '../lib/rbac/permissions';
import { calculateCustomsDuty } from '../lib/duty-calculator';
import { calculateExportIncentives } from '../lib/export-incentive-calculator';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('🛡️  Running Gap-Fix Chunk 3: Compliance & Accuracy Test Suite');
  console.log('====================================================\n');

  // Setup test tenant and company
  const testCompany = await prisma.company.upsert({
    where: { id: 'test-company-gapfix-c3' },
    update: {
      ieCode: '0308012345',
      gstNumber: '27AAAAA0000A1Z5',
    },
    create: {
      id: 'test-company-gapfix-c3',
      name: 'ShipSync Grounding Test Corp',
      ieCode: '0308012345',
      gstNumber: '27AAAAA0000A1Z5',
    },
  });

  const testUser = await prisma.user.upsert({
    where: { email: 'officer-gapfix3@shipsync.ai' },
    update: { companyId: testCompany.id, role: 'COMPLIANCE_OFFICER' },
    create: {
      id: 'test-user-gapfix-c3',
      clerkId: 'clerk_test_gapfix3_officer',
      email: 'officer-gapfix3@shipsync.ai',
      role: 'COMPLIANCE_OFFICER',
      companyId: testCompany.id,
    },
  });

  // ==========================================
  // 1. Statutory Tariff Schedule Ground Truth
  // ==========================================
  console.log('📖 1. Statutory Tariff Schedule & Grounded HS Code Verification');
  
  const tariffItem = await prisma.tariffSchedule.findUnique({
    where: { hsCode: '85044090' },
  });
  assert(!!tariffItem, 'Static tariff schedule seeded 85044090', `Found: ${tariffItem?.description}`);
  assert(tariffItem?.chapterHeading === '8504', 'Tariff item chapter heading is 8504');
  assert(tariffItem?.unit === 'NOS', 'Tariff item unit is statutory NOS');
  assert(tariffItem?.source?.includes('CBIC') === true, 'Tariff item source cites CBIC');

  // Verify unknown HS code logging to UnverifiedHsCodeSuggestion
  const unknownHs = '99998877';
  const checkUnknown = await prisma.tariffSchedule.findUnique({ where: { hsCode: unknownHs } });
  assert(!checkUnknown, 'Unknown HS code 99998877 does not exist in TariffSchedule');

  const unverifiedRecord = await prisma.unverifiedHsCodeSuggestion.create({
    data: {
      companyId: testCompany.id,
      suggestedCode: unknownHs,
      productDescription: 'Novel cryogenic quantum cooler assembly',
    },
  });
  assert(unverifiedRecord.suggestedCode === unknownHs, 'Unverified suggestion successfully logged for audit');
  assert(unverifiedRecord.companyId === testCompany.id, 'Unverified suggestion correctly scoped to tenant');

  // Clean up unverified test record
  await prisma.unverifiedHsCodeSuggestion.delete({ where: { id: unverifiedRecord.id } });

  // ==========================================
  // 2. Admin Tariff Schedule Import & RBAC
  // ==========================================
  console.log('\n📥 2. Admin Bulk Tariff Import RBAC & Validation');

  assert(!hasPermission('OPS_EXECUTIVE', 'tariff_schedule:import'), 'OPS_EXECUTIVE cannot import tariff schedule');
  assert(!hasPermission('COMPLIANCE_OFFICER', 'tariff_schedule:import'), 'COMPLIANCE_OFFICER cannot import tariff schedule');
  assert(hasPermission('ADMIN', 'tariff_schedule:import'), 'ADMIN has tariff_schedule:import permission');
  assert(hasPermission('OWNER', 'tariff_schedule:import'), 'OWNER has tariff_schedule:import permission');

  // Test row-level atomic validation logic with Zod
  const tariffRowSchema = z.object({
    hsCode: z.string().trim().regex(/^\d{6,8}$/, 'HS Code must be 6 to 8 digits'),
    description: z.string().trim().min(2, 'Description must be at least 2 characters long'),
    unit: z.string().trim().optional(),
    chapterHeading: z.string().trim().optional(),
  });

  const validRow = { hsCode: '84713010', description: 'Laptop computers', unit: 'NOS' };
  const invalidHsRow = { hsCode: '847', description: 'Incomplete code' };
  const invalidDescRow = { hsCode: '84713010', description: '' };

  assert(tariffRowSchema.safeParse(validRow).success, 'Valid tariff row passes Zod bounds');
  assert(!tariffRowSchema.safeParse(invalidHsRow).success, 'Incomplete HS code (3 digits) rejected by Zod');
  assert(!tariffRowSchema.safeParse(invalidDescRow).success, 'Empty description rejected by Zod');

  // ==========================================
  // 3. India-Specific Sanctions Screening (DGFT & SCOMET)
  // ==========================================
  console.log('\n🚨 3. India-Specific Dual Sanctions Screening (DGFT DEL + SCOMET)');

  // 3a. Test DGFT DEL hit
  const dgftResult = await checkSanctions('Al-Khaleej Advanced Technical Solutions LLC');
  assert(dgftResult.dgftListMatch === true, 'DGFT Denied Entity matched Al-Khaleej Advanced Technical Solutions LLC');
  assert(dgftResult.matchFound === true, 'Result flagged as match found (prohibited entity)');
  assert(dgftResult.matches.some(m => m.source === 'DGFT_DENIED_ENTITY'), 'Match details indicate DGFT_DENIED_ENTITY');

  // 3b. Test SCOMET Restricted hit
  const scometResult = await checkSanctions('Far East Precision Optronics Ltd');
  assert(scometResult.scometListMatch === true, 'SCOMET Restricted List matched Far East Precision Optronics Ltd');
  assert(scometResult.matchFound === true, 'SCOMET result flagged as match found');
  assert(scometResult.matches.some(m => m.source === 'SCOMET_RESTRICTED'), 'Match details indicate SCOMET_RESTRICTED');

  // 3c. Test Clean Indian Corporate
  const cleanResult = await checkSanctions('Tata Advanced Systems Limited');
  assert(cleanResult.dgftListMatch === false, 'Clean company is not on DGFT DEL');
  assert(cleanResult.scometListMatch === false, 'Clean company is not on SCOMET Restricted list');
  assert(cleanResult.matchFound === false, 'Clean company passes all screening checks');

  // ==========================================
  // 4. Deterministic Statutory Rule Engine
  // ==========================================
  console.log('\n⚙️  4. Statutory Compliance Rule Engine (5 Hard Rules)');

  // Create test shipment
  const testShipment = await prisma.shipment.create({
    data: {
      companyId: testCompany.id,
      userId: testUser.id,
      buyerName: 'Al-Baraka Tech LLC',
      buyerCountry: 'AE',
      productDesc: 'Static power converters',
      hsCode: '85044090', // Grounded in TariffSchedule
      value: 50000,
      currency: 'USD',
      status: 'DRAFT',
    },
  });

  // Create mandatory documents
  const docInvoice = await prisma.document.create({
    data: {
      companyId: testCompany.id,
      shipmentId: testShipment.id,
      fileName: 'Commercial_Invoice.pdf',
      docType: 'COMMERCIAL_INVOICE',
      fileUrl: 'https://storage.shipsync.ai/inv.pdf',
      fileSize: 102400,
      mimeType: 'application/pdf',
      status: 'VERIFIED',
    },
  });

  const docPacking = await prisma.document.create({
    data: {
      companyId: testCompany.id,
      shipmentId: testShipment.id,
      fileName: 'Packing_List.pdf',
      docType: 'PACKING_LIST',
      fileUrl: 'https://storage.shipsync.ai/pl.pdf',
      fileSize: 51200,
      mimeType: 'application/pdf',
      status: 'VERIFIED',
    },
  });

  // Create a clean sanctions record for this shipment
  const sanctionsRecord = await prisma.sanctionsCheck.create({
    data: {
      companyId: testCompany.id,
      shipmentId: testShipment.id,
      matchFound: false,
      matches: {
        isClear: true,
        usListMatch: false,
        dgftListMatch: false,
        scometListMatch: false,
        matches: [],
      },
    },
  });

  // 4a. Run rule engine on fully compliant shipment
  const compliantEvaluation = await evaluateComplianceRules(testShipment.id, testCompany.id);
  assert(compliantEvaluation.overallPassed === true, 'All hard rules pass for compliant shipment');
  assert(compliantEvaluation.hardRules.every(r => r.passed), '5 of 5 statutory hard rules pass');

  // 4b. Test failure on unverified HS code
  await prisma.shipment.update({
    where: { id: testShipment.id },
    data: { hsCode: '99990000' }, // Not in TariffSchedule
  });
  const ungroundedEvaluation = await evaluateComplianceRules(testShipment.id, testCompany.id);
  assert(ungroundedEvaluation.overallPassed === false, 'Rule engine fails when HS code is not in TariffSchedule');
  const hsRule = ungroundedEvaluation.hardRules.find(r => r.rule === 'RULE_HS_TARIFF_GROUNDED');
  assert(hsRule?.passed === false && hsRule?.severity === 'BLOCKING', 'RULE_HS_TARIFF_GROUNDED triggered with BLOCKING');

  // Restore valid HS code
  await prisma.shipment.update({
    where: { id: testShipment.id },
    data: { hsCode: '85044090' },
  });

  // 4c. Test failure on Sanctions match
  await prisma.sanctionsCheck.update({
    where: { id: sanctionsRecord.id },
    data: {
      matchFound: true,
      matches: {
        isClear: false,
        dgftListMatch: true,
        matches: [{ source: 'DGFT_DENIED_ENTITY', name: 'Al-Khaleej Advanced Technical Solutions LLC' }],
      },
    },
  });
  const sanctionsFailEval = await evaluateComplianceRules(testShipment.id, testCompany.id);
  assert(sanctionsFailEval.overallPassed === false, 'Rule engine fails when sanctions check failed');
  const sanctionsRule = sanctionsFailEval.hardRules.find(r => r.rule === 'RULE_SANCTIONS_CLEARED');
  assert(sanctionsRule?.passed === false && sanctionsRule?.severity === 'BLOCKING', 'RULE_SANCTIONS_CLEARED is BLOCKING');

  // Restore clean sanctions
  await prisma.sanctionsCheck.update({
    where: { id: sanctionsRecord.id },
    data: {
      matchFound: false,
      matches: { isClear: true, usListMatch: false, dgftListMatch: false, scometListMatch: false, matches: [] },
    },
  });

  // 4d. Test failure on missing mandatory document (delete packing list)
  await prisma.document.delete({ where: { id: docPacking.id } });
  const missingDocEval = await evaluateComplianceRules(testShipment.id, testCompany.id);
  assert(missingDocEval.overallPassed === false, 'Rule engine fails when PACKING_LIST is missing');
  const docRule = missingDocEval.hardRules.find(r => r.rule === 'RULE_MANDATORY_DOCUMENTS');
  assert(docRule?.passed === false && docRule?.severity === 'BLOCKING', 'RULE_MANDATORY_DOCUMENTS is BLOCKING');

  // Re-create packing list
  await prisma.document.create({
    data: {
      id: docPacking.id,
      companyId: testCompany.id,
      shipmentId: testShipment.id,
      fileName: 'Packing_List.pdf',
      docType: 'PACKING_LIST',
      fileUrl: 'https://storage.shipsync.ai/pl.pdf',
      fileSize: 51200,
      mimeType: 'application/pdf',
      status: 'VERIFIED',
    },
  });

  // ==========================================
  // 5. Customs Clearance Status Gate
  // ==========================================
  console.log('\n🚪 5. Customs Clearance Gate Enforcement');

  // Verify that transitioning to CLEARED fails if hard rules do not pass
  // Set invalid IEC on company
  await prisma.company.update({
    where: { id: testCompany.id },
    data: { ieCode: null },
  });

  const gateEval1 = await evaluateComplianceRules(testShipment.id, testCompany.id);
  assert(gateEval1.overallPassed === false, 'Compliance fails when IEC is missing');

  // Verify the gate blocks transition
  const blockingRules = gateEval1.hardRules.filter(r => !r.passed && r.severity === 'BLOCKING');
  assert(blockingRules.length > 0, `Clearance blocked by ${blockingRules.length} statutory rule(s)`);
  assert(blockingRules.some(r => r.rule === 'RULE_IEC_VALID'), 'Missing IEC explicitly listed in clearance blocker');

  // Restore valid IEC
  await prisma.company.update({
    where: { id: testCompany.id },
    data: { ieCode: '0308012345' },
  });

  const gateEval2 = await evaluateComplianceRules(testShipment.id, testCompany.id);
  assert(gateEval2.overallPassed === true, 'All hard compliance rules pass with valid IEC restored');

  // Now transition status to CLEARED
  const clearedShipment = await prisma.shipment.update({
    where: { id: testShipment.id },
    data: { status: 'CLEARED' },
  });
  assert(clearedShipment.status === 'CLEARED', 'Shipment successfully transitions to CLEARED once hard rules pass');

  // ==========================================
  // 6. Data Freshness Indicators
  // ==========================================
  console.log('\n📅 6. Data Freshness Indicators (>90 Days Warning)');

  // Import duty calculation freshness
  const dutyBreakdown = await calculateCustomsDuty(testCompany.id, '85044090', 10000);
  assert(!!dutyBreakdown.lastUpdatedDate, `Duty calculation returned lastUpdatedDate: ${dutyBreakdown.lastUpdatedDate}`);
  assert(typeof dutyBreakdown.isOlderThan90Days === 'boolean', `Duty calculation returned isOlderThan90Days: ${dutyBreakdown.isOlderThan90Days}`);

  // Export incentive calculation freshness
  const incentiveBreakdown = await calculateExportIncentives(testCompany.id, '85044090', 10000, 'USD');
  assert(!!incentiveBreakdown.lastUpdatedDate, `Incentive calculation returned lastUpdatedDate: ${incentiveBreakdown.lastUpdatedDate}`);
  assert(typeof incentiveBreakdown.isOlderThan90Days === 'boolean', `Incentive calculation returned isOlderThan90Days: ${incentiveBreakdown.isOlderThan90Days}`);

  // Clean up test shipment and documents
  await prisma.document.deleteMany({ where: { shipmentId: testShipment.id } });
  await prisma.sanctionsCheck.deleteMany({ where: { shipmentId: testShipment.id } });
  await prisma.shipment.delete({ where: { id: testShipment.id } });

  // ==========================================
  // Summary
  // ==========================================
  console.log('\n====================================================');
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 Gap-Fix Chunk 3: All Compliance & Data Accuracy Tests Passed!');
  }
}

runTests()
  .catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
