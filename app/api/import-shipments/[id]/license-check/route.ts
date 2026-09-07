import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { NotFoundError } from '@/lib/errors';

export const POST = withErrorHandler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'restricted_item:check');

  const shipment = await prisma.importShipment.findFirst({
    where: {
      id: params.id,
      companyId: ctx.companyId,
    },
  });

  if (!shipment) {
    throw new NotFoundError('Import shipment not found');
  }

  const policyItem = await prisma.restrictedItemsList.findUnique({
    where: { hsCode: shipment.hsCode },
  });

  const policy = policyItem?.policy || 'FREE';
  const isProhibited = policy === 'PROHIBITED';
  const isRestricted = policy === 'RESTRICTED';
  const isSTE = policy === 'STE';
  const isFree = policy === 'FREE';

  return NextResponse.json({
    hsCode: shipment.hsCode,
    policy,
    policyCondition: policyItem?.policyCondition || 'Freely importable under Open General Licence (OGL)',
    requiredLicenseType: policyItem?.requiredLicenseType || null,
    isProhibited,
    isRestricted,
    isSTE,
    isFree,
    actionRequired: isProhibited
      ? 'HARD BLOCK: This item cannot be imported under Indian law'
      : isRestricted
      ? `LICENSE REQUIRED: Obtain ${policyItem?.requiredLicenseType || 'DGFT Import License'} before customs arrival`
      : isSTE
      ? 'STATE TRADING: Must be routed through a nominated government trading agency'
      : 'CLEAR: No special import authorization required',
  });
});
