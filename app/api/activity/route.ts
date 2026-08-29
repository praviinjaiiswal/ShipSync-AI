import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getOrgContext } from "@/lib/getOrgContext";

export async function GET() {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgMembers = await prisma.user.findMany({
    where: { OR: [{ id: ctx.effectiveOwnerId }, { organizationOwnerId: ctx.effectiveOwnerId }] },
    select: { id: true },
  });
  const memberIds = orgMembers.map((m) => m.id);

  const activities = await prisma.activity.findMany({
    where: { userId: { in: memberIds } },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(activities);
}