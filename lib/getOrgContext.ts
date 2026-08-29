import { getCurrentUser } from "./getCurrentUser";

export async function getOrgContext() {
  const user = await getCurrentUser();
  if (!user) return null;

  const effectiveOwnerId = user.organizationOwnerId ?? user.id;
  const isOwner = !user.organizationOwnerId;

  return { user, effectiveOwnerId, isOwner, role: user.role };
}

export function canModify(ctx: { user: { id: string; role: string } }, resourceUserId: string) {
  if (ctx.user.role === "ADMIN") return true;
  if (ctx.user.role === "COMPLIANCE_OFFICER") return false;
  return ctx.user.id === resourceUserId;
}