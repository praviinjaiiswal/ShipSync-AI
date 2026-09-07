import { prisma } from '../app/lib/prisma';

async function main() {
  console.log('Deduplicating existing legacy documents for partial index compatibility...');
  
  // Set older duplicates to isLatest = false, keeping only the newest record per (shipmentId, docType)
  await prisma.$executeRawUnsafe(`
    WITH ranked_docs AS (
      SELECT id,
             ROW_NUMBER() OVER(
               PARTITION BY "shipmentId", "docType" 
               ORDER BY "createdAt" DESC, id DESC
             ) as rn
      FROM "Document"
      WHERE "shipmentId" IS NOT NULL
    )
    UPDATE "Document"
    SET "isLatest" = false
    WHERE id IN (
      SELECT id FROM ranked_docs WHERE rn > 1
    );
  `);

  console.log('Applying partial unique index on Document (shipmentId, docType) WHERE isLatest = true...');
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS doc_latest_unique 
    ON "Document" ("shipmentId", "docType") 
    WHERE "isLatest" = true;
  `);
  console.log('✓ Successfully applied partial unique index doc_latest_unique.');
}

main()
  .catch((e) => {
    console.error('Failed to create index:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
