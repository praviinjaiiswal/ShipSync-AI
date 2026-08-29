import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getOrgContext } from "@/lib/getOrgContext";

export async function GET() {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const members = await prisma.user.findMany({
    where: { OR: [{ id: ctx.effectiveOwnerId }, { organizationOwnerId: ctx.effectiveOwnerId }] },
    select: { id: true, name: true, email: true, role: true },
  });

  const pendingInvites = await prisma.teamInvite.findMany({
    where: { orgOwnerId: ctx.effectiveOwnerId, status: "PENDING" },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json({ members, pendingInvites, isOwnerOrAdmin: ctx.isOwner || ctx.role === "ADMIN" });
}