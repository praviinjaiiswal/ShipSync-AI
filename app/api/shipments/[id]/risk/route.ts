import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getOrgContext } from "@/lib/getOrgContext";
import { assessRisk } from "@/lib/ai";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shipment = await prisma.shipment.findFirst({
    where: { id: params.id, userId: ctx.effectiveOwnerId },
  });
  if (!shipment) return NextResponse.json({ error: "Shipment not found" }, { status: 404 });

  try {
    const result = await assessRisk(shipment);
    const { countryRiskScore = 0, buyerRiskScore = 0, aiReport = "" } = result;

    const riskReport = await prisma.riskReport.upsert({
      where: { shipmentId: shipment.id },
      update: { countryRiskScore, buyerRiskScore, aiReport },
      create: {
        shipmentId: shipment.id,
        countryRiskScore,
        buyerRiskScore,
        aiReport,
      },
    });

    return NextResponse.json(riskReport);
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

  const riskReport = await prisma.riskReport.findUnique({
    where: { shipmentId: params.id },
  });

  return NextResponse.json(riskReport);
}