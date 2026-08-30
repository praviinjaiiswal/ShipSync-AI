"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { CheckCircle2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLANS = [
  { key: "FREE", name: "Free", price: "₹0", shipments: "3 shipments/month" },
  { key: "STARTER", name: "Starter", price: "₹1,999/mo", shipments: "20 shipments/month" },
  { key: "BUSINESS", name: "Business", price: "₹4,999/mo", shipments: "Unlimited shipments" },
];

export function BillingSection() {
  const [currentPlan, setCurrentPlan] = useState("FREE");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/team")
      .then((res) => res.json())
      .then((data) => {
        const owner = data.members?.find((m: any) => !m.organizationOwnerId) ?? data.members?.[0];
        if (owner?.plan) setCurrentPlan(owner.plan);
      });
  }, []);

  const handleUpgrade = async (planKey: string) => {
    setError("");
    setLoading(planKey);

    try {
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });

      if (!orderRes.ok) {
        const data = await orderRes.json();
        throw new Error(data.error ?? "Order create nahi ho paaya");
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
            setCurrentPlan(planKey);
          } else {
            setError("Payment hua lekin verify nahi ho paaya. Support se contact karo.");
          }
        },
        modal: {
          ondismiss: () => setLoading(null),
        },
        theme: { color: "#D97757" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setError(err.message ?? "Kuch galat ho gaya");
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

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
                  <p className="text-xs text-muted-foreground">Downgrade support se karo</p>
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