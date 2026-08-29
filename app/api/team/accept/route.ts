import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/lib/getCurrentUser";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const invite = await prisma.teamInvite.findUnique({ where: { token } });

  if (!invite || invite.status !== "PENDING") {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });
  }

  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({ error: "Ye invite tumhare email ke liye nahi hai" }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { organizationOwnerId: invite.orgOwnerId, role: invite.role },
    }),
    prisma.teamInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED" },
    }),
  ]);

  return NextResponse.json({ success: true });
}