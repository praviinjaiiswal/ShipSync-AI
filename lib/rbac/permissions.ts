/**
 * RBAC Permission Matrix — Single source of truth for all access control.
 * 
 * Every action in the system maps to a list of roles that are allowed to perform it.
 * This is a DENY-by-default system: if a role isn't explicitly listed, it's denied.
 */

import type { UserRole } from '@prisma/client';

/** All possible actions in the system */
export type Permission =
  // Shipments
  | 'shipment:create'
  | 'shipment:read'
  | 'shipment:update'
  | 'shipment:delete'
  // Compliance, Risk, Sanctions
  | 'compliance:run'
  | 'compliance:read'
  | 'risk:assess'
  | 'risk:read'
  | 'sanctions:check'
  | 'sanctions:read'
  // Documents
  | 'document:create'
  | 'document:read'
  | 'document:upload'
  // Licenses
  | 'license:create'
  | 'license:read'
  | 'license:update'
  | 'license:delete'
  // Team / Users
  | 'user:invite'
  | 'user:manage'
  | 'user:read'
  | 'user:deactivate'
  | 'team:read'
  | 'team:invite'
  | 'team:update_role'
  | 'team:remove_member'
  // Billing
  | 'billing:manage'
  // Company
  | 'company:update'
  | 'company:delete'
  // Duty Rates / Reference Data
  | 'duty-rate:manage'
  | 'duty-rate:read'
  | 'duty_rate:import'
  | 'duty_rate:read'
  | 'tariff_schedule:import'
  | 'tariff_schedule:read'
  // AI features
  | 'ai:use'
  // Activity / Analytics
  | 'activity:read'
  | 'analytics:read'
  // Import Module (Chunk 1)
  | 'import_shipment:create'
  | 'import_shipment:read'
  | 'import_shipment:update'
  | 'import_shipment:delete'
  | 'import_shipment:amend'
  | 'boe:generate'
  | 'duty:calculate'
  | 'import_duty_rate:manage'
  | 'import_duty_rate:read'
  | 'restricted_item:check'
  | 'restricted_item:manage'
  // Customs & Government Integrations (Chunk 2)
  | 'customs:file'
  | 'customs:status_check'
  | 'customs:manual_override'
  | 'customs:credentials_manage'
  | 'customs:credentials_read'
  | 'customs:logs_read'
  | 'esanchit:upload'
  // Export Module & Shipping Bill (Chunk 4)
  | 'shipping_bill:generate'
  | 'export_shipment:amend'
  | 'leo:issue'
  | 'egm:file'
  | 'incentive:calculate'
  // Physical Logistics Coordination (Chunk 5)
  | 'logistics:record'
  | 'logistics:read'
  | 'transporter:book'
  | 'transporter:update'
  | 'transporter:read'
  // Financial Closure Loop (Chunk 6)
  | 'export_realisation:create'
  | 'export_realisation:confirm'
  | 'export_realisation:read'
  | 'duty_payment:record'
  | 'duty_payment:confirm'
  | 'duty_payment:read'
  | 'incentive_claim:create'
  | 'incentive_claim:file'
  | 'incentive_claim:sanction'
  | 'incentive_claim:read'
  | 'financial_audit:read'
  // Trade Intelligence Feed
  | 'tradeupdate:review'
  | 'tradeupdate:publish';

/**
 * Permission matrix: action → allowed roles.
 */
