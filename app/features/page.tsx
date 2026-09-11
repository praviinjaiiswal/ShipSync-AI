"use client";

import Link from "next/link";
import { useState } from "react";
import { StatutoryDisclaimer } from "@/components/ui/statutory-disclaimer";

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState("classifier");

  const features = {
    classifier: {
      title: "AI HS Code Classifier",
      icon: "🧠",
      accuracy: "AI-Assisted",
      description:
        "Provides AI-assisted suggestions for 8-digit Harmonized System codes based on official Indian tariff schedules. Always verify classifications before filing.",
      what:
        "Every product exported from India needs an 8-digit HS code. Wrong code = wrong duty + customs penalty + shipment delay. Our AI reads your product description and maps it to the correct code in under 2 seconds.",
      why: "Manual HS code lookup takes 15-45 minutes per product and requires expert knowledge. CHAs charge ₹2,000+ per query. One wrong code can cost ₹50,000+ in penalties.",
      how: `
    ┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
    │ Product Desc    │────▶│  Fine-tuned LLM  │────▶│ 8-Digit HS Code│
    │ (Your Input)    │     │  + Indian Tariff │     │ + Confidence   │
    └─────────────────┘     │    Database      │     │ + Alternatives │
                            └──────────────────┘     └─────────────────┘
                                    │
                                    ▼
                            ┌──────────────────┐
                            │ DGFT Validation  │
                            │ (RoDTEP/FTA chk) │
                            └──────────────────┘`,
      example:
        "A textile exporter in Surat uploads '100% cotton woven fabric, dyed, 200 GSM'. The AI returns: 5208.52.90 (Cotton fabrics, woven, dyed, >100 GSM) with 97% confidence. It also flags that this HS code is eligible for RoDTEP at 2.5% and suggests FTA route via UAE for zero duty.",
      mistakes: [
        "Relying on generic AI (ChatGPT) — it doesn't know India's 8-digit tariff lines",
        "Ignoring confidence scores — always verify codes below 85% confidence",
        "Not updating when DGFT revises tariff lines (happens every budget)",
      ],
      bestPractices: [
        "Always provide detailed product specs (material, process, end-use)",
        "Cross-check with CHA for first-time exports of a new product",
        "Use the 'alternatives' feature to see 2nd and 3rd best matches",
      ],
    },
    documents: {
      title: "Auto Document Generator",
      icon: "📄",
      accuracy: "Adapter-Based",
      description:
        "Generates commercial invoices, packing lists, shipping bills, and GR forms — formatted to ICEGATE schemas with adapter verification in testing stage.",
      what:
        "Export documentation is repetitive, error-prone, and format-sensitive. One mismatch between invoice and packing list = customs hold. This feature auto-generates all standard export documents from your product and buyer data.",
      why: "Average exporter spends 4+ hours per shipment on paperwork. 30% of shipping bills face queries due to document mismatches. Each query costs 2-3 days delay.",
      how: `
    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
    │ Product Data │───▶│  AI Engine   │───▶│  Document    │───▶│ ICEGATE XML  │
    │ Buyer Info   │    │  (Templates  │    │  Generator   │    │  Format      │
    │ Bank Details │    │   + Rules)   │    │              │    │              │
    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
           │                                          │
           ▼                                          ▼
    ┌──────────────┐                          ┌──────────────┐
    │ DGFT Scheme  │                          │ Validator    │
    │ Rules Engine │                          │ (Mismatch    │
    │              │                          │  Detection)  │
    └──────────────┘                          └──────────────┘`,
      example:
        "An engineering goods exporter in Pune needs to ship CNC machine parts to Germany. They input buyer details, product specs, and select FOB terms. The AI generates: Commercial Invoice (with HSN 8459.61.90), Packing List (net/gross weight auto-calculated), Shipping Bill (with port of exit Mundra), and GR Form — all pre-validated for ICEGATE upload.",
      mistakes: [
        "Copy-pasting old documents without updating buyer/bank details",
        "Forgetting to attach mandatory documents (COO, Test Reports)",
        "Using wrong Incoterms (FOB vs CIF) in invoice vs shipping bill",
      ],
      bestPractices: [
        "Always review AI-generated buyer/bank details before submission",
        "Save document templates per buyer for faster future generation",
        "Enable 'Auto-validate' to catch invoice vs packing list mismatches",
      ],
    },
    dgft: {
      title: "DGFT Benefit Finder",
      icon: "💰",
      accuracy: "Real-time",
      description:
        "Never miss RoDTEP, MEIS, or FTA advantages. Weekly notification parsing keeps you updated on 50+ DGFT circulars so you claim every eligible incentive.",
      what:
        "DGFT releases 50+ notifications weekly. Most exporters claim less than 60% of eligible benefits because they miss scheme updates. This feature monitors DGFT, parses notifications, and matches them to your export profile.",
      why: "India's average exporter leaves ₹5+ lakhs on the table annually in unclaimed benefits. RoDTEP alone covers 2-4% of FOB value. For a ₹1 crore exporter, that's ₹2-4 lakhs.",
      how: `
    ┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
    │ DGFT Website    │────▶│  Notification    │────▶│ Your Export     │
    │ (Weekly Scrape) │     │  Parser (NLP)    │     │ Profile Match   │
    └─────────────────┘     └──────────────────┘     └─────────────────┘
                                    │
                                    ▼
                            ┌──────────────────┐
                            │ Benefit Alert:   │
                            │ "Your HS code    │
                            │  now eligible    │
                            │  for 3% RoDTEP"  │
                            └──────────────────┘`,
      example:
        "A chemical exporter in Ahmedabad exports dye intermediates (HS 3204.16) to Vietnam. They were unaware that the India-ASEAN FTA was amended in March 2026 to reduce duty from 5% to 0% for this HS code. The Benefit Finder flagged this within 48 hours of the notification, saving them ₹8.5 lakhs annually.",
      mistakes: [
        "Assuming benefits are static — DGFT changes schemes every quarter",
        "Not linking IEC to DGFT portal for real-time status",
        "Missing FTA certificate deadlines (usually before shipment)",
      ],
      bestPractices: [
        "Enable WhatsApp/Email alerts for your top 10 HS codes",
        "Review benefit reports monthly, not just at year-end",
        "Always check FTA origin criteria before claiming preferential duty",
      ],
    },
    fta: {
      title: "FTA Route Optimizer",
      icon: "🌏",
      accuracy: "Duty Savings",
      description:
        "Save 5-15% duty via ASEAN, UAE, EU trade agreements. AI suggests the best shipping route and required certificates.",
      what:
        "India has 13+ active FTAs. Each has different Rules of Origin, product coverage, and certificate requirements. This tool tells you: (1) Which FTA applies, (2) What duty rate you'll get, (3) What certificate you need, (4) Whether direct consignment rule is met.",
      why: "Most exporters ship at MFN (Most Favoured Nation) duty rates because they don't know FTA benefits exist or find compliance too complex. A 10% duty saving on a ₹50 lakh shipment = ₹5 lakhs.",
      how: `
    ┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
    │ Destination     │────▶│  FTA Rules       │────▶│ Optimal Route   │
    │ Country         │     │  Engine          │     │ + Duty Rate     │
    │ HS Code         │     │  (13 FTAs)       │     │ + Certificate   │
    └─────────────────┘     └──────────────────┘     └─────────────────┘
                                    │
                                    ▼
                            ┌──────────────────┐
                            │ Direct           │
                            │ Consignment      │
                            │ Check            │
                            └──────────────────┘`,
      example:
        "An auto parts exporter ships brake pads (HS 8708.30) to Thailand. MFN duty = 20%. AI suggests India-ASEAN FTA route = 0% duty, but requires: (1) 40% value addition in India, (2) Form AI certificate from EPC, (3) Direct shipment or valid transshipment proof. The exporter saves ₹12 lakhs annually.",
      mistakes: [
        "Claiming FTA benefits without meeting Rules of Origin",
        "Using expired or incorrect Certificate of Origin format",
        "Not maintaining direct consignment documentation",
      ],
      bestPractices: [
        "Run FTA check before every new destination order",
        "Maintain 'cost sheet' proof for value addition calculations",
        "Get COO issued before shipment, not after",
      ],
    },
    validator: {
      title: "Document Validator",
      icon: "✅",
      accuracy: "Pre-Customs",
      description:
        "Catch mismatches between invoice, packing list, and B/L before customs flags them. Reduces shipping bill queries by 80%.",
      what:
        "Customs officers cross-verify 15+ data points across documents. Even a ₹1 difference in value or 0.1kg weight mismatch triggers a query. This AI reads all your documents and flags discrepancies before submission.",
      why: "30% of shipping bills face queries. Each query = 2-3 days delay + demurrage + possible penalty. Prevention is 100x cheaper than cure.",
      how: `
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │ Commercial  │  │ Packing     │  │ Shipping    │  │   B/L or    │
    │ Invoice     │  │ List        │  │ Bill        │  │   AWB       │
    └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
           │                │                │                │
           └────────────────┴────────────────┴────────────────┘
                                    │
                                    ▼
                          ┌─────────────────┐
                          │ Cross-Reference │
                          │ Engine (15+     │
                          │ checkpoints)    │
                          └────────┬────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
              ┌─────────┐   ┌─────────┐   ┌─────────┐
              │  PASS   │   │ WARNING │   │  ERROR  │
              │ (Green) │   │ (Amber) │   │  (Red)  │
              └─────────┘   └─────────┘   └─────────┘`,
      example:
        "An exporter submits documents for a textile shipment. The Validator flags: (1) Invoice value $10,000 but Shipping Bill shows $10,500, (2) Net weight on packing list is 1,200kg but B/L shows 1,250kg, (3) Buyer name spelling differs between invoice and shipping bill. All fixed before ICEGATE submission.",
      mistakes: [
        "Skipping validation for 'repeat buyers' — their details change too",
        "Ignoring 'WARNING' flags that don't block submission",
        "Not validating after last-minute invoice amendments",
      ],
      bestPractices: [
        "Run validator as the final step before every ICEGATE upload",
        "Set 'auto-block' for ERROR-level mismatches",
        "Keep a validation log for audit purposes",
      ],
    },
    dashboard: {
      title: "Compliance Dashboard",
      icon: "📊",
      accuracy: "Unified View",
      description:
        "Track shipments, benefits claimed, pending actions, and compliance health in one unified view with adapter-based schema verification and DGFT regulatory tracking.",
      what:
        "Export compliance is scattered across ICEGATE, DGFT, bank portals, and Excel sheets. This dashboard pulls everything into one place: shipment status, duty drawback status, FTA utilization, pending documents, and compliance score.",
      why: "Most exporters use 5+ different portals and Excel trackers. Information is always outdated. A unified dashboard saves 5+ hours/week of status-checking and prevents missed deadlines.",
      how: `
    ┌─────────────────────────────────────────────────────────────┐
    │                    COMPLIANCE DASHBOARD                     │
    ├─────────────┬─────────────┬─────────────┬─────────────────┤
    │  Shipments  │  Benefits   │  Documents  │  Compliance     │
    │  This Month │  Claimed    │  Pending    │  Score          │
    │    12       │   ₹4.2L     │     3       │    94/100       │
    └─────────────┴─────────────┴─────────────┴─────────────────┘
           │              │              │              │
           ▼              ▼              ▼              ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐
    │ ICEGATE API │ │ DGFT Portal │ │ Internal    │ │ Risk    │
    │ (Status)    │ │ (Schemes)   │ │ Documents   │ │ Engine  │
    └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘`,
      example:
        "The dashboard shows: 8 shipments this month (6 cleared, 2 under customs examination), ₹3.8L RoDTEP claimed (₹1.2L pending), 2 shipping bills awaiting GR form upload, and a compliance score of 92/100. The AI suggests: 'Upload GR forms for SB #4456 and #4457 to avoid late filing penalty.'",
      mistakes: [
        "Checking dashboard only weekly — some deadlines are daily",
        "Ignoring compliance score trends — a dropping score signals problems",
        "Not setting up alerts for examination or query status changes",
      ],
      bestPractices: [
        "Review dashboard every morning as part of export desk routine",
        "Set threshold alerts (e.g., compliance score < 80)",
        "Export monthly compliance reports for internal audits",
      ],
    },
  };

  const current = features[activeTab as keyof typeof features];

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-700 mb-6">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            AI Export Intelligence Layer
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-slate-900">
            Meet Your AI Export<br />
            <span className="text-slate-400">Intelligence Layer.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            Six interconnected AI tools that replace guesswork with precision. Built specifically for Indian export compliance workflows.
          </p>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Why ShipSync AI vs. Alternatives?</h2>
        <p className="text-slate-500 mb-8">A head-to-head comparison for a typical SME exporter shipping 20 consignments/month.</p>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-6 py-4 text-left font-semibold">Metric</th>
                <th className="px-6 py-4 text-center font-semibold">Manual Process</th>
                <th className="px-6 py-4 text-center font-semibold">Traditional CHA</th>
                <th className="px-6 py-4 text-center font-semibold bg-emerald-900">ShipSync AI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                ["HS Code Lookup (per product)", "30-45 min", "₹2,000/query", "< 2 sec (AI)"],
                ["Document Generation (per shipment)", "4+ hours", "₹1,500-3,000", "< 5 min (Auto)"],
                ["DGFT Benefit Discovery", "Missed 60%", "Ad-hoc", "Real-time alerts"],
                ["Document Validation", "Manual check", "Basic review", "AI cross-reference (15+ pts)"],
                ["Monthly Compliance Tracking", "Excel sheets", "Monthly report", "Live dashboard"],
                ["Total Monthly Cost (20 shipments)", "₹40,000+ (staff time)", "₹70,000-1,00,000", "₹5,000-15,000"],
                ["Error Rate", "25-30%", "10-15%", "< 5%"],
                ["Query/Examination Rate", "30%", "15%", "< 6%"],
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{row[0]}</td>
                  <td className="px-6 py-4 text-center text-slate-600">{row[1]}</td>
                  <td className="px-6 py-4 text-center text-slate-600">{row[2]}</td>
                  <td className="px-6 py-4 text-center font-semibold text-emerald-700 bg-emerald-50/30">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
          <p className="text-sm text-amber-800 font-medium">
            💡 Real Example: A Surat-based textile exporter with 25 monthly shipments saved ₹18 lakhs/year by reducing CHA dependency and catching unclaimed RoDTEP benefits.
          </p>
        </div>
      </section>

      {/* Feature Tabs */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap gap-2 mb-8">
          {Object.entries(features).map(([key, f]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                activeTab === key
                  ? "bg-slate-900 text-white shadow-lg"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
              }`}
            >
              {f.icon} {f.title}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Content */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{current.icon}</span>
                <h2 className="text-3xl font-bold text-slate-900">{current.title}</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 border border-emerald-200 mb-4">
                {current.accuracy}
              </div>
              <p className="text-lg text-slate-600 leading-relaxed">{current.description}</p>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl bg-white border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-slate-900 text-white text-xs flex items-center justify-center">?</span>
                  What It Does
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">{current.what}</p>
              </div>

              <div className="rounded-xl bg-white border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-slate-900 text-white text-xs flex items-center justify-center">!</span>
                  Why It Matters
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">{current.why}</p>
              </div>
            </div>

            {/* Architecture */}
            <div className="rounded-xl bg-slate-900 p-6 overflow-x-auto">
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Architecture Flow</h3>
              <pre className="text-emerald-400 text-xs leading-relaxed font-mono whitespace-pre">
                {current.how}
              </pre>
            </div>
          </div>

          {/* Right: Details */}
          <div className="space-y-6">
            <div className="rounded-xl bg-white border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                🏭 Real Industry Example
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">{current.example}</p>
            </div>

            <div className="rounded-xl bg-red-50 border border-red-200 p-6">
              <h3 className="font-semibold text-red-900 mb-3">❌ Common Mistakes</h3>
              <ul className="space-y-2">
                {current.mistakes.map((m, i) => (
                  <li key={i} className="text-red-800 text-sm flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0"></span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6">
              <h3 className="font-semibold text-emerald-900 mb-3">✅ Best Practices</h3>
              <ul className="space-y-2">
                {current.bestPractices.map((p, i) => (
                  <li key={i} className="text-emerald-800 text-sm flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl bg-slate-900 p-6">
              <h3 className="text-white font-semibold mb-2">✅ Final Recommendation for ShipSync AI</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Start with the <strong className="text-white">{current.title}</strong> as your pilot feature. Run it parallel to your existing process for 10 shipments. Measure: (1) Time saved per shipment, (2) Error reduction, (3) Cost avoided. Only after validation, expand to the next module. This phased approach minimizes risk while proving ROI to stakeholders.
              </p>
            </div>

            <StatutoryDisclaimer className="mt-6" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-t border-slate-200 mt-16">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              ["21,000+", "Tariff Lines Mastered"],
              ["50,000+", "Export Docs Processed Monthly"],
              ["15%", "India's Trade Software Growth"],
              ["₹5L+", "Avg Annual Savings Per Exporter"],
            ].map(([num, label], i) => (
              <div key={i}>
                <div className="text-3xl md:text-4xl font-bold text-slate-900">{num}</div>
                <div className="mt-1 text-sm font-medium text-slate-500 uppercase tracking-wide">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}