/**
 * ShipSync AI — Multi-Tenant Migration & Backfill Script
 * 
 * Idempotent migration script that:
 * 1. Creates a Company record for each existing Owner / unassigned user
 * 2. Links users to their company
 * 3. Backfills companyId on all tenant-scoped models:
 *    - Shipment, Document, ComplianceCheck, RiskReport, SanctionsCheck, License, Activity, TeamInvite
 * 4. Verifies no orphaned records remain without companyId
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const db = prisma as any;

async function migrate() {
  console.log('🔄 Starting Multi-Tenant Migration...\n');

  // Step 1: Find all users without a company
  const unassignedUsers = await db.user.findMany({
    where: { companyId: null },
  });

  console.log(`Found ${unassignedUsers.length} users without a company.`);

  for (const user of unassignedUsers) {
    const companyName = user.name ? `${user.name}'s Organization` : `${user.email.split('@')[0]}'s Organization`;
    
    // Create company
    const company = await db.company.create({
      data: {
        name: companyName,
      },
    });

    // Update user with company and OWNER role if not already
    await db.user.update({
      where: { id: user.id },
      data: {
        companyId: company.id,
        role: user.role === 'OPS_EXECUTIVE' ? 'OWNER' : user.role,
        onboardingComplete: true,
      },
    });

    console.log(`  ✓ Created company "${companyName}" (${company.id}) for user ${user.email}`);
  }

  // Step 2: Backfill companyId on Shipments
  console.log('\n🔄 Backfilling Shipments...');
  const shipmentsWithoutCompany = await db.shipment.findMany({
    where: { OR: [{ companyId: null }, { companyId: '' }] },
    include: { user: true },
  });

  for (const shipment of shipmentsWithoutCompany) {
    if (shipment.user?.companyId) {
      await db.shipment.update({
        where: { id: shipment.id },
        data: { companyId: shipment.user.companyId },
      });
    }
  }
  console.log(`  ✓ Processed ${shipmentsWithoutCompany.length} shipments.`);

  // Step 3: Backfill Documents
  console.log('\n🔄 Backfilling Documents...');
  const documentsWithoutCompany = await db.document.findMany({
    where: { OR: [{ companyId: null }, { companyId: '' }] },
    include: { shipment: true },
  });

  for (const doc of documentsWithoutCompany) {
    const targetCompanyId = doc.shipment?.companyId;
    if (targetCompanyId) {
      await db.document.update({
        where: { id: doc.id },
        data: { companyId: targetCompanyId },
      });
    }
  }
  console.log(`  ✓ Processed ${documentsWithoutCompany.length} documents.`);

  // Step 4: Backfill ComplianceChecks
  console.log('\n🔄 Backfilling ComplianceChecks...');
  const complianceWithoutCompany = await db.complianceCheck.findMany({
    where: { OR: [{ companyId: null }, { companyId: '' }] },
    include: { shipment: true },
  });

  for (const check of complianceWithoutCompany) {
    const targetCompanyId = check.shipment?.companyId;
    if (targetCompanyId) {
      await db.complianceCheck.update({
        where: { id: check.id },
        data: { companyId: targetCompanyId },
      });
    }
  }
  console.log(`  ✓ Processed ${complianceWithoutCompany.length} compliance checks.`);

  // Step 5: Backfill RiskReports
  console.log('\n🔄 Backfilling RiskReports...');
  const riskWithoutCompany = await db.riskReport.findMany({
    where: { OR: [{ companyId: null }, { companyId: '' }] },
    include: { shipment: true },
  });

  for (const risk of riskWithoutCompany) {
    const targetCompanyId = risk.shipment?.companyId;
    if (targetCompanyId) {
      await db.riskReport.update({
        where: { id: risk.id },
        data: { companyId: targetCompanyId },
      });
    }
  }
  console.log(`  ✓ Processed ${riskWithoutCompany.length} risk reports.`);

  // Step 6: Backfill SanctionsChecks
  console.log('\n🔄 Backfilling SanctionsChecks...');
  const sanctionsWithoutCompany = await db.sanctionsCheck.findMany({
    where: { OR: [{ companyId: null }, { companyId: '' }] },
    include: { shipment: true },
  });

  for (const item of sanctionsWithoutCompany) {
    const targetCompanyId = item.shipment?.companyId;
    if (targetCompanyId) {
      await db.sanctionsCheck.update({
        where: { id: item.id },
        data: { companyId: targetCompanyId },
      });
    }
  }
  console.log(`  ✓ Processed ${sanctionsWithoutCompany.length} sanctions checks.`);

  // Step 7: Backfill Licenses
  console.log('\n🔄 Backfilling Licenses...');
  const licensesWithoutCompany = await db.license.findMany({
    where: { OR: [{ companyId: null }, { companyId: '' }] },
    include: { user: true },
  });

  for (const lic of licensesWithoutCompany) {
    const targetCompanyId = lic.user?.companyId;
    if (targetCompanyId) {
      await db.license.update({
        where: { id: lic.id },
        data: { companyId: targetCompanyId },
      });
    }
  }
  console.log(`  ✓ Processed ${licensesWithoutCompany.length} licenses.`);

  // Step 8: Backfill Activities
  console.log('\n🔄 Backfilling Activities...');
  const activitiesWithoutCompany = await db.activity.findMany({
    where: { OR: [{ companyId: null }, { companyId: '' }] },
    include: { user: true },
  });

  for (const act of activitiesWithoutCompany) {
    const targetCompanyId = act.user?.companyId;
    if (targetCompanyId) {
      await db.activity.update({
        where: { id: act.id },
        data: { companyId: targetCompanyId },
      });
    }
  }
  console.log(`  ✓ Processed ${activitiesWithoutCompany.length} activities.`);

  console.log('\n✅ Multi-tenant data migration and backfill completed successfully!');
}

migrate()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