const PERMISSION_MATRIX: Record<Permission, UserRole[]> = {
  // Shipments
  'shipment:create':   ['OWNER', 'ADMIN', 'OPS_EXECUTIVE'],
  'shipment:read':     ['OWNER', 'ADMIN', 'OPS_EXECUTIVE', 'COMPLIANCE_OFFICER', 'VIEWER'],
  'shipment:update':   ['OWNER', 'ADMIN', 'OPS_EXECUTIVE'],
  'shipment:delete':   ['OWNER', 'ADMIN'],

  // Compliance, Risk, Sanctions
  'compliance:run':    ['OWNER', 'ADMIN', 'COMPLIANCE_OFFICER'],
  'compliance:read':   ['OWNER', 'ADMIN', 'COMPLIANCE_OFFICER', 'OPS_EXECUTIVE', 'VIEWER'],
  'risk:assess':       ['OWNER', 'ADMIN', 'COMPLIANCE_OFFICER'],
  'risk:read':         ['OWNER', 'ADMIN', 'COMPLIANCE_OFFICER', 'OPS_EXECUTIVE', 'VIEWER'],
  'sanctions:check':   ['OWNER', 'ADMIN', 'COMPLIANCE_OFFICER'],
  'sanctions:read':    ['OWNER', 'ADMIN', 'COMPLIANCE_OFFICER', 'OPS_EXECUTIVE', 'VIEWER'],

  // Documents
  'document:create':   ['OWNER', 'ADMIN', 'OPS_EXECUTIVE'],
  'document:read':     ['OWNER', 'ADMIN', 'OPS_EXECUTIVE', 'COMPLIANCE_OFFICER', 'VIEWER'],
  'document:upload':   ['OWNER', 'ADMIN', 'OPS_EXECUTIVE'],

  // Licenses
  'license:create':    ['OWNER', 'ADMIN', 'OPS_EXECUTIVE'],
  'license:read':      ['OWNER', 'ADMIN', 'OPS_EXECUTIVE', 'COMPLIANCE_OFFICER', 'VIEWER'],
  'license:update':    ['OWNER', 'ADMIN', 'OPS_EXECUTIVE'],
  'license:delete':    ['OWNER', 'ADMIN'],

  // Team / Users
  'user:invite':       ['OWNER', 'ADMIN'],
  'user:manage':       ['OWNER', 'ADMIN'],
  'user:read':         ['OWNER', 'ADMIN', 'COMPLIANCE_OFFICER', 'OPS_EXECUTIVE', 'VIEWER'],
  'user:deactivate':   ['OWNER', 'ADMIN'],
  'team:read':         ['OWNER', 'ADMIN', 'COMPLIANCE_OFFICER', 'OPS_EXECUTIVE', 'VIEWER'],
  'team:invite':       ['OWNER', 'ADMIN'],
  'team:update_role':  ['OWNER', 'ADMIN'],
  'team:remove_member':['OWNER', 'ADMIN'],

  // Billing
  'billing:manage':    ['OWNER'],

  // Company
  'company:update':    ['OWNER', 'ADMIN'],
  'company:delete':    ['OWNER'],

  // Duty Rates / Reference Data
  'duty-rate:manage':  ['OWNER', 'ADMIN'],
  'duty-rate:read':    ['OWNER', 'ADMIN', 'OPS_EXECUTIVE', 'COMPLIANCE_OFFICER', 'VIEWER'],
  'duty_rate:import':  ['OWNER', 'ADMIN'],
  'duty_rate:read':    ['OWNER', 'ADMIN', 'OPS_EXECUTIVE', 'COMPLIANCE_OFFICER', 'VIEWER'],
  'tariff_schedule:import': ['OWNER', 'ADMIN'],
  'tariff_schedule:read':   ['OWNER', 'ADMIN', 'OPS_EXECUTIVE', 'COMPLIANCE_OFFICER', 'VIEWER'],

  // AI features
  'ai:use':            ['OWNER', 'ADMIN', 'OPS_EXECUTIVE', 'COMPLIANCE_OFFICER'],

  // Activity / Analytics
  'activity:read':     ['OWNER', 'ADMIN', 'OPS_EXECUTIVE', 'COMPLIANCE_OFFICER', 'VIEWER'],
  'analytics:read':    ['OWNER', 'ADMIN', 'OPS_EXECUTIVE', 'COMPLIANCE_OFFICER', 'VIEWER'],

  // Import Module (Chunk 1)
  'import_shipment:create':   ['OWNER', 'ADMIN', 'OPS_EXECUTIVE'],
  'import_shipment:read':     ['OWNER', 'ADMIN', 'OPS_EXECUTIVE', 'COMPLIANCE_OFFICER', 'VIEWER'],
  'import_shipment:update':   ['OWNER', 'ADMIN', 'OPS_EXECUTIVE'],
  'import_shipment:delete':   ['OWNER', 'ADMIN'],
  'import_shipment:amend':    ['OWNER', 'ADMIN', 'OPS_EXECUTIVE'],
  'boe:generate':             ['OWNER', 'ADMIN', 'OPS_EXECUTIVE'],
  'duty:calculate':           ['OWNER', 'ADMIN', 'OPS_EXECUTIVE', 'COMPLIANCE_OFFICER', 'VIEWER'],
  'import_duty_rate:manage':  ['OWNER', 'ADMIN'],
  'import_duty_rate:read':    ['OWNER', 'ADMIN', 'OPS_EXECUTIVE', 'COMPLIANCE_OFFICER', 'VIEWER'],
  'restricted_item:check':    ['OWNER', 'ADMIN', 'OPS_EXECUTIVE', 'COMPLIANCE_OFFICER', 'VIEWER'],
  'restricted_item:manage':   ['OWNER', 'ADMIN'],

  // Customs & Government Integrations (Chunk 2)
  'customs:file':               ['OWNER', 'ADMIN', 'OPS_EXECUTIVE'],
  'customs:status_check':       ['OWNER', 'ADMIN', 'OPS_EXECUTIVE', 'COMPLIANCE_OFFICER', 'VIEWER'],
  'customs:manual_override':    ['OWNER', 'ADMIN'],
  'customs:credentials_manage': ['OWNER', 'ADMIN'],
  'customs:credentials_read':   ['OWNER', 'ADMIN'],
  'customs:logs_read':          ['OWNER', 'ADMIN', 'OPS_EXECUTIVE', 'COMPLIANCE_OFFICER', 'VIEWER'],
  'esanchit:upload':            ['OWNER', 'ADMIN', 'OPS_EXECUTIVE'],

  // Export Module & Shipping Bill (Chunk 4)
  'shipping_bill:generate':     ['OWNER', 'ADMIN', 'OPS_EXECUTIVE'],
  'export_shipment:amend':      ['OWNER', 'ADMIN', 'OPS_EXECUTIVE'],
  'leo:issue':                  ['OWNER', 'ADMIN', 'COMPLIANCE_OFFICER'],
  'egm:file':                   ['OWNER', 'ADMIN', 'OPS_EXECUTIVE'],
  'incentive:calculate':        ['OWNER', 'ADMIN', 'OPS_EXECUTIVE', 'COMPLIANCE_OFFICER', 'VIEWER'],
  // Physical Logistics Coordination (Chunk 5)
  'logistics:record':           ['OWNER', 'ADMIN', 'OPS_EXECUTIVE'],
  'logistics:read':             ['OWNER', 'ADMIN', 'OPS_EXECUTIVE', 'COMPLIANCE_OFFICER', 'VIEWER'],
  'transporter:book':           ['OWNER', 'ADMIN', 'OPS_EXECUTIVE'],
  'transporter:update':         ['OWNER', 'ADMIN', 'OPS_EXECUTIVE'],
  'transporter:read':           ['OWNER', 'ADMIN', 'OPS_EXECUTIVE', 'COMPLIANCE_OFFICER', 'VIEWER'],
  // Financial Closure Loop (Chunk 6)
  // OPS_EXECUTIVE can upload/initiate, but ONLY OWNER/ADMIN can confirm/approve!
  'export_realisation:create':  ['OWNER', 'ADMIN', 'OPS_EXECUTIVE'],
  'export_realisation:confirm': ['OWNER', 'ADMIN'],
  'export_realisation:read':    ['OWNER', 'ADMIN', 'OPS_EXECUTIVE', 'COMPLIANCE_OFFICER', 'VIEWER'],
  'duty_payment:record':        ['OWNER', 'ADMIN', 'OPS_EXECUTIVE'],
  'duty_payment:confirm':       ['OWNER', 'ADMIN'],
  'duty_payment:read':          ['OWNER', 'ADMIN', 'OPS_EXECUTIVE', 'COMPLIANCE_OFFICER', 'VIEWER'],
  'incentive_claim:create':     ['OWNER', 'ADMIN', 'OPS_EXECUTIVE'],
  'incentive_claim:file':       ['OWNER', 'ADMIN', 'OPS_EXECUTIVE'],
  'incentive_claim:sanction':   ['OWNER', 'ADMIN'],
  'incentive_claim:read':       ['OWNER', 'ADMIN', 'OPS_EXECUTIVE', 'COMPLIANCE_OFFICER', 'VIEWER'],
  'financial_audit:read':       ['OWNER', 'ADMIN', 'OPS_EXECUTIVE', 'COMPLIANCE_OFFICER', 'VIEWER'],

  // Trade Intelligence Feed (ADMIN / OWNER only)
  'tradeupdate:review':         ['OWNER', 'ADMIN'],
  'tradeupdate:publish':        ['OWNER', 'ADMIN'],
};

/**
 * Check whether a role has a specific permission.
 * Returns true only if the role is explicitly listed — deny by default.
 */
export function hasPermission(role: UserRole, action: Permission): boolean {
  const allowedRoles = PERMISSION_MATRIX[action];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}

/**
 * Get all permissions for a given role.
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return (Object.entries(PERMISSION_MATRIX) as [Permission, UserRole[]][])
    .filter(([, roles]) => roles.includes(role))
    .map(([action]) => action);
}

export { assertPermission } from './assert-permission';

