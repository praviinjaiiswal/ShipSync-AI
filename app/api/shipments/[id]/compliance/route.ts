import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getOrgContext } from "@/lib/getOrgContext";
import { checkCompliance } from "@/lib/ai";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shipment = await prisma.shipment.findFirst({
    where: { id: params.id, userId: ctx.effectiveOwnerId },
  });
  if (!shipment) return NextResponse.json({ error: "Shipment not found" }, { status: 404 });

  try {
    const result = await checkCompliance(shipment);
    const { complianceScore = 0, issues = [], recommendations = [] } = result;

    const [check] = await prisma.$transaction([
      prisma.complianceCheck.create({
        data: {
          shipmentId: shipment.id,
          checkType: "AI_DGFT_REVIEW",
          status: complianceScore >= 70 ? "PASSED" : "NEEDS_ATTENTION",
          details: JSON.stringify({ issues, recommendations }),
          aiAnalysis: JSON.stringify(result),
        },
      }),
      prisma.shipment.update({
        where: { id: shipment.id },
        data: { complianceScore },
      }),
    ]);

    return NextResponse.json({ check, complianceScore, issues, recommendations });
  } catch {
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shipment = await prisma.shipment.findFirst({
    where: { id: params.id, userId: ctx.effectiveOwnerId },
  });
  if (!shipment) return NextResponse.json({ error: "Shipment not found" }, { status: 404 });

  const checks = await prisma.complianceCheck.findMany({
    where: { shipmentId: params.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(checks);
}