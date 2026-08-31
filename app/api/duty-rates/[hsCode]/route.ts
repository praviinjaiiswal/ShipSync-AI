import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getOrgContext } from "@/lib/getOrgContext";

export async function GET(req: NextRequest, { params }: { params: { hsCode: string } }) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rate = await prisma.dutyIncentiveRate.findUnique({
    where: { hsCode: params.hsCode },
  });

  return NextResponse.json(rate);
}