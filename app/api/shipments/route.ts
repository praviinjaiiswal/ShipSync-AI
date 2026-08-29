import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getOrgContext } from "@/lib/getOrgContext";
import { shipmentSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "10"));
  const search = searchParams.get("search")?.trim() ?? "";
  const status = searchParams.get("status") ?? "";

  const where = {
    userId: ctx.effectiveOwnerId,
    ...(search && {
      OR: [
        { buyerName: { contains: search, mode: "insensitive" as const } },
        { productDesc: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(status && { status: status as any }),
  };

  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.shipment.count({ where }),
  ]);

  return NextResponse.json({
    shipments,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = shipmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const shipment = await prisma.shipment.create({
    data: {
      ...parsed.data,
      buyerEmail: parsed.data.buyerEmail || null,
      userId: ctx.effectiveOwnerId,
    },
  });

  await prisma.activity.create({
    data: {
      userId: ctx.user.id,
      shipmentId: shipment.id,
      action: "SHIPMENT_CREATED",
      details: `Created shipment for ${shipment.buyerName}`,
    },
  });

  return NextResponse.json(shipment, { status: 201 });
}