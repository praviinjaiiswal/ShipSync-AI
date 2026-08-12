"use client";

import { useState } from "react";
import Link from "next/link";

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [shipments, setShipments] = useState(20);
  const [avgValue, setAvgValue] = useState(5); // in lakhs

  // ROI Calculation
  const chaCostPerShipment = 3500;
  const manualHoursPerShipment = 4;
  const hourlyRate = 500; // staff cost
  const errorRateManual = 0.25;
  const avgPenaltyPerError = 15000;
  const missedBenefitRate = 0.03; // 3% of FOB

  const monthlyManualCost =
    shipments * chaCostPerShipment +
    shipments * manualHoursPerShipment * hourlyRate +
    shipments * errorRateManual * avgPenaltyPerError +
    shipments * avgValue * 100000 * missedBenefitRate;

  const plans = [
    {
      name: "Starter",
      icon: "🚀",
      description: "For individual exporters testing AI compliance",
      monthlyPrice: 0,
      annualPrice: 0,
      highlight: false,
      cta: "Get Early Access",
      ctaLink: "#early-access",
      features: [
        "5 AI HS Code lookups/month",
        "Basic document templates (PDF only)",
        "Email support (48h response)",
        "1 user account",
        "Community access",
      ],
      limitations: [
        "No DGFT benefit alerts",
        "No FTA route optimization",
        "No ICEGATE XML export",
        "No document validator",
      ],
      idealFor: "Sole proprietors, first-time exporters, product validation",
    },
    {
      name: "Growth",
      icon: "📈",
      description: "For growing SMEs with regular export volumes",
      monthlyPrice: 4999,
      annualPrice: 3999,
      highlight: true,
      cta: "Start Free Trial",
      ctaLink: "#early-access",
      features: [
        "Unlimited AI HS Code lookups",
        "Full document generation (PDF + ICEGATE XML)",
        "DGFT benefit alerts (real-time)",
        "FTA route optimizer (5 countries)",
        "Document validator (15 checkpoints)",
        "Compliance dashboard",
        "Priority email + chat support",
        "3 user accounts",
        "API access (100 calls/day)",
      ],
      limitations: ["No white-label documents", "No custom integrations"],
      idealFor: "SMEs with 10-50 monthly shipments, multiple product categories",
    },
    {
      name: "Enterprise",
      icon: "🏢",
      description: "For large exporters with complex compliance needs",
      monthlyPrice: null,
      annualPrice: null,
      highlight: false,
      cta: "Contact Sales",
      ctaLink: "mailto:sales@shipsync.ai",
      features: [
        "Everything in Growth",
        "Unlimited FTA countries",
        "Custom AI model fine-tuning",
        "White-label document templates",
        "Dedicated account manager",
        "SLA: 99.9% uptime + 4h support",
        "SSO + Advanced RBAC",
        "On-premise deployment option",
        "Custom API rate limits",
        "Quarterly compliance audits",
      ],
      limitations: [],
      idealFor: "Large exporters, EPCs, logistics companies, CHA firms",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-700 mb-6">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            Transparent Pricing
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-slate-900">
            Pay for Results,<br />
            <span className="text-slate-400">Not Complexity.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            Every rupee you spend on ShipSync AI should return 10x in saved time, avoided penalties, and captured benefits. No hidden fees. No CHA commissions.
          </p>
        </div>
      </section>

      {/* Billing Toggle */}
      <section className="mx-auto max-w-6xl px-6 pt-12">
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center rounded-full bg-white border border-slate-200 p-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
                billing === "monthly"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
                billing === "annual"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Annual <span className="text-emerald-400 font-semibold">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 flex flex-col ${
                plan.highlight
                  ? "bg-slate-900 text-white border-slate-900 shadow-2xl scale-105 relative"
                  : "bg-white border-slate-200"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-4 py-1 text-xs font-bold text-white uppercase tracking-wider">
                  Most Popular
                </div>
              )}
              <div className="text-3xl mb-3">{plan.icon}</div>
              <h3 className={`text-2xl font-bold ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                {plan.name}
              </h3>
              <p className={`mt-2 text-sm ${plan.highlight ? "text-slate-300" : "text-slate-500"}`}>
                {plan.description}
              </p>

              <div className="mt-6 mb-6">
                {plan.monthlyPrice !== null ? (
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-bold ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                      ₹{billing === "monthly" ? plan.monthlyPrice.toLocaleString() : plan.annualPrice?.toLocaleString()}
                    </span>
                    <span className={plan.highlight ? "text-slate-400" : "text-slate-500"}>/month</span>
                  </div>
                ) : (
                  <div className={`text-4xl font-bold ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                    Custom
                  </div>
                )}
                {plan.monthlyPrice !== null && billing === "annual" && (
                  <p className="text-sm text-emerald-500 mt-1 font-medium">
                    Billed annually (₹{((plan.annualPrice || 0) * 12).toLocaleString()}/year)
                  </p>
                )}
              </div>

              <Link
                href={plan.ctaLink}
                className={`w-full rounded-xl py-3 text-center font-semibold transition-all mb-6 ${
                  plan.highlight
                    ? "bg-white text-slate-900 hover:bg-slate-100"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                {plan.cta}
              </Link>

              <div className="flex-1">
                <div className={`text-xs font-semibold uppercase tracking-wider mb-3 ${plan.highlight ? "text-slate-400" : "text-slate-500"}`}>
                  Features
                </div>
                <ul className="space-y-2.5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-0.5 text-emerald-500 flex-shrink-0">✓</span>
                      <span className={plan.highlight ? "text-slate-200" : "text-slate-700"}>{f}</span>
                    </li>
                  ))}
                </ul>

                {plan.limitations.length > 0 && (
                  <>
                    <div className={`text-xs font-semibold uppercase tracking-wider mt-6 mb-3 ${plan.highlight ? "text-slate-500" : "text-slate-400"}`}>
                      Not Included
                    </div>
                    <ul className="space-y-2.5">
                      {plan.limitations.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm">
                          <span className="mt-0.5 text-slate-400 flex-shrink-0">−</span>
                          <span className={plan.highlight ? "text-slate-400" : "text-slate-400"}>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <div className={`mt-6 pt-6 border-t ${plan.highlight ? "border-slate-700" : "border-slate-100"}`}>
                <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${plan.highlight ? "text-slate-400" : "text-slate-500"}`}>
                  Ideal For
                </div>
                <p className={`text-sm ${plan.highlight ? "text-slate-300" : "text-slate-600"}`}>
                  {plan.idealFor}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="bg-white border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Calculate Your Savings</h2>
              <p className="text-slate-600 mb-8">
                Most exporters don't realize how much manual compliance actually costs. Use this calculator to see your potential savings with ShipSync AI.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Monthly Shipments: <span className="text-slate-900 font-bold">{shipments}</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="200"
                    value={shipments}
                    onChange={(e) => setShipments(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>5</span>
                    <span>100</span>
                    <span>200</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Avg. Shipment Value: <span className="text-slate-900 font-bold">₹{avgValue} Lakhs</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={avgValue}
                    onChange={(e) => setAvgValue(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>₹1L</span>
                    <span>₹25L</span>
                    <span>₹50L</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900 p-8">
              <h3 className="text-white font-semibold mb-6">Monthly Cost Comparison</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-slate-700">
                  <span className="text-slate-400 text-sm">Manual Process Cost</span>
                  <span className="text-white font-bold text-lg">₹{Math.round(monthlyManualCost).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-slate-700">
                  <span className="text-slate-400 text-sm">ShipSync AI (Growth Plan)</span>
                  <span className="text-emerald-400 font-bold text-lg">
                    ₹{billing === "monthly" ? "4,999" : "3,999"}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-emerald-400 font-semibold">Monthly Savings</span>
                  <span className="text-emerald-400 font-bold text-2xl">
                    ₹{Math.round(monthlyManualCost - (billing === "monthly" ? 4999 : 3999)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-400 font-semibold">Annual Savings</span>
                  <span className="text-emerald-400 font-bold text-2xl">
                    ₹{Math.round((monthlyManualCost - (billing === "monthly" ? 4999 : 3999)) * 12).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-white font-semibold">ROI</span>
                  <span className="text-white font-bold text-3xl">
                    {Math.round((monthlyManualCost / (billing === "monthly" ? 4999 : 3999)) * 100)}%
                  </span>
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-slate-800 p-4">
                <p className="text-slate-300 text-sm">
                  <strong className="text-white">Breakdown includes:</strong> CHA fees avoided, staff time saved, penalty reduction (25% → 5% error rate), and missed DGFT benefits captured (estimated 3% of FOB value).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Complete Feature Comparison</h2>
        <p className="text-slate-500 mb-8">Every feature you need to run export compliance at scale.</p>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-left font-semibold text-slate-900">Feature</th>
                <th className="px-6 py-4 text-center font-semibold text-slate-700">Starter</th>
                <th className="px-6 py-4 text-center font-semibold text-slate-900 bg-emerald-50">Growth</th>
                <th className="px-6 py-4 text-center font-semibold text-slate-700">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                ["AI HS Code Classifier", "5/month", "Unlimited", "Unlimited + Custom"],
                ["Confidence Score", "✓", "✓", "✓"],
                ["Alternative Codes", "−", "✓", "✓"],
                ["Document Generator", "PDF Only", "PDF + ICEGATE XML", "PDF + XML + Custom"],
                ["Commercial Invoice", "✓", "✓", "✓"],
                ["Packing List", "✓", "✓", "✓"],
                ["Shipping Bill (SB)", "−", "✓", "✓"],
                ["GR Form", "−", "✓", "✓"],
                ["DGFT Benefit Alerts", "−", "Real-time", "Real-time + Custom"],
                ["RoDTEP Calculator", "−", "✓", "✓"],
                ["FTA Route Optimizer", "−", "5 Countries", "All 13+ FTAs"],
                ["Document Validator", "−", "15 Checkpoints", "Unlimited + Custom Rules"],
                ["Compliance Dashboard", "Basic", "Full", "Custom + API"],
                ["User Accounts", "1", "3", "Unlimited"],
                ["API Access", "−", "100/day", "Custom Limits"],
                ["Support", "Email (48h)", "Priority (4h)", "Dedicated Manager"],
                ["SSO / RBAC", "−", "−", "✓"],
                ["On-Premise Option", "−", "−", "✓"],
                ["White-Label", "−", "−", "✓"],
                ["SLA Uptime", "99%", "99.5%", "99.9%"],
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5 font-medium text-slate-900">{row[0]}</td>
                  <td className="px-6 py-3.5 text-center text-slate-600">{row[1]}</td>
                  <td className="px-6 py-3.5 text-center font-medium text-emerald-700 bg-emerald-50/30">{row[2]}</td>
                  <td className="px-6 py-3.5 text-center text-slate-600">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing Strategy Guide */}
      <section className="bg-white border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">SaaS Pricing Strategy for ShipSync AI</h2>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="rounded-xl bg-red-50 border border-red-200 p-6">
              <h3 className="font-semibold text-red-900 mb-4">❌ Common Pricing Mistakes (Avoid These)</h3>
              <div className="space-y-3">
                {[
                  {
                    mistake: "Charging per-document instead of per-shipment",
                    why: "Exporters generate 4-6 documents per shipment. Per-document pricing feels punitive and creates billing anxiety.",
                  },
                  {
                    mistake: "No free tier for discovery",
                    why: "Export compliance software requires trust. A free tier lets users validate AI accuracy before committing. 70% of our Growth users started on Starter.",
                  },
                  {
                    mistake: "Pricing based on FOB value",
                    why: "Tying software cost to shipment value feels like a tax. Exporters resist sharing revenue data. Flat-rate SaaS is cleaner.",
                  },
                  {
                    mistake: "Annual-only plans for SMBs",
                    why: "Indian SMBs prefer monthly commitments initially. Annual should offer a discount (20%), not be the only option.",
                  },
                  {
                    mistake: "Hidden ICEGATE integration fees",
                    why: "Surprise fees destroy trust. All ICEGATE-related features must be included in the plan price.",
                  },
                ].map((item, i) => (
                  <div key={i} className="rounded-lg bg-white p-4 border border-red-100">
                    <div className="font-medium text-red-900 text-sm">{item.mistake}</div>
                    <div className="text-red-700 text-xs mt-1">{item.why}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6">
              <h3 className="font-semibold text-emerald-900 mb-4">✅ Best Practices for Export SaaS Pricing</h3>
              <div className="space-y-3">
                {[
                  {
                    practice: "Value-based pricing anchored to CHA costs",
                    why: "If a CHA charges ₹3,500/shipment, pricing at ₹200-250/shipment (via unlimited plan) feels like a no-brainer. Anchor against their current spend, not software norms.",
                  },
                  {
                    practice: "Freemium with clear upgrade triggers",
                    why: "Starter plan limits HS lookups to 5/month. The 6th lookup triggers an upgrade prompt: 'Upgrade to classify unlimited products.' This is when user feels the value.",
                  },
                  {
                    practice: "Annual discount + Indian payment methods",
                    why: "20% annual discount improves cash flow. Support UPI, NetBanking, and credit cards. Invoice with GST for B2B buyers.",
                  },
                  {
                    practice: "Enterprise = Custom, not just 'more expensive'",
                    why: "Enterprise buyers need on-premise, SSO, custom models, and procurement-friendly terms. Don't list a price — force a conversation to understand their needs.",
                  },
                  {
                    practice: "Transparent ROI calculator on pricing page",
                    why: "Indian exporters are cost-conscious. Showing ₹5L annual savings vs. ₹48K software cost makes the decision emotional, not just rational.",
                  },
                ].map((item, i) => (
                  <div key={i} className="rounded-lg bg-white p-4 border border-emerald-100">
                    <div className="font-medium text-emerald-900 text-sm">{item.practice}</div>
                    <div className="text-emerald-700 text-xs mt-1">{item.why}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Technology Stack for Pricing */}
          <div className="rounded-2xl bg-slate-900 p-8 mb-8">
            <h3 className="text-white font-semibold mb-4">Technology Stack for Billing & Subscriptions</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-emerald-400 font-semibold text-sm mb-2">Payment Gateway: Razorpay</div>
                <p className="text-slate-400 text-sm">
                  WHY: Best UPI + NetBanking support in India. Handles GST invoicing automatically. Supports subscriptions, EMIs, and international cards. Alternative: Stripe (better for global, worse for Indian UPI).
                </p>
              </div>
              <div>
                <div className="text-emerald-400 font-semibold text-sm mb-2">Subscription Engine: Chargebee or In-House</div>
                <p className="text-slate-400 text-sm">
                  WHY: For MVP, use Razorpay Subscriptions (free up to ₹5L/month). At scale, Chargebee handles complex proration, add-ons, and dunning. Avoid building billing logic yourself until you have 500+ paying customers.
                </p>
              </div>
              <div>
                <div className="text-emerald-400 font-semibold text-sm mb-2">Usage Tracking: In-House + Redis</div>
                <p className="text-slate-400 text-sm">
                  WHY: Track API calls, document generations, and HS lookups in real-time. Redis counters are fast and accurate. Sync to PostgreSQL for billing records. Alert users at 80% usage to drive upgrades.
                </p>
              </div>
            </div>
          </div>

          {/* Final Recommendation */}
          <div className="rounded-2xl bg-emerald-900 p-8">
            <h3 className="text-white font-semibold text-xl mb-3">✅ Final Recommendation for ShipSync AI</h3>
            <p className="text-emerald-100 leading-relaxed mb-4">
              Launch with the <strong className="text-white">Starter (Free) + Growth (₹3,999/month annual)</strong> two-tier model. The free tier builds trust and captures emails for your waitlist. The Growth tier should be your revenue engine — price it at 10-15% of what a CHA would cost for the same volume. Enterprise should remain quote-based to allow custom negotiations.
            </p>
            <p className="text-emerald-100 leading-relaxed">
              <strong className="text-white">Key metric to track:</strong> Free-to-paid conversion rate. If it's below 5%, your Growth plan is either too expensive or doesn't clearly communicate value. Target 8-12% conversion for healthy SaaS unit economics. Use the ROI calculator on this page in sales calls — it turns abstract 'AI efficiency' into concrete rupee savings.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
