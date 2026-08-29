import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getOrgContext } from "@/lib/getOrgContext";
import { uploadFile } from "@/lib/storage";

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB — Vercel serverless request body limit

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shipment = await prisma.shipment.findFirst({
    where: { id: params.id, userId: ctx.effectiveOwnerId },
  });
  if (!shipment) return NextResponse.json({ error: "Shipment not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const docType = formData.get("docType") as string | null;

  if (!file || !docType) {
    return NextResponse.json({ error: "file and docType required" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File 4MB se bada nahi ho sakta" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `${shipment.id}/${Date.now()}-${file.name}`;
    const fileUrl = await uploadFile(buffer, key, file.type);

    const document = await prisma.document.create({
      data: {
        shipmentId: shipment.id,
        docType: docType as any,
        fileUrl,
        status: "UPLOADED",
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 502 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shipment = await prisma.shipment.findFirst({
    where: { id: params.id, userId: ctx.effectiveOwnerId },
  });
  if (!shipment) return NextResponse.json({ error: "Shipment not found" }, { status: 404 });

  const documents = await prisma.document.findMany({
    where: { shipmentId: params.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}