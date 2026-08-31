import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getOrgContext } from "@/lib/getOrgContext";

export async function GET() {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shipments = await prisma.shipment.findMany({
    where: { userId: ctx.effectiveOwnerId },
    select: { hsCode: true, value: true },
  });

  const hsCodes = [...new Set(shipments.map((s) => s.hsCode))];
  const rates = await prisma.dutyIncentiveRate.findMany({
    where: { hsCode: { in: hsCodes } },
  });
  const rateMap = new Map(rates.map((r) => [r.hsCode, r]));

  let totalEstimated = 0;
  let unmatchedCount = 0;

  for (const s of shipments) {
    const rate = rateMap.get(s.hsCode);
    if (rate?.rodtepRate) {
      totalEstimated += s.value * (rate.rodtepRate / 100);
    } else {
      unmatchedCount++;
    }
  }

  return NextResponse.json({ totalEstimated, unmatchedCount, totalShipments: shipments.length });
}