import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getOrgContext } from "@/lib/getOrgContext";

export async function POST(req: NextRequest) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!ctx.isOwner && ctx.role !== "ADMIN") {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "CSV file required" }, { status: 400 });

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    return NextResponse.json({ error: "CSV khaali hai ya header missing hai" }, { status: 400 });
  }

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const hsCodeIdx = header.indexOf("hs_code");
  const descIdx = header.indexOf("description");
  const rodtepIdx = header.indexOf("rodtep_rate");
  const capIdx = header.indexOf("rodtep_cap");
  const drawbackIdx = header.indexOf("duty_drawback_rate");

  if (hsCodeIdx === -1) {
    return NextResponse.json(
      { error: "CSV me 'hs_code' column hona zaroori hai. Expected columns: hs_code, description, rodtep_rate, rodtep_cap, duty_drawback_rate" },
      { status: 400 }
    );
  }

  let imported = 0;
  const rows = lines.slice(1);

  for (const line of rows) {
    const cols = line.split(",").map((c) => c.trim());
    const hsCode = cols[hsCodeIdx];
    if (!hsCode) continue;

    await prisma.dutyIncentiveRate.upsert({
      where: { hsCode },
      update: {
        description: descIdx > -1 ? cols[descIdx] : undefined,
        rodtepRate: rodtepIdx > -1 && cols[rodtepIdx] ? parseFloat(cols[rodtepIdx]) : undefined,
        rodtepCapPerUnit: capIdx > -1 && cols[capIdx] ? parseFloat(cols[capIdx]) : undefined,
        dutyDrawbackRate: drawbackIdx > -1 && cols[drawbackIdx] ? parseFloat(cols[drawbackIdx]) : undefined,
        source: "DGFT_IMPORT",
      },
      create: {
        hsCode,
        description: descIdx > -1 ? cols[descIdx] : null,
        rodtepRate: rodtepIdx > -1 && cols[rodtepIdx] ? parseFloat(cols[rodtepIdx]) : null,
        rodtepCapPerUnit: capIdx > -1 && cols[capIdx] ? parseFloat(cols[capIdx]) : null,
        dutyDrawbackRate: drawbackIdx > -1 && cols[drawbackIdx] ? parseFloat(cols[drawbackIdx]) : null,
        source: "DGFT_IMPORT",
      },
    });
    imported++;
  }

  return NextResponse.json({ success: true, imported });
}