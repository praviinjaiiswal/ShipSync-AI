import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { requireTenantContext } from '@/lib/tenant';
import { assertPermission } from '@/lib/rbac/assert-permission';
import { ValidationError } from '@/lib/errors';
import type { Plan } from '@prisma/client';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireTenantContext();
  assertPermission(ctx.role, 'billing:manage');

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = await req.json();

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ValidationError('Missing required payment verification parameters');
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error('Payment gateway configuration is missing');
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    throw new ValidationError('Payment signature verification failed');
  }

  const currentPeriodEnd = new Date();
  currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { userId: ctx.userId },
      update: {
        companyId: ctx.companyId,
        plan: plan as Plan,
        status: 'ACTIVE',
        currentPeriodEnd,
        razorpaySubscriptionId: razorpay_payment_id,
      },
      create: {
        companyId: ctx.companyId,
        userId: ctx.userId,
        plan: plan as Plan,
        status: 'ACTIVE',
        currentPeriodEnd,
        razorpaySubscriptionId: razorpay_payment_id,
      },
    }),
    prisma.company.update({
      where: { id: ctx.companyId },
      data: { plan: plan as Plan },
    }),
    prisma.activity.create({
      data: {
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: 'PLAN_UPGRADED',
        details: `Organization upgraded to ${plan} plan`,
      },
    }),
  ]);

  return NextResponse.json({ success: true, plan });
});