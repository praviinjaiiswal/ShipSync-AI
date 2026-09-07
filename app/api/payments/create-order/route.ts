import { NextRequest, NextResponse } from 'next/server';
import { razorpay, PLANS } from '@/lib/razorpay';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { ValidationError } from '@/lib/errors';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'billing:manage');

  const { plan } = await req.json();
  const planKey = plan as keyof typeof PLANS;

  if (!PLANS[planKey] || PLANS[planKey].amount === 0) {
    throw new ValidationError('Invalid or free plan selected for checkout');
  }

  const order = await razorpay.orders.create({
    amount: PLANS[planKey].amount,
    currency: 'INR',
    receipt: `plan_${planKey}_${ctx.companyId.slice(0, 10)}_${Date.now()}`,
    notes: {
      userId: ctx.userId,
      companyId: ctx.companyId,
      plan: planKey,
    },
  });

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    planName: PLANS[planKey].name,
  });
});