import { PrismaClient } from '@prisma/client';
import { getCurrentTenant } from '@/lib/tenant-context';
import { ForbiddenError } from '@/lib/errors';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const basePrisma = globalForPrisma.prisma ?? new PrismaClient();

const TENANT_MODELS = new Set([
  'Shipment',
  'Document',
  'ComplianceCheck',
  'RiskReport',
  'SanctionsCheck',
  'License',
  'TeamInvite',
  'Activity',
  'Subscription',
  'ImportShipment',
  'BillOfEntry',
  'ImportAmendment',
  'CustomsCredential',
  'CustomsFilingJob',
  'IntegrationLog',
  'CustomsOverrideAudit',
  'ShippingBill',
  'ExportAmendment',
  'LogisticsEvent',
  'TransporterBooking',
  'ExportRealisation',
  'DutyPayment',
  'IncentiveClaim',
  'FinancialAuditLog',
]);

// Prisma middleware for automatic tenant isolation
basePrisma.$use(async (params, next) => {
  if (params.model && TENANT_MODELS.has(params.model)) {
    const tenantCompanyId = getCurrentTenant();

    if (tenantCompanyId) {
      // For read/update/delete operations: enforce companyId filter
      if (['findFirst', 'findMany', 'count', 'update', 'delete', 'updateMany', 'deleteMany'].includes(params.action)) {
        params.args = params.args || {};
        params.args.where = params.args.where || {};

        if (!params.args.where.companyId) {
          params.args.where.companyId = tenantCompanyId;
        } else if (
          typeof params.args.where.companyId === 'string' &&
          params.args.where.companyId !== tenantCompanyId
        ) {
          // Explicit attempt to query across tenant boundaries while inside tenant context
          throw new ForbiddenError('Cross-tenant data access violation');
        }
      }

      // For creation operations: ensure companyId is set to tenant
      if (['create'].includes(params.action)) {
        params.args = params.args || {};
        params.args.data = params.args.data || {};
        if (!params.args.data.companyId) {
          params.args.data.companyId = tenantCompanyId;
        } else if (params.args.data.companyId !== tenantCompanyId) {
          throw new ForbiddenError('Cross-tenant creation violation');
        }
      }
    }
  }

  return next(params);
});

export const prisma = basePrisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;