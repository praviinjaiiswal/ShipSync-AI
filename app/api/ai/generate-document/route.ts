import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { generateDocument } from "@/lib/ai";
import { getCached, setCached } from "@/lib/cache";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shipmentId, docType } = await req.json();
  if (!shipmentId || !docType) {
    return NextResponse.json({ error: "shipmentId and docType required" }, { status: 400 });
  }

  const shipment = await prisma.shipment.findFirst({
    where: { id: shipmentId, userId: user.id },
  });
  if (!shipment) return NextResponse.json({ error: "Shipment not found" }, { status: 404 });

  const cacheKey = `doc:${shipmentId}:${docType}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const result = await generateDocument(docType, shipment);
    setCached(cacheKey, result);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }
}