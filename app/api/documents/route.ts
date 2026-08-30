import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getOrgContext } from "@/lib/getOrgContext";

export async function GET() {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const documents = await prisma.document.findMany({
    where: { shipment: { userId: ctx.effectiveOwnerId } },
    include: { shipment: { select: { id: true, buyerName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}