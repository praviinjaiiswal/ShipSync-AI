import { prisma } from '../app/lib/prisma';
import { TradeUpdateCategory, TradeUpdateStatus } from '@prisma/client';

async function runTests() {
  console.log('=== Running Trade Intelligence Test Suite ===\n');

  // Test 1: De-duplication and Database Operations
  console.log('Test 1: Testing atomic creation and deduplication...');
  const testUrl = `https://content.dgft.gov.in/test-notif-${Date.now()}.pdf`;

  // Insert test source seen
  await prisma.tradeUpdateSourceSeen.create({
    data: { sourceUrl: testUrl },
  });

  const isSeen = await prisma.tradeUpdateSourceSeen.findUnique({
    where: { sourceUrl: testUrl },
  });
  if (!isSeen) throw new Error('Failed to find test TradeUpdateSourceSeen');
  console.log('✔ TradeUpdateSourceSeen created and queried successfully.');

  // Attempt duplicate insert should fail unique constraint
  let duplicateCaught = false;
  try {
    await prisma.tradeUpdateSourceSeen.create({
      data: { sourceUrl: testUrl },
    });
  } catch {
    duplicateCaught = true;
  }
  if (!duplicateCaught) throw new Error('Duplicate sourceUrl insert was not rejected by unique constraint!');
  console.log('✔ Duplicate sourceUrl successfully rejected by unique constraint.');

  // Test 2: TradeUpdate lifecycle: Draft -> Edit -> Approve / Publish
  console.log('\nTest 2: Testing TradeUpdate lifecycle...');
  const draft = await prisma.tradeUpdate.create({
    data: {
      title: 'DGFT Extends RoDTEP Scheme for Engineering Goods to Dec 2026',
      summary:
        'The Directorate General of Foreign Trade has announced a 6-month extension of the Remission of Duties and Taxes on Exported Products (RoDTEP) rates for HS Chapters 72, 73, and 84. Engineering exporters can continue claiming eligible rebates on outbound shipping bills without interruption.',
      category: TradeUpdateCategory.DGFT_NOTIFICATION,
      country: 'Global',
      sourceName: 'DGFT',
      sourceUrl: testUrl,
      status: TradeUpdateStatus.PENDING_REVIEW,
      draftedBy: 'AI',
    },
  });
  console.log(`✔ Draft created with ID: ${draft.id}, status: ${draft.status}`);

  if (draft.status !== 'PENDING_REVIEW') {
    throw new Error('New draft was auto-published! Must be PENDING_REVIEW.');
  }
  console.log('✔ Draft is in PENDING_REVIEW (never auto-published).');

  // Test approve
  const approved = await prisma.tradeUpdate.update({
    where: { id: draft.id },
    data: {
      status: TradeUpdateStatus.PUBLISHED,
      publishedAt: new Date(),
      reviewedByUserId: 'test-admin-user',
    },
  });
  if (approved.status !== 'PUBLISHED' || !approved.publishedAt) {
    throw new Error('Approval failed to update status or publishedAt');
  }
  console.log('✔ Draft approved and published successfully.');

  // Test reject with notes
  const rejectedDraft = await prisma.tradeUpdate.create({
    data: {
      title: 'Test Circular Not Applicable to Exporters',
      summary: 'Internal administrative transfer of customs commissioners.',
      category: TradeUpdateCategory.OTHER,
      sourceName: 'DGFT',
      sourceUrl: `https://dgft.gov.in/test-reject-${Date.now()}`,
      status: TradeUpdateStatus.PENDING_REVIEW,
      draftedBy: 'AI',
    },
  });

  const rejected = await prisma.tradeUpdate.update({
    where: { id: rejectedDraft.id },
    data: {
      status: TradeUpdateStatus.REJECTED,
      reviewedByUserId: 'test-admin-user',
      reviewNotes: 'Internal staffing notice; no relevance to Indian exporters/importers.',
    },
  });
  if (rejected.status !== 'REJECTED' || !rejected.reviewNotes) {
    throw new Error('Rejection failed to set status or reviewNotes');
  }
  console.log('✔ Draft rejected with audit notes successfully.');

  // Test 3: Public Query Simulation
  console.log('\nTest 3: Verifying public query only fetches PUBLISHED items...');
  const publicUpdates = await prisma.tradeUpdate.findMany({
    where: { status: TradeUpdateStatus.PUBLISHED },
    orderBy: { publishedAt: 'desc' },
  });
  const hasPendingOrRejected = publicUpdates.some(
    (u) => u.status === 'PENDING_REVIEW' || u.status === 'REJECTED'
  );
  if (hasPendingOrRejected) {
    throw new Error('Public query contains unapproved drafts!');
  }
  console.log(`✔ Public query returned ${publicUpdates.length} published updates, 0 unapproved items.`);

  console.log('\n=== All DB Lifecycle Tests Passed Successfully ===\n');
}

runTests()
  .catch((e) => {
    console.error('Test failed:', e);
    process.exit(1);
  });
