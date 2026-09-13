import { describe, it, expect } from 'vitest';
import { hasPermission } from '@/lib/rbac/assert-permission';
import type { UserRole } from '@prisma/client';

describe('RBAC Permissions - tradeupdate:publish', () => {
  it('allows OWNER and ADMIN to publish trade updates', () => {
    expect(hasPermission('OWNER' as UserRole, 'tradeupdate:publish')).toBe(true);
    expect(hasPermission('ADMIN' as UserRole, 'tradeupdate:publish')).toBe(true);
  });

  it('denies OPS_EXECUTIVE, COMPLIANCE_OFFICER, and VIEWER from publishing trade updates', () => {
    expect(hasPermission('OPS_EXECUTIVE' as UserRole, 'tradeupdate:publish')).toBe(false);
    expect(hasPermission('COMPLIANCE_OFFICER' as UserRole, 'tradeupdate:publish')).toBe(false);
    expect(hasPermission('VIEWER' as UserRole, 'tradeupdate:publish')).toBe(false);
  });
});
