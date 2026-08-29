import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getOrgContext } from "@/lib/getOrgContext";
import { licenseSchema } from "@/lib/validations";

export async function GET() {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const licenses = await prisma.license.findMany({
    where: { userId: ctx.effectiveOwnerId },
    orderBy: { expiryDate: "asc" },
  });

  return NextResponse.json(licenses);
}

export async function POST(req: NextRequest) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = licenseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const license = await prisma.license.create({
    data: {
      userId: ctx.effectiveOwnerId,
      type: parsed.data.type,
      name: parsed.data.name,
      licenseNumber: parsed.data.licenseNumber || null,
      issueDate: parsed.data.issueDate ? new Date(parsed.data.issueDate) : null,
      expiryDate: new Date(parsed.data.expiryDate),
    },
  });

  return NextResponse.json(license, { status: 201 });
}