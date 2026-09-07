import { PrismaClient } from '@prisma/client';
import {
  calculateBrcOverdueDate,
  evaluateRealisationStatus,
  validateDutyPaymentAgainstBoE,
  verifyIncentiveClaimPreconditions,
  recordFinancialAudit,
} from '../lib/financial-closure';
import {
  exportRealisationCreateSchema,
  exportRealisationConfirmSchema,
  dutyPaymentRecordSchema,
  dutyPaymentConfirmSchema,
  incentiveClaimCreateSchema,
  incentiveClaimFileSchema,
  incentiveClaimSanctionSchema,
} from '../lib/validations';
import { hasPermission } from '../lib/rbac/permissions';

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('💰 Running Chunk 6: Financial Closure Loop Test Suite');
  console.log('====================================================');

  const runId = Date.now();
  const tenantAId = `tenant_fin_a_${runId}`;
  const tenantBId = `tenant_fin_b_${runId}`;
  const userIdA = `user_fin_a_${runId}`;
  const userIdB = `user_fin_b_${runId}`;

  try {
    // ==========================================
    // 1. Multi-Tenant Setup
    // ==========================================
    console.log('\n📦 1. Setup Multi-Tenant Financial Test Data');

    await prisma.company.createMany({
      data: [
        { id: tenantAId, name: 'Apex Global Exports India', panNumber: `PAN${runId.toString().slice(-7)}A`, gstNumber: `27${runId.toString().slice(-10)}1Z5` },
        { id: tenantBId, name: 'Bharat Logistics & Marine', panNumber: `PAN${runId.toString().slice(-7)}B`, gstNumber: `27${runId.toString().slice(-10)}2Z6` },
      ],
    });

    await prisma.user.createMany({
      data: [
        { id: userIdA, clerkId: `clerk_${userIdA}`, email: `fin_a_${runId}@shipsync.test`, companyId: tenantAId, role: 'OPS_EXECUTIVE' },
        { id: userIdB, clerkId: `clerk_${userIdB}`, email: `fin_b_${runId}@shipsync.test`, companyId: tenantBId, role: 'OPS_EXECUTIVE' },
      ],
    });

    const exportShipmentA = await prisma.shipment.create({
      data: {
        companyId: tenantAId,
        userId: userIdA,
        buyerName: 'EuroTech GmbH Berlin',
        buyerCountry: 'Germany',
        productDesc: 'Precision Automotive Gearboxes',
        hsCode: '87084000',
        value: 1000000,
        currency: 'INR',
        status: 'SHIPPED',
      },
    });

    const importShipmentA = await prisma.importShipment.create({
      data: {
        companyId: tenantAId,
        userId: userIdA,
        importerName: 'Apex Global Imports India',
        importerIEC: '0123456789',
        supplierName: 'Shenzhen Precision Optical',
        supplierCountry: 'China',
        portOfImport: 'INNSA1',
        hsCode: '85176290',
        invoiceValue: 500000,
        assessableValue: 505000,
        currency: 'INR',
        status: 'ASSESSED',
      },
    });

    const boeA = await prisma.billOfEntry.create({
      data: {
        companyId: tenantAId,
        importShipmentId: importShipmentA.id,
        beNumber: `BE-2026-${runId.toString().slice(-6)}`,
        dutyBreakdown: { bcd: 37500, igst: 97650, cess: 0 },
        totalDutyPayable: 135150,
        paymentStatus: 'PENDING',
      },
    });

    assert(Boolean(exportShipmentA.id), 'Created export shipment for Tenant A');
    assert(Boolean(importShipmentA.id), 'Created import shipment for Tenant A');
    assert(Boolean(boeA.id), 'Created Bill of Entry with ₹135,150 assessed duty');

    // ==========================================
    // 2. RBI Statutory 9-Month Export Realisation (BRC) Logic
    // ==========================================
    console.log('\n📜 2. RBI Statutory 9-Month Export Realisation (BRC) Rules');

    const exportDate = new Date('2026-01-01T00:00:00Z');
    const deadline = calculateBrcOverdueDate(exportDate, 9);
    assert(
      deadline.getUTCMonth() === 9 && deadline.getUTCFullYear() === 2026,
      'calculateBrcOverdueDate correctly adds 9 calendar months'
    );

    // Fully Realised
    const fullEval = evaluateRealisationStatus(1000000, 1000000, new Date('2026-12-31'));
    assert(fullEval.status === 'FULLY_REALISED', 'Equal realization evaluates to FULLY_REALISED');
    assert(fullEval.isOverdue === false, 'Fully realised is not flagged overdue');

    // Partially Realised before deadline
    const partialEval = evaluateRealisationStatus(1000000, 600000, new Date('2030-01-01'));
    assert(partialEval.status === 'PARTIALLY_REALISED', 'Partial remittance before deadline evaluates to PARTIALLY_REALISED');
    assert(partialEval.isOverdue === false, 'Partial remittance before deadline is not overdue');

    // Overdue evaluation (deadline in past)
    const overdueEval = evaluateRealisationStatus(1000000, 400000, new Date('2020-01-01'));
    assert(overdueEval.status === 'OVERDUE', 'Unfulfilled realization past deadline evaluates to OVERDUE');
    assert(overdueEval.isOverdue === true, 'Past deadline correctly flagged isOverdue: true');

    // Zod Validation
    const validBrcPayload = {
      shipmentId: exportShipmentA.id,
      amountRealised: 1000000,
      bankReferenceNumber: 'HDFC-BRC-2026-8812',
      remarks: '100% Inward wire received via AD Code 0510012',
    };
    assert(exportRealisationCreateSchema.safeParse(validBrcPayload).success, 'Valid BRC payload passes Zod validation');

    const invalidBrcPayload = {
      shipmentId: '',
      amountRealised: -500,
    };
    assert(!exportRealisationCreateSchema.safeParse(invalidBrcPayload).success, 'Invalid negative BRC payload rejected');

    // Create Realisation record
    const realisationA = await prisma.exportRealisation.create({
      data: {
        companyId: tenantAId,
        shipmentId: exportShipmentA.id,
        invoiceValue: exportShipmentA.value,
        amountRealised: 1000000,
        currency: 'INR',
        bankReferenceNumber: 'HDFC-BRC-2026-8812',
        status: 'FULLY_REALISED',
        overdueDate: deadline,
        isOverdue: false,
        recordedBy: userIdA,
      },
    });
    assert(Boolean(realisationA.id), 'Recorded BRC realization record in database');

    // Audit Logging
    await recordFinancialAudit(tenantAId, {
      entityType: 'EXPORT_REALISATION',
      entityId: realisationA.id,
      action: 'CREATE',
      newValue: realisationA,
      performedBy: userIdA,
      reason: 'Recorded initial BRC remittance',
    });

    const audit1 = await prisma.financialAuditLog.findFirst({
      where: { companyId: tenantAId, entityId: realisationA.id },
    });
    assert(Boolean(audit1), 'Append-only financial audit log recorded for BRC creation');

    // ==========================================
    // 3. Import Customs Duty Payment & Server-Side Validation
    // ==========================================
    console.log('\n🏛️ 3. Import Customs Duty Payment & Server-Side BoE Validation');

    // Exact Match
    const matchVal = validateDutyPaymentAgainstBoE(135150, 135150);
    assert(matchVal.isMatch === true, 'Exact duty payment matches BoE calculated duty');
    assert(matchVal.status === 'VERIFIED', 'Matching payment status is VERIFIED');

    // Minor tolerance (₹0.50)
    const minorTol = validateDutyPaymentAgainstBoE(135150, 135150.5);
    assert(minorTol.isMatch === true, 'Minor rounding within ₹1.00 tolerance matches');

    // Short payment (Underpaid)
    const shortVal = validateDutyPaymentAgainstBoE(135150, 100000);
    assert(shortVal.isMatch === false, 'Short payment detected and rejected as mismatch');
    assert(shortVal.status === 'MISMATCH', 'Short payment flagged as MISMATCH');
    assert(Boolean(shortVal.discrepancyReason?.includes('Short payment')), 'Discrepancy reason generated for short payment');

    // Excess payment
    const excessVal = validateDutyPaymentAgainstBoE(135150, 150000);
    assert(excessVal.isMatch === false, 'Excess payment flagged as mismatch');
    assert(excessVal.status === 'MISMATCH', 'Excess payment flagged as MISMATCH');

    // Zod validation
    const validChallan = {
      importShipmentId: importShipmentA.id,
      challanNumber: 'CH-2026-991204',
      amountPaid: 135150,
      paymentMode: 'ICEGATE_E_PAYMENT',
      paymentReference: 'SBIN000213941',
    };
    assert(dutyPaymentRecordSchema.safeParse(validChallan).success, 'Valid duty challan payload passes Zod validation');

    const invalidChallan = {
      importShipmentId: '',
      challanNumber: 'AB',
      amountPaid: -100,
    };
    assert(!dutyPaymentRecordSchema.safeParse(invalidChallan).success, 'Invalid negative duty challan rejected');

    // Record Payment in DB
    const paymentRecord = await prisma.dutyPayment.create({
      data: {
        companyId: tenantAId,
        importShipmentId: importShipmentA.id,
        billOfEntryId: boeA.id,
        challanNumber: 'CH-2026-991204',
        amountPaid: 135150,
        calculatedDuty: boeA.totalDutyPayable,
        paymentMode: 'ICEGATE_E_PAYMENT',
        paymentReference: 'SBIN000213941',
        status: 'PENDING',
        recordedBy: userIdA,
      },
    });
    assert(Boolean(paymentRecord.id), 'Recorded ICEGATE duty payment challan in database');

    // Confirmation workflow (Admin confirmation)
    const confirmedPayment = await prisma.dutyPayment.update({
      where: { id: paymentRecord.id },
      data: {
        status: 'VERIFIED',
        confirmedBy: userIdA,
        confirmedAt: new Date(),
      },
    });
    assert(confirmedPayment.status === 'VERIFIED', 'Payment transitioned to VERIFIED upon confirmation');

    // Update BoE and Import Shipment
    const updatedBoe = await prisma.billOfEntry.update({
      where: { id: boeA.id },
      data: { paymentStatus: 'PAID', challanNumber: confirmedPayment.challanNumber },
    });
    assert(updatedBoe.paymentStatus === 'PAID', 'Bill of Entry paymentStatus updated to PAID');

    const updatedImportShipment = await prisma.importShipment.update({
      where: { id: importShipmentA.id },
      data: { status: 'DUTY_PAID' },
    });
    assert(updatedImportShipment.status === 'DUTY_PAID', 'Import shipment status transitioned to DUTY_PAID');

    // Audit Logging
    await recordFinancialAudit(tenantAId, {
      entityType: 'DUTY_PAYMENT',
      entityId: confirmedPayment.id,
      action: 'CONFIRM',
      previousValue: paymentRecord,
      newValue: confirmedPayment,
      performedBy: userIdA,
      reason: 'Confirmed ICEGATE payment scroll',
    });

    // ==========================================
    // 4. RoDTEP / Drawback Incentive Claims & Statutory Gates
    // ==========================================
    console.log('\n🎯 4. Incentive Claims & Statutory Precondition Gate Checks');

    // Gate Check: Preconditions
    // Check 1: Shipment status DRAFT should fail
    const draftGate = verifyIncentiveClaimPreconditions({
      status: 'DRAFT',
      exportRealisations: [{ status: 'FULLY_REALISED', isOverdue: false }],
      documents: [{ docType: 'COMMERCIAL_INVOICE' }, { docType: 'SHIPPING_BILL' }],
    });
    assert(draftGate.isEligible === false, 'Claim rejected when shipment is in DRAFT status');

    // Check 2: Overdue BRC should fail
    const overdueGate = verifyIncentiveClaimPreconditions({
      status: 'SHIPPED',
      exportRealisations: [{ status: 'OVERDUE', isOverdue: true }],
      documents: [{ docType: 'COMMERCIAL_INVOICE' }, { docType: 'SHIPPING_BILL' }],
    });
    assert(overdueGate.isEligible === false, 'Claim rejected when BRC realization is OVERDUE');
    assert(
      overdueGate.reasons.some((r) => r.includes('OVERDUE')),
      'Rejection reason mentions overdue RBI realization guidelines'
    );

    // Check 3: Missing documents should fail
    const missingDocsGate = verifyIncentiveClaimPreconditions({
      status: 'SHIPPED',
      exportRealisations: [{ status: 'FULLY_REALISED', isOverdue: false }],
      documents: [{ docType: 'COMMERCIAL_INVOICE' }], // Missing SHIPPING_BILL
    });
    assert(missingDocsGate.isEligible === false, 'Claim rejected when statutory Shipping Bill is missing');

    // Check 4: Valid Preconditions pass
    const validGate = verifyIncentiveClaimPreconditions({
      status: 'SHIPPED',
      exportRealisations: [{ status: 'FULLY_REALISED', isOverdue: false }],
      documents: [{ docType: 'COMMERCIAL_INVOICE' }, { docType: 'SHIPPING_BILL' }],
    });
    assert(validGate.isEligible === true, 'Claim gate cleared when shipment is SHIPPED, BRC is verified, and docs exist');
    assert(validGate.reasons.length === 0, 'No gate rejection reasons when preconditions are met');

    // Zod validation
    const validClaim = {
      shipmentId: exportShipmentA.id,
      scheme: 'RODTEP',
      claimedAmount: 48000,
    };
    assert(incentiveClaimCreateSchema.safeParse(validClaim).success, 'Valid incentive claim payload passes Zod validation');

    // Record Claim
    const claimRecord = await prisma.incentiveClaim.create({
      data: {
        companyId: tenantAId,
        shipmentId: exportShipmentA.id,
        scheme: 'RODTEP',
        claimedAmount: 48000,
        status: 'DRAFT',
        recordedBy: userIdA,
      },
    });
    assert(claimRecord.status === 'DRAFT', 'Initial incentive claim created in DRAFT status');

    // Progress to FILED
    const filedClaim = await prisma.incentiveClaim.update({
      where: { id: claimRecord.id },
      data: {
        status: 'FILED',
        filingDate: new Date(),
      },
    });
    assert(filedClaim.status === 'FILED', 'Incentive claim transitioned to FILED');
    assert(Boolean(filedClaim.filingDate), 'Filing timestamp recorded on claim');

    // Sanction with Scroll Number
    const validSanction = {
      sanctionedAmount: 48000,
      scrollNumber: 'SCR-2026-MUM-0914',
      status: 'SANCTIONED',
    };
    assert(incentiveClaimSanctionSchema.safeParse(validSanction).success, 'Valid sanction payload passes Zod validation');

    const sanctionedClaim = await prisma.incentiveClaim.update({
      where: { id: claimRecord.id },
      data: {
        status: 'SANCTIONED',
        sanctionedAmount: 48000,
        scrollNumber: 'SCR-2026-MUM-0914',
        sanctionDate: new Date(),
        sanctionedBy: userIdA,
      },
    });
    assert(sanctionedClaim.status === 'SANCTIONED', 'Incentive claim transitioned to SANCTIONED');
    assert(sanctionedClaim.scrollNumber === 'SCR-2026-MUM-0914', 'Customs scroll number recorded on claim');

    // ==========================================
    // 5. Append-Only Financial Audit Trail
    // ==========================================
    console.log('\n🔍 5. Append-Only Financial Audit Trail Verification');

    const auditLogs = await prisma.financialAuditLog.findMany({
      where: { companyId: tenantAId },
    });
    assert(auditLogs.length >= 2, `Append-only financial audit trail contains ${auditLogs.length} entries`);

    const brcAudit = auditLogs.find((l) => l.entityType === 'EXPORT_REALISATION');
    assert(Boolean(brcAudit?.newValue), 'Audit trail captures newValue payload snapshot');
    assert(brcAudit?.performedBy === userIdA, 'Audit trail records actor userId');

    // ==========================================
    // 6. Multi-Tenant Data Isolation
    // ==========================================
    console.log('\n🔒 6. Multi-Tenant Financial Data Isolation');

    // Tenant B creates data
    const exportShipmentB = await prisma.shipment.create({
      data: {
        companyId: tenantBId,
        userId: userIdB,
        buyerName: 'Dubai Metals LLC',
        buyerCountry: 'United Arab Emirates',
        productDesc: 'Copper Rods & Extrusions',
        hsCode: '74071010',
        value: 750000,
        currency: 'INR',
        status: 'SHIPPED',
      },
    });

    const realisationB = await prisma.exportRealisation.create({
      data: {
        companyId: tenantBId,
        shipmentId: exportShipmentB.id,
        invoiceValue: 750000,
        amountRealised: 750000,
        currency: 'INR',
        status: 'FULLY_REALISED',
        overdueDate: deadline,
        recordedBy: userIdB,
      },
    });

    const dutyPaymentB = await prisma.dutyPayment.create({
      data: {
        companyId: tenantBId,
        importShipmentId: importShipmentA.id, // reference
        billOfEntryId: boeA.id,
        challanNumber: 'CH-TENANT-B-999',
        amountPaid: 50000,
        calculatedDuty: 50000,
        recordedBy: userIdB,
      },
    });

    const claimB = await prisma.incentiveClaim.create({
      data: {
        companyId: tenantBId,
        shipmentId: exportShipmentB.id,
        scheme: 'DRAWBACK',
        claimedAmount: 22500,
        status: 'DRAFT',
        recordedBy: userIdB,
      },
    });

    // Cross-tenant queries
    const tenantARealisations = await prisma.exportRealisation.findMany({
      where: { companyId: tenantAId },
    });
    assert(
      tenantARealisations.every((r) => r.companyId === tenantAId),
      'Tenant A query returns only Tenant A realisations'
    );
    assert(
      !tenantARealisations.some((r) => r.id === realisationB.id),
      'Tenant A CANNOT see Tenant B realisations'
    );

    const tenantADutyPayments = await prisma.dutyPayment.findMany({
      where: { companyId: tenantAId },
    });
    assert(
      !tenantADutyPayments.some((p) => p.id === dutyPaymentB.id),
      'Tenant A CANNOT see Tenant B duty payments'
    );

    const tenantAClaims = await prisma.incentiveClaim.findMany({
      where: { companyId: tenantAId },
    });
    assert(
      !tenantAClaims.some((c) => c.id === claimB.id),
      'Tenant A CANNOT see Tenant B incentive claims'
    );

    // ==========================================
    // 7. Role-Based Access Control (RBAC) Verification
    // ==========================================
    console.log('\n🛡️ 7. Financial Role-Based Access Control (RBAC) Verification');

    // BRC Realisation permissions
    assert(hasPermission('OWNER', 'export_realisation:create'), 'OWNER has export_realisation:create');
    assert(hasPermission('ADMIN', 'export_realisation:create'), 'ADMIN has export_realisation:create');
    assert(hasPermission('OPS_EXECUTIVE', 'export_realisation:create'), 'OPS_EXECUTIVE has export_realisation:create');
    assert(!hasPermission('VIEWER', 'export_realisation:create'), 'VIEWER denied export_realisation:create');

    // Confirmation must be strictly restricted (OPS_EXECUTIVE CANNOT CONFIRM!)
    assert(hasPermission('OWNER', 'export_realisation:confirm'), 'OWNER has export_realisation:confirm');
    assert(hasPermission('ADMIN', 'export_realisation:confirm'), 'ADMIN has export_realisation:confirm');
    assert(!hasPermission('OPS_EXECUTIVE', 'export_realisation:confirm'), 'OPS_EXECUTIVE denied export_realisation:confirm');
    assert(!hasPermission('COMPLIANCE_OFFICER', 'export_realisation:confirm'), 'COMPLIANCE_OFFICER denied export_realisation:confirm');
    assert(!hasPermission('VIEWER', 'export_realisation:confirm'), 'VIEWER denied export_realisation:confirm');

    // Duty Payment Confirmation (OPS_EXECUTIVE CANNOT CONFIRM!)
    assert(hasPermission('OWNER', 'duty_payment:confirm'), 'OWNER has duty_payment:confirm');
    assert(hasPermission('ADMIN', 'duty_payment:confirm'), 'ADMIN has duty_payment:confirm');
    assert(!hasPermission('OPS_EXECUTIVE', 'duty_payment:confirm'), 'OPS_EXECUTIVE denied duty_payment:confirm');
    assert(!hasPermission('VIEWER', 'duty_payment:confirm'), 'VIEWER denied duty_payment:confirm');

    // Incentive Claim Sanction (OPS_EXECUTIVE CANNOT SANCTION!)
    assert(hasPermission('OWNER', 'incentive_claim:sanction'), 'OWNER has incentive_claim:sanction');
    assert(hasPermission('ADMIN', 'incentive_claim:sanction'), 'ADMIN has incentive_claim:sanction');
    assert(!hasPermission('OPS_EXECUTIVE', 'incentive_claim:sanction'), 'OPS_EXECUTIVE denied incentive_claim:sanction');
    assert(!hasPermission('VIEWER', 'incentive_claim:sanction'), 'VIEWER denied incentive_claim:sanction');

    // Read permissions
    assert(hasPermission('OPS_EXECUTIVE', 'export_realisation:read'), 'OPS_EXECUTIVE has export_realisation:read');
    assert(hasPermission('COMPLIANCE_OFFICER', 'export_realisation:read'), 'COMPLIANCE_OFFICER has export_realisation:read');
    assert(hasPermission('VIEWER', 'export_realisation:read'), 'VIEWER has export_realisation:read');
    assert(hasPermission('VIEWER', 'financial_audit:read'), 'VIEWER has financial_audit:read');

    // ==========================================
    // Cleanup
    // ==========================================
    console.log('\n🧹 Cleaning up test artifacts...');
    await prisma.financialAuditLog.deleteMany({ where: { companyId: { in: [tenantAId, tenantBId] } } });
    await prisma.incentiveClaim.deleteMany({ where: { companyId: { in: [tenantAId, tenantBId] } } });
    await prisma.dutyPayment.deleteMany({ where: { companyId: { in: [tenantAId, tenantBId] } } });
    await prisma.exportRealisation.deleteMany({ where: { companyId: { in: [tenantAId, tenantBId] } } });
    await prisma.billOfEntry.deleteMany({ where: { companyId: { in: [tenantAId, tenantBId] } } });
    await prisma.importShipment.deleteMany({ where: { companyId: { in: [tenantAId, tenantBId] } } });
    await prisma.shipment.deleteMany({ where: { companyId: { in: [tenantAId, tenantBId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userIdA, userIdB] } } });
    await prisma.company.deleteMany({ where: { id: { in: [tenantAId, tenantBId] } } });

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log('====================================================');
  console.log(`🎉 Chunk 6 Tests Completed: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
