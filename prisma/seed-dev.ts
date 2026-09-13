import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Strict guard: Never allow execution in production
if (process.env.NODE_ENV === "production") {
  console.error("CRITICAL SAFETY ERROR: prisma/seed-dev.ts cannot be executed in production environments.");
  process.exit(1);
}

/**
 * Local Development & Demo Seeding Script
 * 
 * Usage:
 *   pnpm run seed:dev
 * 
 * Note: These are sample records intended strictly for local UI/UX testing.
 * In production, trade intelligence records are populated solely via official DGFT gazette scraping.
 */
async function main() {
  console.log("🌱 Seeding local dev sample trade updates...");

  const sampleUpdates = [
    {
      title: "DGFT Public Notice: Extension of RoDTEP Scheme for Apparel & Textile Chapters",
      summary: "Directorate General of Foreign Trade notifies continuation of RoDTEP rebate benefits for Chapters 61, 62, and 63 to support export competitiveness on ICEGATE-filed shipping bills.",
      category: "DGFT_NOTIFICATION" as const,
      country: "India",
      sourceName: "DGFT",
      sourceUrl: "https://www.dgft.gov.in/CP/?opt=notification",
      status: "PUBLISHED" as const,
      draftedBy: "ADMIN" as const,
      publishedAt: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      title: "DGFT Trade Notice: Mandatory E-BRC Reconciliation for Outstanding Export Remittances",
      summary: "All Authorized Dealer (AD) Category-I banks and merchant exporters must reconcile pending Inward Remittance Messages (IRMs) on the DGFT portal to maintain export incentive compliance.",
      category: "DGFT_NOTIFICATION" as const,
      country: "Global",
      sourceName: "DGFT",
      sourceUrl: "https://www.dgft.gov.in/CP/?opt=trade-notice",
      status: "PUBLISHED" as const,
      draftedBy: "ADMIN" as const,
      publishedAt: new Date(Date.now() - 1000 * 60 * 180),
    },
    {
      title: "SCOMET Dual-Use Goods: Clarification on Export Authorizations for Optical Sensors",
      summary: "DGFT issues procedural clarification for Category 8 dual-use goods under SCOMET guidelines, streamlining the re-export license verification protocol.",
      category: "SANCTIONS" as const,
      country: "Global",
      sourceName: "DGFT",
      sourceUrl: "https://www.dgft.gov.in/CP/?opt=scomet",
      status: "PUBLISHED" as const,
      draftedBy: "ADMIN" as const,
      publishedAt: new Date(Date.now() - 1000 * 60 * 360),
    },
    {
      title: "India-UAE CEPA Tariff Quota Desk: Tranche IV Operationalization Notice",
      summary: "Department of Commerce operationalizes Year-4 tariff phase-down schedules under the India-UAE Comprehensive Economic Partnership Agreement.",
      category: "FTA" as const,
      country: "UAE",
      sourceName: "Ministry of Commerce",
      sourceUrl: "https://commerce.gov.in/trade-agreements/",
      status: "PUBLISHED" as const,
      draftedBy: "ADMIN" as const,
      publishedAt: new Date(Date.now() - 1000 * 60 * 720),
    },
  ];

  for (const item of sampleUpdates) {
    await prisma.tradeUpdate.upsert({
      where: { id: `dev-${item.category}-${item.sourceName}`.toLowerCase() },
      update: {
        title: item.title,
        summary: item.summary,
        status: item.status,
        publishedAt: item.publishedAt,
      },
      create: {
        id: `dev-${item.category}-${item.sourceName}`.toLowerCase(),
        title: item.title,
        summary: item.summary,
        category: item.category,
        country: item.country,
        sourceName: item.sourceName,
        sourceUrl: item.sourceUrl,
        status: item.status,
        draftedBy: item.draftedBy,
        publishedAt: item.publishedAt,
      },
    });
  }

  console.log("✅ Local dev sample trade updates seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
