import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { licenseSchema } from "@/lib/validations";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const licenses = await prisma.license.findMany({
    where: { userId: user.id },
    orderBy: { expiryDate: "asc" },
  });

  return NextResponse.json(licenses);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = licenseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const license = await prisma.license.create({
    data: {
      userId: user.id,
      type: parsed.data.type,
      name: parsed.data.name,
      licenseNumber: parsed.data.licenseNumber || null,
      issueDate: parsed.data.issueDate ? new Date(parsed.data.issueDate) : null,
      expiryDate: new Date(parsed.data.expiryDate),
    },
  });

  return NextResponse.json(license, { status: 201 });
}