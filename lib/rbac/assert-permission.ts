/**
 * RBAC enforcement — single function used at the TOP of every API route handler.
 * Fail-closed: deny by default, allow only if explicitly permitted.
 */

import type { UserRole } from '@prisma/client';
import { ForbiddenError } from '@/lib/errors';
import { hasPermission, type Permission } from './permissions';

/**
 * Assert that a user with the given role has permission to perform the specified action.
 * Throws ForbiddenError if not permitted — never returns false, always throws.
 * 
 * Usage at the top of every API route:
 *   assertPermission(ctx.role, 'shipment:create');
 */
export function assertPermission(role: UserRole, action: Permission): void {
  if (!hasPermission(role, action)) {
    throw new ForbiddenError(
      `Role '${role}' does not have permission to perform '${action}'`
    );
  }
}
