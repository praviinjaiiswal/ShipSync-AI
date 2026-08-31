"use client";

import { useState } from "react";
import useSWR from "swr";
import Script from "next/script";
import { CheckCircle2, CreditCard, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetcher } from "@/lib/fetcher";

const PLANS = [
  { key: "FREE", name: "Free", price: "₹0", shipments: "3 shipments/month" },
  { key: "STARTER", name: "Starter", price: "₹1,999/mo", shipments: "20 shipments/month" },
  { key: "BUSINESS", name: "Business", price: "₹4,999/mo", shipments: "Unlimited shipments" },
];

type TeamData = { members: { plan?: string; organizationOwnerId?: string | null }[] };

export function BillingSection() {
  const { data, error, mutate } = useSWR<TeamData>("/api/team", fetcher);
  const [loading, setLoading] = useState<string | null>(null);
  const [payError, setPayError] = useState("");

  const currentPlan =
    data?.members?.find((m: any) => !m.organizationOwnerId)?.plan ?? "FREE";

  const handleUpgrade = async (planKey: string) => {
    setPayError("");
    setLoading(planKey);

    try {
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json();
        throw new Error(errData.error ?? "Failed to create order");
      }

      const order = await orderRes.json();

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "ShipSync AI",
        description: `${order.planName} Plan`,
        order_id: order.orderId,
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, plan: planKey }),
          });

          if (verifyRes.ok) {
            mutate();
          } else {
            setPayError("Payment received but verification failed. Please contact support.");
          }
        },
        modal: { ondismiss: () => setLoading(null) },
        theme: { color: "#D97757" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setPayError(err.message ?? "Something went wrong");
    } finally {
      setLoading(null);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-between text-sm text-destructive">
        <span>Failed to load billing info.</span>
        <button onClick={() => mutate()} className="flex items-center gap-1 text-xs underline">
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="space-y-4">
        {payError && <p className="text-sm text-destructive">{payError}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = plan.key === currentPlan;
            return (
              <div
                key={plan.key}
                className={`border rounded-lg p-4 space-y-3 ${
                  isCurrent ? "border-brand-orange bg-brand-orange/5" : "border-border"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                  <p className="text-xl font-bold text-foreground mt-1">{plan.price}</p>
                  <p className="text-xs text-muted-foreground mt-1">{plan.shipments}</p>
                </div>

                {isCurrent ? (
                  <div className="flex items-center gap-1.5 text-xs text-brand-orange font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Current Plan
                  </div>
                ) : plan.key === "FREE" ? (
                  <p className="text-xs text-muted-foreground">Contact support to downgrade</p>
                ) : (
                  <Button
                    size="sm"
                    className="w-full bg-brand-orange text-brand-orange-foreground hover:opacity-90"
                    disabled={loading === plan.key}
                    onClick={() => handleUpgrade(plan.key)}
                  >
                    <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                    {loading === plan.key ? "Processing..." : "Upgrade"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}