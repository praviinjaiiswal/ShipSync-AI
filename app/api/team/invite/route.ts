import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getOrgContext } from "@/lib/getOrgContext";
import { sendTeamInviteEmail } from "@/lib/email";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "EXPORTER", "COMPLIANCE_OFFICER"]),
});

export async function POST(req: NextRequest) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!ctx.isOwner && ctx.role !== "ADMIN") {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const invite = await prisma.teamInvite.create({
    data: {
      orgOwnerId: ctx.effectiveOwnerId,
      email: parsed.data.email,
      role: parsed.data.role,
    },
  });

  await sendTeamInviteEmail(parsed.data.email, ctx.user.name ?? ctx.user.email, parsed.data.role, invite.token);

  return NextResponse.json(invite, { status: 201 });
}