import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getOrgContext, canModify } from "@/lib/getOrgContext";
import { shipmentSchema } from "@/lib/validations";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shipment = await prisma.shipment.findFirst({
    where: { id: params.id, userId: ctx.effectiveOwnerId },
    include: { documents: true, complianceChecks: true, riskReport: true },
  });

  if (!shipment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(shipment);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.shipment.findFirst({
    where: { id: params.id, userId: ctx.effectiveOwnerId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!canModify(ctx, existing.userId === ctx.effectiveOwnerId ? ctx.user.id : existing.userId)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = shipmentSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const shipment = await prisma.shipment.update({
    where: { id: params.id },
    data: parsed.data,
  });

  await prisma.activity.create({
    data: {
      userId: ctx.user.id,
      shipmentId: shipment.id,
      action: "SHIPMENT_UPDATED",
      details: `Updated shipment for ${shipment.buyerName}`,
    },
  });

  return NextResponse.json(shipment);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.shipment.findFirst({
    where: { id: params.id, userId: ctx.effectiveOwnerId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (ctx.role === "COMPLIANCE_OFFICER") {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  await prisma.activity.create({
    data: {
      userId: ctx.user.id,
      shipmentId: existing.id,
      action: "SHIPMENT_DELETED",
      details: `Deleted shipment for ${existing.buyerName}`,
    },
  });

  await prisma.shipment.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}