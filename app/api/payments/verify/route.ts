import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/app/lib/prisma";
import { getOrgContext } from "@/lib/getOrgContext";

export async function POST(req: NextRequest) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = await req.json();

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  const currentPeriodEnd = new Date();
  currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { userId: ctx.effectiveOwnerId },
      update: { plan, status: "ACTIVE", currentPeriodEnd, razorpaySubscriptionId: razorpay_payment_id },
      create: {
        userId: ctx.effectiveOwnerId,
        plan,
        status: "ACTIVE",
        currentPeriodEnd,
        razorpaySubscriptionId: razorpay_payment_id,
      },
    }),
    prisma.user.update({
      where: { id: ctx.effectiveOwnerId },
      data: { plan },
    }),
    prisma.activity.create({
      data: {
        userId: ctx.user.id,
        action: "PLAN_UPGRADED",
        details: `Upgraded to ${plan} plan`,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}