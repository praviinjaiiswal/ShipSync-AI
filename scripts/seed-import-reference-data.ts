/**
 * Seed script for Import Module Reference Data:
 * 1. ImportDutyRate table (CBIC Tariff Schedules)
 * 2. RestrictedItemsList table (ITC-HS Import Policies: Free, Restricted, Prohibited, STE)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SAMPLE_DUTY_RATES = [
  {
    hsCode: '84821010',
    description: 'Ball bearings of all kinds for industrial machinery',
    bcdRate: 0.075, // 7.5%
    igstRate: 0.18,  // 18%
    cessRate: 0.0,
    sourceNotificationRef: 'Customs Notification No. 50/2017-Customs, Entry 442',
  },
  {
    hsCode: '84713010',
    description: 'Personal computers, laptops and micro-computers',
    bcdRate: 0.0,   // 0% (ITA-1 compliance)
    igstRate: 0.18,  // 18%
    cessRate: 0.0,
    sourceNotificationRef: 'Customs Notification No. 24/2005-Customs (ITA-1 item)',
  },
  {
    hsCode: '85044090',
    description: 'Static converters, inverters and electric power supply units',
    bcdRate: 0.10,  // 10%
    igstRate: 0.18,  // 18%
    cessRate: 0.0,
    sourceNotificationRef: 'Customs Notification No. 50/2017-Customs, Entry 488',
  },
  {
    hsCode: '87082900',
    description: 'Other parts and accessories of bodies for motor vehicles',
    bcdRate: 0.15,  // 15%
    igstRate: 0.28,  // 28%
    cessRate: 0.0,
    sourceNotificationRef: 'Customs Notification No. 50/2017-Customs, Entry 520',
  },
  {
    hsCode: '72081000',
    description: 'Flat-rolled products of iron or non-alloy steel, hot-rolled',
    bcdRate: 0.075, // 7.5%
    igstRate: 0.18,  // 18%
    cessRate: 0.0,
    sourceNotificationRef: 'Customs Notification No. 50/2017-Customs, Entry 334',
  },
  {
    hsCode: '71081200',
    description: 'Gold unwrought or in semi-manufactured forms (other than monetary)',
    bcdRate: 0.10,  // 10%
    igstRate: 0.03,  // 3%
    cessRate: 0.0,
    sourceNotificationRef: 'Customs Notification No. 50/2017-Customs, Entry 356',
  },
  {
    hsCode: '85171300',
    description: 'Smartphones and other wireless cellular network handsets',
    bcdRate: 0.20,  // 20%
    igstRate: 0.18,  // 18%
    cessRate: 0.0,
    sourceNotificationRef: 'Customs Notification No. 57/2017-Customs',
  },
  {
    hsCode: '05080010',
    description: 'Coral and similar materials, unworked or simply prepared',
    bcdRate: 0.30,  // 30%
    igstRate: 0.18,  // 18%
    cessRate: 0.0,
    sourceNotificationRef: 'Customs Tariff Act Schedule I',
  },
];

const SAMPLE_RESTRICTED_POLICIES = [
  {
    hsCode: '84821010',
    description: 'Ball bearings',
    policy: 'FREE' as const,
    policyCondition: 'Freely importable without DGFT license',
    requiredLicenseType: null,
  },
  {
    hsCode: '84713010',
    description: 'Laptops and automated data processing machines',
    policy: 'RESTRICTED' as const,
    policyCondition: 'Requires valid DGFT Import Authorization or Import Management System clearance',
    requiredLicenseType: 'DGFT_IMPORT_AUTHORIZATION',
  },
  {
    hsCode: '85044090',
    description: 'Static converters',
    policy: 'FREE' as const,
    policyCondition: 'BIS CRS registration required for adapter components',
    requiredLicenseType: null,
  },
  {
    hsCode: '87082900',
    description: 'Automotive components',
    policy: 'FREE' as const,
    policyCondition: 'Subject to homologation or AIS compliance where applicable',
    requiredLicenseType: null,
  },
  {
    hsCode: '72081000',
    description: 'Flat-rolled steel',
    policy: 'FREE' as const,
    policyCondition: 'Subject to Steel Quality Control Order (BIS license)',
    requiredLicenseType: 'BIS_STEEL_CERTIFICATE',
  },
  {
    hsCode: '71081200',
    description: 'Gold unwrought',
    policy: 'STE' as const,
    policyCondition: 'Import permitted only through nominated banks/agencies per RBI/DGFT policy',
    requiredLicenseType: 'NOMINATED_AGENCY_AUTHORIZATION',
  },
  {
    hsCode: '05080010',
    description: 'Corals & sea shells (endangered marine species)',
    policy: 'PROHIBITED' as const,
    policyCondition: 'Strictly prohibited for commercial import under Wild Life (Protection) Act, 1972 & CITES',
    requiredLicenseType: null,
  },
  {
    hsCode: '85171300',
    description: 'Smartphones',
    policy: 'FREE' as const,
    policyCondition: 'IMEI registration on Indian Customs CIP portal mandatory prior to arrival',
    requiredLicenseType: null,
  },
];

async function seed() {
  console.log('📦 Seeding Import Duty Rates...');
  for (const rate of SAMPLE_DUTY_RATES) {
    await prisma.importDutyRate.upsert({
      where: { hsCode: rate.hsCode },
      update: rate,
      create: rate,
    });
    console.log(`  ✓ HS Code ${rate.hsCode} -> BCD ${(rate.bcdRate * 100).toFixed(1)}%, IGST ${(rate.igstRate * 100).toFixed(1)}%`);
  }

  console.log('\n🛡️ Seeding ITC-HS Import Policies & Restrictions...');
  for (const item of SAMPLE_RESTRICTED_POLICIES) {
    await prisma.restrictedItemsList.upsert({
      where: { hsCode: item.hsCode },
      update: item,
      create: item,
    });
    console.log(`  ✓ HS Code ${item.hsCode} -> Policy: ${item.policy}`);
  }

  console.log('\n✅ Import reference data seeded successfully!');
}

seed()
  .catch((e) => {
    console.error('Failed to seed reference data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
