import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getOrgContext } from "@/lib/getOrgContext";

export async function GET() {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shipments = await prisma.shipment.findMany({
    where: { userId: ctx.effectiveOwnerId },
    select: {
      id: true,
      buyerName: true,
      status: true,
      complianceScore: true,
      sanctionsCheck: { select: { matchFound: true } },
      riskReport: { select: { countryRiskScore: true, buyerRiskScore: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(shipments);
}