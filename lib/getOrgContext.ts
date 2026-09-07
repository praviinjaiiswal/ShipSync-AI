/**
 * @deprecated Use `requireTenantContext()` or `getTenantContext()` from `@/lib/tenant` instead.
 * This legacy helper is kept temporarily to ensure backwards compatibility.
 */

import { getTenantContext } from './tenant';

export async function getOrgContext() {
  try {
    const ctx = await getTenantContext();
    return {
      user: ctx.user,
      effectiveOwnerId: ctx.companyId || ctx.userId,
      isOwner: ctx.role === 'OWNER',
      role: ctx.role,
    };
  } catch {
    return null;
  }
}

export function canModify(ctx: { user: { id: string; role: string } }, resourceUserId: string) {
  if (ctx.user.role === 'OWNER' || ctx.user.role === 'ADMIN') return true;
  if (ctx.user.role === 'COMPLIANCE_OFFICER' || ctx.user.role === 'VIEWER') return false;
  return ctx.user.id === resourceUserId;
}