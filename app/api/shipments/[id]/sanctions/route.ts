import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { checkSanctions } from "@/lib/sanctions";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shipment = await prisma.shipment.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!shipment) return NextResponse.json({ error: "Shipment not found" }, { status: 404 });

  try {
    const matches = await checkSanctions(shipment.buyerName);

    const check = await prisma.sanctionsCheck.upsert({
      where: { shipmentId: shipment.id },
      update: { matchFound: matches.length > 0, matches, checkedAt: new Date() },
      create: {
        shipmentId: shipment.id,
        matchFound: matches.length > 0,
        matches,
      },
    });

    return NextResponse.json(check);
  } catch {
    return NextResponse.json({ error: "Sanctions check failed" }, { status: 502 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shipment = await prisma.shipment.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!shipment) return NextResponse.json({ error: "Shipment not found" }, { status: 404 });

  const check = await prisma.sanctionsCheck.findUnique({
    where: { shipmentId: params.id },
  });

  return NextResponse.json(check);
}