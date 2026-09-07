const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrate() {
  console.log('🔄 Starting Multi-Tenant Migration & Backfill...\n');

  // Step 1: Update EXPORTER enum values to OPS_EXECUTIVE
  try {
    await prisma.$executeRawUnsafe(`UPDATE "User" SET "role" = 'OPS_EXECUTIVE' WHERE "role"::text = 'EXPORTER';`);
    await prisma.$executeRawUnsafe(`UPDATE "TeamInvite" SET "role" = 'OPS_EXECUTIVE' WHERE "role"::text = 'EXPORTER';`);
    console.log('  ✓ Normalized UserRole enum values');
  } catch (e) {
    console.log('  Note on enum normalization:', e.message);
  }

  // Step 2: Find all users without a company
  const unassignedUsers = await prisma.user.findMany({
    where: { companyId: null },
  });

  console.log(`Found ${unassignedUsers.length} users without a company.`);

  for (const user of unassignedUsers) {
    const companyName = user.name ? `${user.name}'s Organization` : `${user.email.split('@')[0]}'s Organization`;
    
    // Create company
    const company = await prisma.company.create({
      data: {
        name: companyName,
      },
    });

    // Update user with company and OWNER role if not already
    await prisma.user.update({
      where: { id: user.id },
      data: {
        companyId: company.id,
        role: user.role === 'OPS_EXECUTIVE' || user.role === 'EXPORTER' ? 'OWNER' : user.role,
        onboardingComplete: true,
      },
    });

    console.log(`  ✓ Created company "${companyName}" (${company.id}) for user ${user.email}`);
  }

  // Step 3: Backfill companyId on Shipments
  const shipments = await prisma.shipment.findMany({
    where: { companyId: null },
    include: { user: true },
  });

  for (const shipment of shipments) {
    if (shipment.user && shipment.user.companyId) {
      await prisma.shipment.update({
        where: { id: shipment.id },
        data: { companyId: shipment.user.companyId },
      });
    }
  }
  console.log(`  ✓ Backfilled ${shipments.length} shipments.`);

  // Step 4: Backfill Licenses
  const licenses = await prisma.license.findMany({
    where: { companyId: null },
    include: { user: true },
  });

  for (const lic of licenses) {
    if (lic.user && lic.user.companyId) {
      await prisma.license.update({
        where: { id: lic.id },
        data: { companyId: lic.user.companyId },
      });
    }
  }
  console.log(`  ✓ Backfilled ${licenses.length} licenses.`);

  // Step 5: Backfill TeamInvites
  const invites = await prisma.teamInvite.findMany({
    where: { companyId: null },
  });

  if (invites.length > 0) {
    // If any company exists, link them, or set expiration
    const defaultCompany = await prisma.company.findFirst();
    if (defaultCompany) {
      for (const inv of invites) {
        await prisma.teamInvite.update({
          where: { id: inv.id },
          data: {
            companyId: defaultCompany.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }
    console.log(`  ✓ Backfilled ${invites.length} team invites.`);
  }

  console.log('\n✅ All database records successfully migrated and backfilled!');
}

migrate()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
