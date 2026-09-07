/**
 * Tenant Context — resolves { userId, companyId, role, user, tenantDb } from the Clerk session.
 * 
 * This is the ONLY way to get tenant context in any API route.
 * NEVER trust companyId from request body/query params — always derive server-side.
 */

import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/app/lib/prisma';
import { AuthError } from '@/lib/errors';
import { setCurrentTenant } from '@/lib/tenant-context';
import type { User, UserRole, Prisma } from '@prisma/client';

export interface TenantContext {
  userId: string;
  companyId: string;
  role: UserRole;
  user: User;
}

/**
 * Repository pattern wrapper for tenant-scoped operations.
 * Explicitly injects companyId into all database calls.
 */
export function createTenantDb(companyId: string) {
  return {
    shipment: {
      findMany: (args?: Prisma.ShipmentFindManyArgs) =>
        prisma.shipment.findMany({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      findFirst: (args?: Prisma.ShipmentFindFirstArgs) =>
        prisma.shipment.findFirst({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      create: (args: Prisma.ShipmentCreateArgs) =>
        prisma.shipment.create({
          ...args,
          data: { ...(args.data as any), companyId },
        }),
      update: (args: Prisma.ShipmentUpdateArgs) =>
        prisma.shipment.update({
          ...args,
          where: { ...(args.where as any), companyId },
        }),
      delete: (args: Prisma.ShipmentDeleteArgs) =>
        prisma.shipment.delete({
          ...args,
          where: { ...(args.where as any), companyId },
        }),
      count: (args?: Prisma.ShipmentCountArgs) =>
        prisma.shipment.count({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
    },
    importShipment: {
      findMany: (args?: Prisma.ImportShipmentFindManyArgs) =>
        prisma.importShipment.findMany({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      findFirst: (args?: Prisma.ImportShipmentFindFirstArgs) =>
        prisma.importShipment.findFirst({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      create: (args: Prisma.ImportShipmentCreateArgs) =>
        prisma.importShipment.create({
          ...args,
          data: { ...(args.data as any), companyId },
        }),
      update: (args: Prisma.ImportShipmentUpdateArgs) =>
        prisma.importShipment.update({
          ...args,
          where: { ...(args.where as any), companyId },
        }),
      delete: (args: Prisma.ImportShipmentDeleteArgs) =>
        prisma.importShipment.delete({
          ...args,
          where: { ...(args.where as any), companyId },
        }),
      count: (args?: Prisma.ImportShipmentCountArgs) =>
        prisma.importShipment.count({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
    },
    billOfEntry: {
      findMany: (args?: Prisma.BillOfEntryFindManyArgs) =>
        prisma.billOfEntry.findMany({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      findFirst: (args?: Prisma.BillOfEntryFindFirstArgs) =>
        prisma.billOfEntry.findFirst({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      create: (args: Prisma.BillOfEntryCreateArgs) =>
        prisma.billOfEntry.create({
          ...args,
          data: { ...(args.data as any), companyId },
        }),
      update: (args: Prisma.BillOfEntryUpdateArgs) =>
        prisma.billOfEntry.update({
          ...args,
          where: { ...(args.where as any), companyId },
        }),
    },
    document: {
      findMany: (args?: Prisma.DocumentFindManyArgs) =>
        prisma.document.findMany({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      findFirst: (args?: Prisma.DocumentFindFirstArgs) =>
        prisma.document.findFirst({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      create: (args: Prisma.DocumentCreateArgs) =>
        prisma.document.create({
          ...args,
          data: { ...(args.data as any), companyId },
        }),
      delete: (args: Prisma.DocumentDeleteArgs) =>
        prisma.document.delete({
          ...args,
          where: { ...(args.where as any), companyId },
        }),
    },
    license: {
      findMany: (args?: Prisma.LicenseFindManyArgs) =>
        prisma.license.findMany({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      findFirst: (args?: Prisma.LicenseFindFirstArgs) =>
        prisma.license.findFirst({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      create: (args: Prisma.LicenseCreateArgs) =>
        prisma.license.create({
          ...args,
          data: { ...(args.data as any), companyId },
        }),
      update: (args: Prisma.LicenseUpdateArgs) =>
        prisma.license.update({
          ...args,
          where: { ...(args.where as any), companyId },
        }),
      delete: (args: Prisma.LicenseDeleteArgs) =>
        prisma.license.delete({
          ...args,
          where: { ...(args.where as any), companyId },
        }),
    },
    teamInvite: {
      findMany: (args?: Prisma.TeamInviteFindManyArgs) =>
        prisma.teamInvite.findMany({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      create: (args: Prisma.TeamInviteCreateArgs) =>
        prisma.teamInvite.create({
          ...args,
          data: { ...(args.data as any), companyId },
        }),
    },
    user: {
      findMany: (args?: Prisma.UserFindManyArgs) =>
        prisma.user.findMany({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      findFirst: (args?: Prisma.UserFindFirstArgs) =>
        prisma.user.findFirst({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
    },
    customsCredential: {
      findMany: (args?: Prisma.CustomsCredentialFindManyArgs) =>
        prisma.customsCredential.findMany({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      findFirst: (args?: Prisma.CustomsCredentialFindFirstArgs) =>
        prisma.customsCredential.findFirst({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      create: (args: any) =>
        prisma.customsCredential.create({
          ...args,
          data: { ...(args.data as any), companyId },
        }),
      update: (args: Prisma.CustomsCredentialUpdateArgs) =>
        prisma.customsCredential.update({
          ...args,
          where: { ...(args.where as any), companyId },
        }),
      delete: (args: Prisma.CustomsCredentialDeleteArgs) =>
        prisma.customsCredential.delete({
          ...args,
          where: { ...(args.where as any), companyId },
        }),
    },
    customsFilingJob: {
      findMany: (args?: Prisma.CustomsFilingJobFindManyArgs) =>
        prisma.customsFilingJob.findMany({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      findFirst: (args?: Prisma.CustomsFilingJobFindFirstArgs) =>
        prisma.customsFilingJob.findFirst({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      create: (args: any) =>
        prisma.customsFilingJob.create({
          ...args,
          data: { ...(args.data as any), companyId },
        }),
      update: (args: Prisma.CustomsFilingJobUpdateArgs) =>
        prisma.customsFilingJob.update({
          ...args,
          where: { ...(args.where as any), companyId },
        }),
    },
    integrationLog: {
      findMany: (args?: Prisma.IntegrationLogFindManyArgs) =>
        prisma.integrationLog.findMany({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      create: (args: any) =>
        prisma.integrationLog.create({
          ...args,
          data: { ...(args.data as any), companyId },
        }),
    },
    customsOverrideAudit: {
      findMany: (args?: Prisma.CustomsOverrideAuditFindManyArgs) =>
        prisma.customsOverrideAudit.findMany({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      create: (args: any) =>
        prisma.customsOverrideAudit.create({
          ...args,
          data: { ...(args.data as any), companyId },
        }),
    },
    shippingBill: {
      findMany: (args?: Prisma.ShippingBillFindManyArgs) =>
        prisma.shippingBill.findMany({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      findFirst: (args?: Prisma.ShippingBillFindFirstArgs) =>
        prisma.shippingBill.findFirst({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      create: (args: any) =>
        prisma.shippingBill.create({
          ...args,
          data: { ...(args.data as any), companyId },
        }),
      update: (args: Prisma.ShippingBillUpdateArgs) =>
        prisma.shippingBill.update({
          ...args,
          where: { ...(args.where as any), companyId },
        }),
      delete: (args: Prisma.ShippingBillDeleteArgs) =>
        prisma.shippingBill.delete({
          ...args,
          where: { ...(args.where as any), companyId },
        }),
    },
    exportAmendment: {
      findMany: (args?: Prisma.ExportAmendmentFindManyArgs) =>
        prisma.exportAmendment.findMany({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      create: (args: any) =>
        prisma.exportAmendment.create({
          ...args,
          data: { ...(args.data as any), companyId },
        }),
    },
    logisticsEvent: {
      findMany: (args?: Prisma.LogisticsEventFindManyArgs) =>
        prisma.logisticsEvent.findMany({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      findFirst: (args?: Prisma.LogisticsEventFindFirstArgs) =>
        prisma.logisticsEvent.findFirst({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      create: (args: any) =>
        prisma.logisticsEvent.create({
          ...args,
          data: { ...(args.data as any), companyId },
        }),
      delete: (args: Prisma.LogisticsEventDeleteArgs) =>
        prisma.logisticsEvent.delete({
          ...args,
          where: { ...(args.where as any), companyId },
        }),
    },
    transporterBooking: {
      findMany: (args?: Prisma.TransporterBookingFindManyArgs) =>
        prisma.transporterBooking.findMany({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      findFirst: (args?: Prisma.TransporterBookingFindFirstArgs) =>
        prisma.transporterBooking.findFirst({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      create: (args: any) =>
        prisma.transporterBooking.create({
          ...args,
          data: { ...(args.data as any), companyId },
        }),
      update: (args: Prisma.TransporterBookingUpdateArgs) =>
        prisma.transporterBooking.update({
          ...args,
          where: { ...(args.where as any), companyId },
        }),
      delete: (args: Prisma.TransporterBookingDeleteArgs) =>
        prisma.transporterBooking.delete({
          ...args,
          where: { ...(args.where as any), companyId },
        }),
    },
    exportRealisation: {
      findMany: (args?: Prisma.ExportRealisationFindManyArgs) =>
        prisma.exportRealisation.findMany({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      findFirst: (args?: Prisma.ExportRealisationFindFirstArgs) =>
        prisma.exportRealisation.findFirst({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      create: (args: any) =>
        prisma.exportRealisation.create({
          ...args,
          data: { ...(args.data as any), companyId },
        }),
      update: (args: Prisma.ExportRealisationUpdateArgs) =>
        prisma.exportRealisation.update({
          ...args,
          where: { ...(args.where as any), companyId },
        }),
      delete: (args: Prisma.ExportRealisationDeleteArgs) =>
        prisma.exportRealisation.delete({
          ...args,
          where: { ...(args.where as any), companyId },
        }),
    },
    dutyPayment: {
      findMany: (args?: Prisma.DutyPaymentFindManyArgs) =>
        prisma.dutyPayment.findMany({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      findFirst: (args?: Prisma.DutyPaymentFindFirstArgs) =>
        prisma.dutyPayment.findFirst({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      create: (args: any) =>
        prisma.dutyPayment.create({
          ...args,
          data: { ...(args.data as any), companyId },
        }),
      update: (args: Prisma.DutyPaymentUpdateArgs) =>
        prisma.dutyPayment.update({
          ...args,
          where: { ...(args.where as any), companyId },
        }),
      delete: (args: Prisma.DutyPaymentDeleteArgs) =>
        prisma.dutyPayment.delete({
          ...args,
          where: { ...(args.where as any), companyId },
        }),
    },
    incentiveClaim: {
      findMany: (args?: Prisma.IncentiveClaimFindManyArgs) =>
        prisma.incentiveClaim.findMany({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      findFirst: (args?: Prisma.IncentiveClaimFindFirstArgs) =>
        prisma.incentiveClaim.findFirst({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      create: (args: any) =>
        prisma.incentiveClaim.create({
          ...args,
          data: { ...(args.data as any), companyId },
        }),
      update: (args: Prisma.IncentiveClaimUpdateArgs) =>
        prisma.incentiveClaim.update({
          ...args,
          where: { ...(args.where as any), companyId },
        }),
      delete: (args: Prisma.IncentiveClaimDeleteArgs) =>
        prisma.incentiveClaim.delete({
          ...args,
          where: { ...(args.where as any), companyId },
        }),
    },
    financialAuditLog: {
      findMany: (args?: Prisma.FinancialAuditLogFindManyArgs) =>
        prisma.financialAuditLog.findMany({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      findFirst: (args?: Prisma.FinancialAuditLogFindFirstArgs) =>
        prisma.financialAuditLog.findFirst({
          ...(args || {}),
          where: { ...(args?.where || {}), companyId } as any,
        }),
      create: (args: any) =>
        prisma.financialAuditLog.create({
          ...args,
          data: { ...(args.data as any), companyId },
        }),
    },
  };
}

export type TenantDb = ReturnType<typeof createTenantDb>;

/**
 * Get tenant context from the authenticated Clerk session.
 * Throws AuthError if not authenticated or user not found in DB.
 * 
 * NOTE: This does NOT throw if companyId is null — the onboarding flow
 * needs to call this before company is set. Use `requireTenantContext()` 
 * for routes that MUST have a company.
 */
export async function getTenantContext(): Promise<TenantContext> {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new AuthError('Authentication required');
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? '';

  // Upsert to handle first-time Clerk users who don't have a DB record yet
  const user = await prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    update: { email, name: clerkUser.fullName ?? undefined },
    create: {
      clerkId: clerkUser.id,
      email,
      name: clerkUser.fullName ?? undefined,
    },
  });

  if (!user.isActive) {
    throw new AuthError('Account has been deactivated');
  }

  if (!user.companyId) {
    // Return partial context for onboarding — companyId is empty string
    return {
      userId: user.id,
      companyId: '',
      role: user.role,
      user,
    };
  }

  return {
    userId: user.id,
    companyId: user.companyId,
    role: user.role,
    user,
  };
}

/**
 * Get tenant context, but REQUIRE that companyId is set (onboarding complete).
 * Use this for all standard API routes that operate on company-scoped data.
 * Also activates the tenant context for Prisma middleware and provides `tenantDb`.
 */
export async function requireTenantContext(): Promise<TenantContext & { companyId: string; tenantDb: TenantDb }> {
  const ctx = await getTenantContext();
  if (!ctx.companyId) {
    throw new AuthError('Onboarding not complete — company not set');
  }

  // Activate tenant context in AsyncLocalStorage for Prisma middleware
  setCurrentTenant(ctx.companyId);

  return {
    ...ctx,
    companyId: ctx.companyId,
    tenantDb: createTenantDb(ctx.companyId),
  };
}
