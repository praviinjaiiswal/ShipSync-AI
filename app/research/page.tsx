"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const sections = [
  { id: "opportunity", label: "Opportunity" },
  { id: "problem", label: "Problem" },
  { id: "shipsync", label: "ShipSync" },
  { id: "business", label: "Business" },
  { id: "competition", label: "Competition" },
  { id: "growth", label: "Growth" },
  { id: "investment", label: "Investment" },
];

export default function ResearchPage() {
  const [activeSection, setActiveSection] = useState("opportunity");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [deepDiveOpen, setDeepDiveOpen] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  };

  return (
    <main className="min-h-screen bg-[#F8F9FC] text-slate-900">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0B1121]">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-4 py-1.5 text-sm font-medium text-slate-300 mb-8">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Investor Research
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
            Building the Intelligence Layer<br />
            <span className="text-slate-400">for Global Trade.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 leading-relaxed">
            ShipSync AI is building software that helps exporters navigate classification, benefits, documentation and compliance with AI.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button onClick={() => scrollTo("investment")} className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors">
              Talk to the Founders
            </button>
            <a href="mailto:investors@shipsync.ai" className="rounded-full border border-slate-600 px-8 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors">
              Request Investor Deck
            </a>
          </div>
        </div>
      </section>

      {/* STICKY NAV */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6">
          <div className="hidden md:flex items-center justify-center gap-1 py-3">
            {sections.map((s) => (
              <button key={s.id} onClick={() => scrollTo(s.id)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${activeSection === s.id ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`}>
                {s.label}
              </button>
            ))}
          </div>
          <div className="md:hidden py-3">
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
              <span>{sections.find((s) => s.id === activeSection)?.label}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={mobileOpen ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6"} /></svg>
            </button>
            {mobileOpen && (
              <div className="mt-2 space-y-1 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                {sections.map((s) => (
                  <button key={s.id} onClick={() => scrollTo(s.id)}
                    className={`block w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors ${activeSection === s.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* 01 — OPPORTUNITY */}
      <section id="opportunity" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">01 — Opportunity</div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Should I Care About This Market?</h2>
          <p className="text-slate-500 text-lg mb-16 max-w-2xl">Global trade is growing. Compliance is getting harder. AI can bridge the gap.</p>

          {/* Big Numbers */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { label: "Total Addressable Market", value: "₹47,700 Cr", source: "Illustrative global trade-intelligence software opportunity" },
              { label: "Serviceable Addressable Market", value: "₹2,860 Cr", source: "India-first initial market estimate" },
              { label: "Target Customers (India)", value: "1 Lakh+", source: "Estimated active export-focused businesses" },
              { label: "Revenue Opportunity", value: "₹143 Cr", source: "Illustrative: 10,000 customers × ~₹1.43L annual revenue" },
            ].map((n, i) => (
              <div key={i} className="rounded-2xl bg-white border border-slate-200 p-6 text-center hover:shadow-lg transition-shadow">
                <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">{n.value}</div>
                <div className="text-sm font-medium text-slate-500 mb-3">{n.label}</div>
                <div className="text-xs text-slate-400">{n.source}</div>
              </div>
            ))}
          </div>

          {/* Market Story */}
          <div className="rounded-2xl bg-[#0B1121] p-8 mb-16 overflow-x-auto">
            <h3 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">The Market Story</h3>
            <pre className="text-emerald-400 text-sm font-mono whitespace-pre leading-relaxed">
{`
    Global Trade ($30T+)
           │
           ▼
    Growing Complexity
    • More FTAs (India has 13+)
    • More notifications (DGFT: 50+/week)
    • More documentation (ICEGATE 2.0)
           │
           ▼
    More Compliance Burden
    • 21,000+ tariff lines
    • 4+ hours per shipment
    • 30% query rate
           │
           ▼
    More Data, More Manual Work
    • 5+ portals to check
    • Excel trackers
    • Consultant dependency
           │
           ▼
    🎯 AI OPPORTUNITY
    • Automate classification
    • Discover hidden benefits
    • Generate compliant documents
    • Reduce errors by 80%+
`}
            </pre>
          </div>

          {/* TAM/SAM/SOM */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-8 text-center hover:border-slate-900 transition-colors">
              <div className="text-5xl font-bold text-slate-900 mb-2">TAM</div>
              <div className="text-sm text-slate-500 mb-4">Total Addressable Market</div>
              <p className="text-slate-600 text-sm">Everyone we could theoretically serve. All exporters globally who need compliance assistance.</p>
              <div className="mt-4 text-2xl font-bold text-slate-400">$[ADD DATA]B</div>
            </div>
            <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/30 p-8 text-center">
              <div className="text-5xl font-bold text-emerald-700 mb-2">SAM</div>
              <div className="text-sm text-emerald-600 mb-4">Serviceable Addressable Market</div>
              <p className="text-slate-600 text-sm">The market we can realistically target. Indian SME exporters with regular shipment volumes.</p>
              <div className="mt-4 text-2xl font-bold text-emerald-700">$[ADD DATA]B</div>
            </div>
            <div className="rounded-2xl border-2 border-slate-900 bg-slate-900 p-8 text-center">
              <div className="text-5xl font-bold text-white mb-2">SOM</div>
              <div className="text-sm text-slate-400 mb-4">Serviceable Obtainable Market</div>
              <p className="text-slate-300 text-sm">The market we can capture first. Tech-forward Indian exporters in textiles, chemicals, and engineering.</p>
              <div className="mt-4 text-2xl font-bold text-emerald-400">$[ADD DATA]M</div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="rounded-xl bg-white border border-slate-200 overflow-hidden mb-12">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-slate-900">Factor</th>
                  <th className="px-6 py-4 text-center font-semibold text-slate-700">5 Years Ago</th>
                  <th className="px-6 py-4 text-center font-semibold text-emerald-700 bg-emerald-50/30">Today</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ["AI Capability", "Basic NLP, 60% accuracy", "Fine-tuned LLMs, 94%+ accuracy"],
                  ["ICEGATE", "Legacy portal, manual upload", "ICEGATE 2.0, API-ready"],
                  ["DGFT Data", "PDF notifications, scattered", "Structured data, parseable"],
                  ["Exporter Mindset", "Paper-based, CHA-dependent", "Digital-first, SaaS-willing"],
                  ["Competition", "None (AI export tools)", "Early stage, fragmented"],
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{row[0]}</td>
                    <td className="px-6 py-4 text-center text-slate-500">{row[1]}</td>
                    <td className="px-6 py-4 text-center font-medium text-emerald-700 bg-emerald-50/20">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Best Practices + Mistakes */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="rounded-xl bg-red-50 border border-red-200 p-6">
              <h4 className="font-semibold text-red-900 mb-3">❌ Common Mistakes in Market Sizing</h4>
              <ul className="space-y-2 text-sm text-red-800">
                <li>• Counting every exporter as a customer — most are one-time or irregular</li>
                <li>• Using global TAM without localization — Indian compliance is unique</li>
                <li>• Ignoring CHA market — they are incumbents, not just competitors</li>
                <li>• Overestimating AI readiness — many exporters still use pen and paper</li>
              </ul>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6">
              <h4 className="font-semibold text-emerald-900 mb-3">✅ Best Practices for Market Validation</h4>
              <ul className="space-y-2 text-sm text-emerald-800">
                <li>• Start with DGFT-registered active exporters (filter by IEC usage)</li>
                <li>• Segment by shipment frequency — monthly shippers = real customers</li>
                <li>• Validate willingness-to-pay with pilot programs before scaling</li>
                <li>• Track CHA market size as a pricing anchor (we are 10x cheaper)</li>
              </ul>
            </div>
          </div>

          {/* Final Recommendation */}
          <div className="rounded-2xl bg-slate-900 p-8">
            <h3 className="text-white font-semibold mb-3">✅ Final Recommendation for ShipSync AI</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Start with a narrow SOM: Indian SME exporters doing 10+ shipments/month in textiles, chemicals, or engineering goods. Validate TAM/SAM assumptions through 50+ customer interviews before presenting to investors. Use DGFT's public IEC database as your primary source for market sizing — it is free and authoritative.
            </p>
          </div>
        </div>
      </section>

      {/* 02 — PROBLEM */}
      <section id="problem" className="scroll-mt-24 bg-slate-100/50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">02 — Problem</div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">What Is Broken Today?</h2>
          <p className="text-slate-500 text-lg mb-16 max-w-2xl">Export compliance is fragmented, manual, and expensive. Here is what exporters actually face.</p>

          {/* Problem Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {[
              { num: "01", title: "HS Code Confusion", desc: "21,000+ tariff lines. One wrong code = customs penalty + shipment delay. Exporters spend hours guessing or pay CHAs ₹2,000+ per query.", impact: "₹[ADD DATA] per error" },
              { num: "02", title: "Missed DGFT Benefits", desc: "RoDTEP, MEIS, FTA benefits scattered across 50+ weekly notifications. Most exporters claim less than 60% of eligible incentives.", impact: "60% benefits unclaimed" },
              { num: "03", title: "Document Chaos", desc: "Commercial invoice, packing list, shipping bill, GR form — 4+ hours per shipment, manual copy-paste across ICEGATE, DGFT, and bank portals.", impact: "4+ hrs per shipment" },
              { num: "04", title: "Fragmented Information", desc: "Critical data lives across 5+ government portals, PDF notifications, consultant emails, and Excel trackers. No single source of truth.", impact: "5+ portals to check" },
            ].map((p) => (
              <div key={p.num} className="rounded-2xl bg-white border border-slate-200 p-8 hover:shadow-lg transition-shadow">
                <div className="text-6xl font-bold text-slate-100 mb-4">{p.num}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{p.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">{p.desc}</p>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Impact: {p.impact}</div>
              </div>
            ))}
          </div>

          {/* Today Visual */}
          <div className="rounded-2xl bg-[#0B1121] p-8 mb-16 overflow-x-auto">
            <h3 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">The Exporter Workflow Today</h3>
            <pre className="text-slate-400 text-sm font-mono whitespace-pre leading-relaxed">
{`
    ┌───────────┐
    │ Exporter  │
    └─────┬─────┘
          │ "What HS code for my product?"
          ▼
    ┌───────────┐     ┌───────────┐     ┌───────────┐
    │  Google   │────▶│ Government│────▶│   PDFs    │
    │  Search   │     │  Portals  │     │(Notifications)
    └───────────┘     └───────────┘     └─────┬─────┘
                                              │
          ┌───────────────────────────────────┘
          ▼
    ┌───────────┐     ┌───────────┐     ┌───────────┐
    │ Consultant│────▶│Spreadsheet│────▶│ Documents │
    │   (CHA)   │     │  Tracker  │     │ (Manual)  │
    └───────────┘     └───────────┘     └─────┬─────┘
                                              │
                                              ▼
                                        ┌───────────┐
                                        │  Customs  │
                                        │  (Query?) │
                                        └───────────┘

    TODAY:
    ❌ Fragmented   ❌ Manual   ❌ Time-consuming   ❌ Error-prone
`}
            </pre>
          </div>

          {/* Cost of Problem */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="rounded-xl bg-white border border-slate-200 p-6 text-center">
              <div className="text-4xl font-bold text-slate-900 mb-2">16+</div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Hours Lost</div>
              <p className="text-xs text-slate-400 mt-2">Per month per exporter</p>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-6 text-center">
              <div className="text-4xl font-bold text-slate-900 mb-2">12+</div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Manual Steps</div>
              <p className="text-xs text-slate-400 mt-2">Per shipment end-to-end</p>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-6 text-center">
              <div className="text-4xl font-bold text-slate-900 mb-2">₹1.5L+</div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Missed Opportunity</div>
              <p className="text-xs text-slate-400 mt-2">Per exporter per year</p>
            </div>
          </div>

          {/* Real Example */}
          <div className="rounded-xl bg-white border border-slate-200 p-8 mb-12">
            <h4 className="font-semibold text-slate-900 mb-3">🏭 Real Industry Example</h4>
            <p className="text-slate-600 text-sm leading-relaxed">
              A mid-size textile exporter in Surat with 25 monthly shipments employs 2 full-time staff just for documentation. Each staff member spends 4 hours per shipment on HS code lookup, document preparation, and DGFT portal checking. That is 200 staff-hours/month. At ₹500/hour fully loaded cost, documentation alone costs ₹1 lakh/month. Additionally, they missed ₹3.2 lakhs in RoDTEP benefits last year because they did not track notification changes for their HS codes.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-900 p-8">
            <h3 className="text-white font-semibold mb-3">✅ Final Recommendation for ShipSync AI</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Quantify the problem with pilot customer data before investor meetings. Track: (1) time-per-shipment before/after ShipSync, (2) penalty/query reduction, (3) benefit discovery value. These 3 metrics become your core problem validation story.
            </p>
          </div>
        </div>
      </section>

      {/* 03 — SHIPSYNC */}
      <section id="shipsync" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">03 — ShipSync</div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">So What Exactly Are You Building?</h2>
          <p className="text-slate-500 text-lg mb-16 max-w-2xl">One intelligence layer that replaces fragmented export workflows with a connected AI experience.</p>

          {/* Product Story */}
          <div className="rounded-2xl bg-[#0B1121] p-8 mb-16 overflow-x-auto">
            <h3 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">The ShipSync Workflow</h3>
            <pre className="text-emerald-400 text-sm font-mono whitespace-pre leading-relaxed">
{`
    ┌─────────────────────────────────────────────────────────────┐
    │              SHIPSYNC AI — INTELLIGENCE LAYER               │
    ├─────────────────────────────────────────────────────────────┤
    │                                                             │
    │   INPUT          AI ENGINE              OUTPUT              │
    │                                                             │
    │  Product    ──▶  HS Code           ──▶  8-Digit Code      │
    │  Description     Classifier             + Confidence        │
    │                                                             │
    │  Export     ──▶  Benefit           ──▶  RoDTEP / MEIS     │
    │  History         Finder                 / FTA Alerts        │
    │                                                             │
    │  Buyer      ──▶  Document          ──▶  Invoice, PL,      │
    │  Details         Generator              SB, GR Form         │
    │                                                             │
    │  Documents  ──▶  Validator         ──▶  Mismatch Flags    │
    │                                                             │
    │  All Data   ──▶  Compliance        ──▶  Dashboard +       │
    │                  Dashboard              Alerts              │
    │                                                             │
    └─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  ICEGATE 2.0    │
                    │  DGFT Portal    │
                    │  Bank Portal    │
                    └─────────────────┘
`}
            </pre>
          </div>

          {/* Product Showcase */}
          <div className="mx-auto max-w-2xl mb-16">
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center"><span className="text-white text-lg">🚢</span></div>
                <div><div className="font-semibold text-slate-900">ShipSync AI</div><div className="text-xs text-slate-500">Export Intelligence</div></div>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="text-xs text-slate-500 mb-1">Product Description</div>
                  <div className="text-sm text-slate-900 font-medium">Electric AC induction motor, 3-phase, 5HP, 415V, cast iron body</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                    <div className="text-xs text-emerald-600 mb-1">Suggested HS Code</div>
                    <div className="text-2xl font-bold text-emerald-700">8501.51.10</div>
                    <div className="text-xs text-emerald-600 mt-1">AC motors, output &gt; 750W but ≤ 75kW</div>
                  </div>
                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                    <div className="text-xs text-blue-600 mb-1">Confidence</div>
                    <div className="text-2xl font-bold text-blue-700">94%</div>
                    <div className="w-full bg-blue-200 rounded-full h-2 mt-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: "94%" }} /></div>
                  </div>
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                  <div className="text-xs text-amber-700 mb-1">Potential Benefits</div>
                  <div className="text-sm text-amber-800">• RoDTEP: 2.5% of FOB value<br />• India-UAE CEPA: 0% duty (vs 5% MFN)</div>
                </div>
                <div className="rounded-xl bg-slate-100 p-4 flex items-center gap-3">
                  <span className="text-emerald-500 text-lg">✓</span>
                  <span className="text-sm font-medium text-slate-700">Compliance Check: Ready for ICEGATE submission</span>
                </div>
              </div>
            </div>
          </div>

          {/* Why ShipSync */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { title: "One Workflow", desc: "Information is connected instead of scattered. HS code → benefits → documents → validation in one continuous flow.", icon: "🔗" },
              { title: "AI-First", desc: "AI reduces repetitive research and interpretation. Fine-tuned on 50,000+ validated Indian export records for domain accuracy.", icon: "🧠" },
              { title: "Built for Export", desc: "Designed around the actual export workflow, not a generic document tool. Every feature maps to a real customs or DGFT requirement.", icon: "📦" },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl bg-white border border-slate-200 p-8 text-center hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Architecture */}
          <div className="rounded-2xl bg-[#0B1121] p-8 mb-12 overflow-x-auto">
            <h3 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">Technical Architecture</h3>
            <pre className="text-emerald-400 text-xs font-mono whitespace-pre leading-relaxed">
{`
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                       │
│  │   Next.js    │  │   React      │  │   Tailwind   │                       │
│  │   (App Rtr)  │  │   Components │  │   + shadcn   │                       │
│  └──────┬───────┘  └──────────────┘  └──────────────┘                       │
└─────────┼───────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Vercel Edge / AWS)                        │
│  • Rate Limiting  • JWT Auth  • SSL  • CORS  • Request Validation          │
└─────────────────────────────────────────────────────────────────────────────┘
          │
    ┌─────┴─────┬─────────────┬─────────────┐
    ▼           ▼             ▼             ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│  AI     │ │ Business│ │  Data   │ │ 3rd Party│
│Inference│ │ Logic   │ │ Layer   │ │  Integr  │
│Services │ │(Node.js)│ │         │ │         │
└────┬────┘ └─────────┘ └────┬────┘ └────┬────┘
     │                       │           │
┌────┴────┐            ┌─────┴─────┐ ┌───┴────┐
│Fine-tuned│            │PostgreSQL │ │ICEGATE │
│  LLM    │            │ (Users,   │ │ 2.0    │
│(Domain) │            │ Orders)   │ │  API   │
└─────────┘            ├───────────┤ ├────────┤
                       │ MongoDB   │ │ DGFT   │
                       │ (Docs,    │ │ Portal │
                       │  Logs)    │ │        │
                       ├───────────┤ └────────┘
                       │ Redis     │
                       │ (Cache)   │
                       └───────────┘

WHY THIS STACK?
• Next.js (App Router): SSR for SEO + API routes + Edge functions
  Alternative: React SPA — rejected because SEO matters for content marketing
• Fine-tuned LLM: 94% accuracy vs 60% for generic GPT-4 on Indian tariff
  Alternative: GPT-4 API — rejected because data leaves India + lower accuracy
• PostgreSQL + MongoDB: Relational for transactions, document for flexibility
  Alternative: Only MongoDB — rejected because ACID compliance needed for billing
• Redis: Sub-10ms caching for repeated HS code lookups
  Alternative: In-memory Node cache — rejected because does not scale horizontally
`}
            </pre>
          </div>

          {/* Best Practices + Mistakes */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="rounded-xl bg-red-50 border border-red-200 p-6">
              <h4 className="font-semibold text-red-900 mb-3">❌ Common Mistakes Building AI Export Tools</h4>
              <ul className="space-y-2 text-sm text-red-800">
                <li>• Using generic LLM without fine-tuning — fails on India's 8-digit codes</li>
                <li>• Building a document tool without HS code intelligence — misses the core problem</li>
                <li>• Ignoring ICEGATE XML schema — documents get rejected at upload</li>
                <li>• Storing export data outside India — violates DPDP Act and customer trust</li>
                <li>• No human-in-the-loop for high-stakes classifications — customs penalties are real</li>
              </ul>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6">
              <h4 className="font-semibold text-emerald-900 mb-3">✅ Best Practices for Production AI SaaS</h4>
              <ul className="space-y-2 text-sm text-emerald-800">
                <li>• Fine-tune on domain data (50K+ validated records minimum)</li>
                <li>• Always show confidence scores — never present AI output as absolute truth</li>
                <li>• Build feedback loops — user corrections improve the model</li>
                <li>• Host AI inference in India (AWS Mumbai / Azure Pune) for latency + compliance</li>
                <li>• Implement circuit breakers — if AI is uncertain, route to human expert</li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 p-8">
            <h3 className="text-white font-semibold mb-3">✅ Final Recommendation for ShipSync AI</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Build the HS Code Classifier first as your "wedge" — it is the highest-frequency, highest-pain problem. Validate 90%+ accuracy on 100 real products before adding document generation. The classifier alone can justify a ₹3,999/month price point if it replaces CHA queries.
            </p>
          </div>
        </div>
      </section>

      {/* 04 — BUSINESS */}
      <section id="business" className="scroll-mt-24 bg-slate-100/50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">04 — Business</div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How Does ShipSync Make Money?</h2>
          <p className="text-slate-500 text-lg mb-16 max-w-2xl">Multiple revenue streams from a single platform. Subscription-first, with usage and enterprise expansion.</p>

          {/* Business Model Visual */}
          <div className="rounded-2xl bg-[#0B1121] p-8 mb-16 overflow-x-auto">
            <h3 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">Revenue Model</h3>
            <pre className="text-emerald-400 text-sm font-mono whitespace-pre leading-relaxed">
{`
    ┌─────────────┐
    │   FREE      │  ← Entry. 5 HS lookups/month. Builds trust & waitlist.
    │  (Starter)  │     [CURRENT]
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │    PRO      │  ← Growth. ₹3,999/mo. Unlimited + documents + benefits.
    │   (Growth)  │     [CURRENT — Primary Revenue]
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │  BUSINESS   │  ← Scale. Custom limits, API, white-label.
    │ (Enterprise)│     [PLANNED — 6 months]
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │    API      │  ← Platform. Per-call pricing for ERP integrators.
    │  (Platform) │     [POTENTIAL — 12 months]
    └─────────────┘
`}
            </pre>
          </div>

          {/* Revenue Math */}
          <div className="rounded-2xl bg-white border border-slate-200 p-8 mb-16">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Simple Revenue Mathematics</h3>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-8">
              <div className="text-center"><div className="text-4xl font-bold text-slate-900">1,000</div><div className="text-sm text-slate-500 mt-1">Paying Customers</div></div>
              <div className="text-3xl text-slate-300">×</div>
              <div className="text-center"><div className="text-4xl font-bold text-slate-900">₹48,000</div><div className="text-sm text-slate-500 mt-1">Avg Annual Revenue</div></div>
              <div className="text-3xl text-slate-300">=</div>
              <div className="text-center"><div className="text-4xl font-bold text-emerald-700">₹4.8 Cr</div><div className="text-sm text-slate-500 mt-1">Annual Recurring Revenue</div></div>
            </div>
            <p className="text-center text-xs text-slate-400">Illustrative model only. Replace with validated assumptions.</p>
          </div>

          {/* Unit Economics + Model Comparison */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="rounded-xl bg-white border border-slate-200 p-8">
              <h4 className="font-semibold text-slate-900 mb-6">Unit Economics</h4>
              <div className="space-y-4">
                {[
                  ["Customer Acquisition Cost (CAC)", "₹25,000", "Illustrative blended India B2B SaaS acquisition cost"],
                   ["Average Revenue Per User (ARPU)", "₹48,000/year", "Illustrative blended annual revenue per customer"],
                   ["Gross Margin", "75%", "Target after AI inference + cloud + support costs"],
                   ["Lifetime Value (LTV)", "₹1,20,000", "Illustrative gross-profit-adjusted customer lifetime value"],
                ].map(([label, value, desc], i) => (
                  <div key={i} className="flex justify-between items-start pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                    <div><div className="text-sm font-medium text-slate-900">{label}</div><div className="text-xs text-slate-500 mt-0.5">{desc}</div></div>
                    <div className="text-sm font-bold text-slate-900 text-right">{value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-xl bg-slate-50 p-4 text-center">
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">LTV ÷ CAC Ratio</div>
                <div className="text-3xl font-bold text-emerald-700">4.8 : 1</div>
                <div className="text-xs text-slate-500 mt-1">Target: &gt;3:1 for healthy SaaS</div>
              </div>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-8">
              <h4 className="font-semibold text-slate-900 mb-6">Why SaaS Subscription Over Alternatives?</h4>
              <div className="space-y-4">
                {[
                  { model: "Subscription (Chosen)", why: "Predictable revenue, aligns with exporter's monthly workflow, easy to budget. Indian SMBs prefer fixed monthly costs over variable usage.", chosen: true },
                  { model: "Pay-Per-Document (Rejected)", why: "Creates billing anxiety. Exporters generate 4-6 docs per shipment — unpredictable costs discourage usage.", chosen: false },
                  { model: "Commission on Benefits (Rejected)", why: "Requires revenue visibility exporters resist sharing. Complex to verify. Feels like a tax, not a tool.", chosen: false },
                  { model: "Enterprise License Only (Rejected)", why: "Limits TAM. Indian export market is fragmented — 95% are SMEs. Need a self-serve bottom-up motion.", chosen: false },
                ].map((item, i) => (
                  <div key={i} className={`rounded-lg p-4 border ${item.chosen ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
                    <div className={`text-sm font-semibold ${item.chosen ? "text-emerald-900" : "text-slate-700"}`}>{item.model}</div>
                    <div className="text-xs text-slate-600 mt-1">{item.why}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Best Practices */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="rounded-xl bg-red-50 border border-red-200 p-6">
              <h4 className="font-semibold text-red-900 mb-3">❌ Common Mistakes in SaaS Business Model</h4>
              <ul className="space-y-2 text-sm text-red-800">
                <li>• Pricing too low to capture value — undermines growth and signals low quality</li>
                <li>• No annual plan — monthly churn is 2-3x higher than annual in Indian B2B</li>
                <li>• Ignoring GST invoicing — Indian enterprises require GST-compliant invoices</li>
                <li>• No usage limits on free tier — attracts tire-kickers who never convert</li>
                <li>• Building enterprise before product-market fit — burns cash on long sales cycles</li>
              </ul>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6">
              <h4 className="font-semibold text-emerald-900 mb-3">✅ Best Practices for Indian B2B SaaS</h4>
              <ul className="space-y-2 text-sm text-emerald-800">
                <li>• Offer annual at 20% discount — improves cash flow and reduces churn</li>
                <li>• Support UPI, NetBanking, credit cards — 70% of Indian B2B payments are non-card</li>
                <li>• Invoice with GST — mandatory for B2B buyers, builds trust</li>
                <li>• Track net revenue retention (NRR) — expansion revenue is cheaper than new logos</li>
                <li>• Target 80%+ gross margins by Year 2 — cloud costs should be &lt;20% of revenue</li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 p-8">
            <h3 className="text-white font-semibold mb-3">✅ Final Recommendation for ShipSync AI</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Start with a simple 2-tier model: Free (lead gen) + Growth (₹3,999/mo). Validate willingness-to-pay with 20 pilot customers before adding Enterprise. Track monthly churn religiously — Indian SMB SaaS churn averages 5-8%/month. Your goal is &lt;3% monthly churn by Month 6.
            </p>
          </div>
        </div>
      </section>

      {/* 05 — COMPETITION */}
      <section id="competition" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">05 — Competition</div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Won't Another Company Simply Do This?</h2>
          <p className="text-slate-500 text-lg mb-16 max-w-2xl">The competitive landscape is fragmented. No one connects the entire export workflow.</p>

          {/* Competitor Matrix */}
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden mb-16 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Capability</th>
                  <th className="px-6 py-4 text-center font-semibold">Govt Portals</th>
                  <th className="px-6 py-4 text-center font-semibold">Consultants</th>
                  <th className="px-6 py-4 text-center font-semibold">Generic AI</th>
                  <th className="px-6 py-4 text-center font-semibold">ERP Tools</th>
                  <th className="px-6 py-4 text-center font-semibold bg-emerald-800">ShipSync AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ["HS Classification", "Partial", "✓", "Limited", "−", "✓ AI-powered"],
                  ["DGFT Benefit Discovery", "Fragmented", "Ad-hoc", "−", "−", "✓ Real-time"],
                  ["Document Generation", "−", "✓ Manual", "−", "Partial", "✓ Auto + ICEGATE"],
                  ["Document Validation", "−", "Basic", "−", "−", "✓ 15 checkpoints"],
                  ["FTA Route Optimization", "−", "Limited", "−", "−", "✓ 13 FTAs"],
                  ["Connected Workflow", "−", "−", "−", "−", "✓ End-to-end"],
                  ["Export-Specific AI", "−", "−", "Generic", "−", "✓ Fine-tuned"],
                  ["Self-Serve Pricing", "Free", "₹2,000+/query", "Subscription", "Enterprise", "✓ SaaS tiers"],
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-6 py-3.5 font-medium text-slate-900">{row[0]}</td>
                    {row.slice(1).map((cell, j) => (
                      <td key={j} className={`px-6 py-3.5 text-center text-sm ${j === 4 ? "font-semibold text-emerald-700 bg-emerald-50/30" : "text-slate-600"}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Why ShipSync Can Win */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">🏆 Today's Advantage</h3>
              <div className="space-y-4">
                {[
                  { title: "Domain Focus", desc: "Built specifically around export workflows. Not a generic document tool with export features bolted on." },
                  { title: "Connected Workflow", desc: "HS code → benefits → documents → validation in one flow. Competitors solve one piece; we connect all." },
                  { title: "India-First", desc: "Fine-tuned on Indian tariff data, DGFT schemes, and ICEGATE schemas. Global tools don't understand India's 8-digit codes." },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl bg-white border border-slate-200 p-5">
                    <div className="font-semibold text-slate-900 text-sm">{item.title}</div>
                    <div className="text-slate-600 text-sm mt-1">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">🔮 Future Moat</h3>
              <div className="space-y-4">
                {[
                  { title: "Data + Feedback Loop", desc: "Every classification, correction, and document improves the model. Network effects compound over time." },
                  { title: "Platform Expansion", desc: "From classification → broader trade intelligence. API layer enables ERP integrations and ecosystem lock-in." },
                  { title: "Regulatory Relationships", desc: "Deep integration with ICEGATE and DGFT creates switching costs. New entrants need years to replicate." },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl bg-slate-100 border border-slate-200 p-5">
                    <div className="font-semibold text-slate-900 text-sm">{item.title}</div>
                    <div className="text-slate-600 text-sm mt-1">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Moat Architecture */}
          <div className="rounded-2xl bg-[#0B1121] p-8 mb-12 overflow-x-auto">
            <h3 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">Defensibility Over Time</h3>
            <pre className="text-emerald-400 text-sm font-mono whitespace-pre leading-relaxed">
{`
    Year 1              Year 2              Year 3              Year 5
    ┌─────────┐        ┌─────────┐        ┌─────────┐        ┌─────────┐
    │ Product │   →    │  Data   │   →    │ Network │   →    │Platform │
    │  Moat   │        │  Moat   │        │ Effects │        │  Moat   │
    └─────────┘        └─────────┘        └─────────┘        └─────────┘
         │                  │                  │                  │
         ▼                  ▼                  ▼                  ▼
    • Fine-tuned       • 100K+            • Community        • API Ecosystem
      AI models          validated            of exporters     • ERP Plugins
    • ICEGATE            classifications    • Shared           • CHA Network
      integration      • Feedback loop      benefit data       • Global
                         • Proprietary        • Peer             Expansion
                         tariff DB            benchmarks
`}
            </pre>
          </div>

          <div className="rounded-2xl bg-slate-900 p-8">
            <h3 className="text-white font-semibold mb-3">✅ Final Recommendation for ShipSync AI</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Don't compete on features — compete on workflow integration. A competitor can copy your HS classifier in 6 months, but they can't copy 2 years of validated classifications, DGFT relationships, and exporter trust. Focus on data accumulation and network effects from Day 1.
            </p>
          </div>
        </div>
      </section>

      {/* 06 — GROWTH */}
      <section id="growth" className="scroll-mt-24 bg-slate-100/50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">06 — Growth</div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How Big Can This Become?</h2>
          <p className="text-slate-500 text-lg mb-16 max-w-2xl">From a point solution to a platform. From India to global trade intelligence.</p>

          {/* Beachhead */}
          <div className="rounded-2xl bg-white border border-slate-200 p-8 mb-12">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Beachhead: First Customer Segment</h3>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { label: "Segment", value: "Indian Export SMEs" },
                { label: "Volume", value: "10+ shipments/month" },
                { label: "Pain", value: "High compliance burden" },
                { label: "WTP", value: "High (saves ₹5L+/year)" },
              ].map((item, i) => (
                <div key={i} className="rounded-xl bg-slate-50 p-5 text-center">
                  <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">{item.label}</div>
                  <div className="text-lg font-bold text-slate-900">{item.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <p className="text-sm text-emerald-800">
                <strong>Why this segment?</strong> They have enough volume to feel the pain, limited budget for full-time CHAs, and are tech-curious enough to try SaaS. Enterprise exporters already have dedicated compliance teams — harder to displace initially.
              </p>
            </div>
          </div>

          {/* Go-to-Market */}
          <div className="rounded-2xl bg-[#0B1121] p-8 mb-12 overflow-x-auto">
            <h3 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">Go-to-Market</h3>
            <pre className="text-emerald-400 text-sm font-mono whitespace-pre leading-relaxed">
{`
    ┌───────────┐     ┌─────────────────────────────┐     ┌───────────┐
    │ Exporter  │────▶│ Content / SEO / LinkedIn    │────▶│  Demo /   │
    │ (Aware)   │     │ • HS Code guides            │     │  Free     │
    └───────────┘     │ • RoDTEP explainers         │     │  Trial    │
                      │ • Export compliance tips    │     └─────┬─────┘
                      └─────────────────────────────┘           │
                                                                  ▼
                      ┌─────────────────────────────┐     ┌───────────┐
                      │ Outbound / Partnerships     │     │  Paid     │
                      │ • EPC tie-ups               │────▶│  Growth   │
                      │ • CHA referrals             │     │  Plan     │
                      │ • Trade show presence       │     └─────┬─────┘
                      └─────────────────────────────┘           │
                                                                  ▼
                                                          ┌───────────┐
                                                          │ Expansion │
                                                          │ • More HS │
                                                          │ • More    │
                                                          │   users   │
                                                          └─────┬─────┘
                                                                │
                                                                ▼
                                                          ┌───────────┐
                                                          │ Enterprise│
                                                          │ (Custom)  │
                                                          └───────────┘
`}
            </pre>
          </div>

          {/* Expansion */}
          <div className="rounded-2xl bg-white border border-slate-200 p-8 mb-12">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Product Expansion Roadmap</h3>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {["HS Code", "Benefits", "Documents", "FTA", "Compliance", "Enterprise", "API", "Global Trade"].map((item, i) => (
                <div key={item} className="flex items-center gap-3">
                  <div className={`rounded-full px-5 py-2.5 text-sm font-semibold ${i < 3 ? "bg-emerald-100 text-emerald-800" : i < 6 ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"}`}>{item}</div>
                  {i < 7 && <span className="text-slate-300 text-xl">→</span>}
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-center gap-6 text-xs">
              <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-200" /> Year 1</span>
              <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-blue-200" /> Year 2</span>
              <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-slate-200" /> Year 3+</span>
            </div>
          </div>

          {/* Growth Math */}
          <div className="rounded-2xl bg-white border border-slate-200 p-8 mb-12">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Growth Mathematics</h3>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-4 text-2xl md:text-3xl font-bold text-slate-900">
                <span>Customers</span><span className="text-slate-300">×</span><span>ARPU</span><span className="text-slate-300">×</span><span>Retention</span><span className="text-slate-300">=</span><span className="text-emerald-700">Recurring Revenue</span>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { year: "Year 1", customers: "500", arpu: "₹48,000", revenue: "₹2.4 Cr" },
                { year: "Year 2", customers: "2,000", arpu: "₹52,000", revenue: "₹10.4 Cr" },
                { year: "Year 3", customers: "5,000", arpu: "₹60,000", revenue: "₹30 Cr" },
              ].map((y) => (
                <div key={y.year} className="rounded-xl bg-slate-50 p-6 text-center">
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">{y.year}</div>
                  <div className="space-y-3">
                    <div><div className="text-2xl font-bold text-slate-900">{y.customers}</div><div className="text-xs text-slate-500">Customers</div></div>
                    <div><div className="text-xl font-bold text-slate-700">{y.arpu}</div><div className="text-xs text-slate-500">ARPU</div></div>
                    <div className="pt-3 border-t border-slate-200"><div className="text-xl font-bold text-emerald-700">{y.revenue}</div><div className="text-xs text-slate-500">Revenue</div></div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-slate-400 mt-4">Illustrative 3-year model. Replace with validated projections.</p>
          </div>

          <div className="rounded-2xl bg-slate-900 p-8">
            <h3 className="text-white font-semibold mb-3">✅ Final Recommendation for ShipSync AI</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Focus on one acquisition channel for 6 months (content SEO for "HS code" queries) before diversifying. Indian B2B SaaS companies that try 5 channels at once burn out. Master one, then add outbound. Target 100 paying customers by Month 12 as your first milestone.
            </p>
          </div>
        </div>
      </section>

      {/* 07 — INVESTMENT */}
      <section id="investment" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">07 — Investment</div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Should I Invest?</h2>
          <p className="text-slate-500 text-lg mb-16 max-w-2xl">The investment thesis, funding ask, and what capital unlocks.</p>

          {/* Investment Thesis */}
          <div className="grid md:grid-cols-5 gap-4 mb-16">
            {[
              { num: "01", title: "Large Market", desc: "Global trade is a $30T+ market. Indian exports alone exceed $450B annually." },
              { num: "02", title: "Real Problem", desc: "Exporters lose hours and money to fragmented, manual compliance every single day." },
              { num: "03", title: "AI Timing", desc: "LLMs are now accurate enough for domain-specific tasks. The window is open." },
              { num: "04", title: "Platform Path", desc: "From HS codes to full trade intelligence. Clear expansion beyond point solution." },
              { num: "05", title: "Large Upside", desc: "First-mover in AI export compliance for India. Global expansion potential." },
            ].map((t) => (
              <div key={t.num} className="rounded-2xl bg-white border border-slate-200 p-6 text-center hover:shadow-lg transition-shadow">
                <div className="text-4xl font-bold text-slate-100 mb-3">{t.num}</div>
                <h3 className="font-bold text-slate-900 mb-2">{t.title}</h3>
                <p className="text-slate-600 text-xs leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>

          {/* Funding Ask */}
          <div className="rounded-2xl bg-[#0B1121] p-8 mb-12 text-center">
            <div className="text-sm text-slate-400 uppercase tracking-wider mb-2">Raising</div>
            <div className="text-5xl md:text-6xl font-bold text-white mb-4">₹3 Cr</div>
            <div className="text-slate-400">Pre-Seed / Seed Round</div>
            <p className="text-slate-500 text-sm mt-4 max-w-xl mx-auto">Seed round to accelerate product development, market validation, customer acquisition and enterprise readiness across the Indian export ecosystem.</p>
          </div>

          {/* Use of Funds + Milestones */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="rounded-xl bg-white border border-slate-200 p-8">
              <h3 className="font-bold text-slate-900 mb-6">Use of Funds</h3>
              <div className="space-y-4">
                {[
                  { label: "Product & Engineering", pct: "40%", desc: "AI model improvement, ICEGATE integration, platform scaling" },
                  { label: "Go-to-Market", pct: "25%", desc: "Content, SEO, partnerships, outbound sales" },
                  { label: "Domain & Compliance", pct: "15%", desc: "Trade expertise, compliance, data acquisition" },
                  { label: "Infrastructure", pct: "10%", desc: "Cloud, security and platform reliability" },
                  { label: "Operations", pct: "10%", desc: "Team, administration and business operations" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-16 text-right"><span className="text-lg font-bold text-slate-900">{item.pct}</span></div>
                    <div className="flex-1">
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${20 + i * 15}%` }} /></div>
                      <div className="flex justify-between mt-1"><span className="text-sm font-medium text-slate-900">{item.label}</span><span className="text-xs text-slate-500">{item.desc}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-8">
              <h3 className="font-bold text-slate-900 mb-6">What Investment Unlocks</h3>
              <div className="rounded-2xl bg-[#0B1121] p-6 mb-6 overflow-x-auto">
                <pre className="text-emerald-400 text-xs font-mono whitespace-pre leading-relaxed">
{`
    CAPITAL
       │
       ▼
    PRODUCT DEVELOPMENT
       │
       ▼
    CUSTOMER ACQUISITION
       │
       ▼
    VALIDATION
       │
       ▼
    REVENUE
       │
       ▼
    SCALE
`}
                </pre>
              </div>
              <div className="space-y-3">
                {[
                  { metric: "500+ paying customers", timeline: "Month 6" },
                  { metric: "₹4.8 Cr ARR run-rate", timeline: "Month 12" },
                  { metric: "3+ key trade integrations", timeline: "Month 9" },
                  { metric: "25,000+ documents processed", timeline: "Month 12" },
                ].map((m, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                    <span className="text-sm font-medium text-slate-900">{m.metric}</span>
                    <span className="text-xs text-slate-500">{m.timeline}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="rounded-2xl bg-emerald-900 p-8 md:p-12 text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Interested in the Opportunity?</h3>
            <p className="text-emerald-100 max-w-xl mx-auto mb-8">Let's discuss the market, product and vision behind ShipSync AI.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="mailto:investors@shipsync.ai" className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors">Talk to the Founders</a>
              <a href="mailto:investors@shipsync.ai?subject=Investor%20Deck%20Request" className="rounded-full border border-emerald-400 px-8 py-3 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors">Request Investor Deck</a>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 p-8">
            <h3 className="text-white font-semibold mb-3">✅ Final Recommendation for ShipSync AI</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Raise enough to reach 18 months of runway with 6 months of buffer. For a pre-seed/seed round in Indian B2B SaaS, this typically means ₹2-5 Cr depending on team size and burn rate. Use 70% of funds for product + GTM, 30% for operations. Do not raise more than you need — dilution matters, but running out of cash kills the company.
            </p>
          </div>
        </div>
      </section>

      {/* ========== DEEP DIVE ========== */}
      <section className="bg-slate-100/50 border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Want the Details?</h2>
          <p className="text-slate-500 mb-8">Expandable deep-dive sections for investors who want more.</p>

          <div className="space-y-3">
            {[
              { id: "market", title: "Detailed Market Sources & Methodology", content: "ShipSync's market opportunity is based on the growing complexity of international trade, export compliance and the need for specialized trade intelligence. The main research areas are Indian exporter activity, global trade volume, export documentation workflows, HS classification and trade-benefit discovery. Market figures shown on this page should be treated as either reported data or clearly labelled company estimates. Final investor materials should cite DGFT, Ministry of Commerce, WTO and other primary sources for every major market number." },
              { id: "financial", title: "Financial Assumptions & Model", content: "Current working model: ₹48,000 illustrative annual revenue per customer, ₹25,000 illustrative CAC, 75% target gross margin and ₹1.20L illustrative customer lifetime value. The current model uses 500 customers in Year 1, 2,000 in Year 2 and 5,000 in Year 3, with illustrative revenue of ₹2.4 Cr, ₹10.4 Cr and ₹30 Cr respectively. These are planning assumptions, not achieved results or guaranteed forecasts, and should be replaced with validated customer, pricing and retention data as ShipSync scales." },
              { id: "competitive", title: "Competitive Research Deep-Dive", content: "ShipSync operates in a fragmented ecosystem rather than competing with one single product category. Alternatives include government portals, export consultants, trade-information platforms, ERP systems, logistics platforms and generic AI tools. The opportunity is to connect classification, trade benefits, documentation, FTA intelligence and compliance into one exporter-focused workflow. Competitive claims should always be based on publicly verifiable product capabilities and pricing. ShipSync's potential long-term advantage is workflow depth, domain-specific data and accumulated customer feedback rather than simply using AI." },
              { id: "roadmap", title: "Product Roadmap (12-Month)", content: "The initial 12-month focus should be product validation and repeatable customer adoption. Priority areas: strengthen AI-assisted HS classification, expand export-benefit intelligence, improve document workflows, develop key trade-system integrations, strengthen compliance and security, and build analytics for exporters. The business objective is to move from a useful point solution toward a connected export-intelligence platform. Specific integration dates and hiring commitments should be added only after they are approved internally." },
              { id: "risk", title: "Risk Analysis & Mitigation", content: "Key risks include AI classification errors, regulatory or policy changes, slow customer adoption, competition from established trade platforms, customer acquisition cost, dependence on third-party data or integrations, and limited early-stage traction. Mitigation should include confidence scoring, human review for high-risk recommendations, source traceability, regular rule and data updates, controlled product expansion, diversified acquisition channels and measurable customer validation before aggressive scaling." },
              { id: "deck", title: "Full Investor Deck (PDF)", content: "The full investor deck should provide the deeper material behind this website: company vision, problem, market research, product walkthrough, business model, competitive landscape, traction or validation, go-to-market strategy, financial model, roadmap, funding requirement, use of funds, team, risks and investment thesis. The website is the short version; the investor deck should contain the detailed evidence and assumptions used to support the investment discussion." },
            ].map((item) => (
              <div key={item.id} className="rounded-xl bg-white border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setDeepDiveOpen(deepDiveOpen === item.id ? null : item.id)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900">{item.title}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-slate-400 transition-transform ${deepDiveOpen === item.id ? "rotate-180" : ""}`}>
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {deepDiveOpen === item.id && (
                  <div className="px-6 pb-6">
                    <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 rounded-lg p-4">{item.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
