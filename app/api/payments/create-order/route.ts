import { NextRequest, NextResponse } from "next/server";
import { razorpay, PLANS } from "@/lib/razorpay";
import { getOrgContext } from "@/lib/getOrgContext";

export async function POST(req: NextRequest) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!ctx.isOwner) {
    return NextResponse.json({ error: "Sirf account owner hi plan upgrade kar sakta hai" }, { status: 403 });
  }

  const { plan } = await req.json();
  const planKey = plan as keyof typeof PLANS;

  if (!PLANS[planKey] || PLANS[planKey].amount === 0) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const order = await razorpay.orders.create({
    amount: PLANS[planKey].amount,
    currency: "INR",
    receipt: `plan_${planKey}_${ctx.user.id}_${Date.now()}`,
    notes: { userId: ctx.user.id, plan: planKey },
  });

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    planName: PLANS[planKey].name,
  });
}