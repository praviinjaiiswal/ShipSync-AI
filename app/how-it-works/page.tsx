"use client";

import { useState } from "react";

export default function HowItWorksPage() {
  const [step, setStep] = useState(1);

  const steps = [
    {
      num: "01",
      title: "Describe",
      icon: "📤",
      desc: "Upload your product catalog or simply describe the item in plain English.",
      detail: `You don't need to know HS codes or export jargon. Just type:

  "Handwoven silk saree, 6.5 meters, pure mulberry silk,
   zari border, made in Varanasi"

Or upload your entire product catalog as a CSV/Excel file.
ShipSync AI accepts:
  • Plain English descriptions
  • Technical spec sheets (PDF)
  • Existing catalogs (CSV, Excel, JSON)
  • Product images (AI extracts visual features)`,
      tech: "NLP + OCR + Vision Models",
      why: "Eliminates the need for export expertise at data entry stage. Your warehouse staff or sales team can input data without training.",
      ascii: `
┌─────────────────────────────────────────┐
│  INPUT METHODS                          │
├─────────────────────────────────────────┤
│  📝 Plain Text     ────────▶  NLP Parser│
│  📄 PDF/Specs      ────────▶  OCR Engine│
│  📊 CSV/Excel      ────────▶  Data Mapper│
│  🖼️  Product Image  ────────▶  Vision AI │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  STRUCTURED PRODUCT PROFILE             │
│  • Product Name                         │
│  • Material Composition                 │
│  • Dimensions / Weight                  │
│  • Manufacturing Process                │
│  • End-Use Category                     │
└─────────────────────────────────────────┘`,
      example: "A ceramics exporter in Khurja uploads 200 product images. The Vision AI identifies: material (stoneware/clay), glaze type, dimensions, and decorative technique. This creates structured profiles for all 200 items in under 10 minutes — work that would take a human 2 full days.",
      mistakes: [
        "Vague descriptions like 'machine parts' — AI needs material, dimensions, end-use",
        "Uploading low-resolution images where texture can't be identified",
        "Mixing multiple products in one description",
      ],
      bestPractices: [
        "Use consistent naming conventions across your catalog",
        "Include material percentages (e.g., '80% cotton, 20% polyester')",
        "For machinery, mention HS code chapter if known (helps AI narrow search)",
      ],
    },
    {
      num: "02",
      title: "Classify",
      icon: "🧠",
      desc: "AI suggests the exact 8-digit HS code with a confidence score and alternatives.",
      detail: `The AI doesn't just keyword-match. It understands:

  • Product composition and material hierarchy
  • Manufacturing process (woven vs knitted vs molded)
  • End-use (industrial vs consumer vs medical)
  • India's specific 8-digit tariff extensions (not just global 6-digit)

Output includes:
  • Primary HS Code (8 digits)
  • Confidence Score (0-100%)
  • Alternative codes (2nd and 3rd best matches)
  • Duty rate (Basic Customs Duty + IGST)
  • DGFT scheme eligibility (RoDTEP, MEIS, FTA)`,
      tech: "Fine-tuned LLM + Tariff Embedding Database",
      why: "Generic AI (ChatGPT, Claude) knows global HS codes but fails on India's 8-digit extensions and DGFT-specific classifications. We fine-tuned on 50,000+ validated Indian export records.",
      ascii: `
┌─────────────────────────────────────────┐
│  CLASSIFICATION ENGINE                  │
├─────────────────────────────────────────┤
│                                         │
│  Input: "Cotton woven fabric, dyed"     │
│                                         │
│  Step 1: Material Analysis             │
│    ├─ Fiber: 100% Cotton               │
│    ├─ Process: Woven                   │
│    └─ Finish: Dyed                     │
│                                         │
│  Step 2: Chapter Mapping (50-63)       │
│    ├─ Ch 52: Cotton                    │
│    ├─ Ch 54: Man-made filaments  ❌    │
│    └─ Ch 55: Man-made staple   ❌      │
│                                         │
│  Step 3: 8-Digit Resolution            │
│    ├─ 5208: Woven cotton fabrics >85% │
│    ├─ .52: Dyed                         │
│    └─ .90: Other (200 GSM)              │
│                                         │
│  RESULT: 5208.52.90  (Confidence: 97%) │
└─────────────────────────────────────────┘`,
      example: "An exporter of 'stainless steel kitchen sinks' was using HS code 7324.10 (sanitary ware) paying 15% BCD. ShipSync AI correctly classified it under 7324.29 (other household articles) at 10% BCD — saving ₹3.2 lakhs annually on ₹64 lakh exports.",
      mistakes: [
        "Accepting AI output without checking confidence score",
        "Not reviewing alternative codes — sometimes the 2nd match is correct for specific use-cases",
        "Ignoring 'mixed materials' rules — HS code depends on the predominant material by weight",
      ],
      bestPractices: [
        "Always verify codes below 90% confidence with your CHA",
        "Check the 'DGFT Scheme' column — some codes have restricted benefits",
        "Re-run classification if you change product specifications",
      ],
    },
    {
      num: "03",
      title: "Optimize",
      icon: "📈",
      desc: "Discover applicable DGFT schemes, RoDTEP rates, and optimal FTA routes.",
      detail: `Optimization happens across 3 dimensions simultaneously:

  1. DUTY OPTIMIZATION
     • Compare MFN vs FTA vs Preferential rates
     • Calculate landed cost under each scenario
     • Check Rules of Origin compliance

  2. BENEFIT MAXIMIZATION
     • Match your HS codes to active DGFT schemes
     • Calculate RoDTEP/MEIS rates as % of FOB
     • Alert on new notifications affecting your products

  3. ROUTE OPTIMIZATION
     • Direct vs transshipment analysis
     • Port selection (Mundra vs JNPT vs Chennai)
     • Shipping line recommendations`,
      tech: "Rules Engine + Graph DB + Notification Parser",
      why: "DGFT rules change weekly. A static database is obsolete in 7 days. Our notification parser reads DGFT circulars within 24 hours and updates the rules engine automatically.",
      ascii: `
┌─────────────────────────────────────────┐
│  OPTIMIZATION MATRIX                    │
├─────────────────────────────────────────┤
│                                         │
│  Product: Brake Pads (HS 8708.30)       │
│  Destination: Thailand                  │
│  FOB Value: ₹50,00,000                  │
│                                         │
│  ┌─────────────┬──────────┬───────────┐ │
│  │ Route       │ Duty     │ Net Cost  │ │
│  ├─────────────┼──────────┼───────────┤ │
│  │ MFN (no FTA)│ 20%      │ ₹60,00,000│ │
│  │ India-ASEAN │ 0%       │ ₹50,00,000│ │◀── BEST
│  │ RCEP        │ 5%       │ ₹52,50,000│ │
│  └─────────────┴──────────┴───────────┘ │
│                                         │
│  SAVINGS: ₹10,00,000 (20% of FOB)       │
│  REQUIREMENT: Form AI COO + 40% VA      │
└─────────────────────────────────────────┘`,
      example: "A pharmaceutical exporter to Brazil was paying 14% MFN duty. ShipSync AI discovered the India-MERCOSUR PTA reduced this to 10% for their HS code, but required a specific 'Certificate of Origin Form I' issued before shipment. The exporter saved ₹7 lakhs on a ₹1.75 crore order.",
      mistakes: [
        "Optimizing only for duty — sometimes faster delivery (higher duty route) wins the repeat order",
        "Not accounting for COO issuance time (can take 3-5 days)",
        "Forgetting that FTA benefits require maintaining direct consignment proof",
      ],
      bestPractices: [
        "Run optimization BEFORE quoting to buyer — include duty savings in your pricing strategy",
        "Maintain a 'FTA playbook' per destination with required documents",
        "Set calendar reminders for COO application deadlines",
      ],
    },
    {
      num: "04",
      title: "Generate",
      icon: "📋",
      desc: "Auto-create ICEGATE-ready shipping bills, invoices, and packing lists.",
      detail: `Document generation pulls data from Steps 1-3 and creates:

  • Commercial Invoice (with HSN, correct Incoterms)
  • Packing List (net/gross weight, dimensions, marks & numbers)
  • Shipping Bill (SB) in ICEGATE 2.0 XML format
  • GR Form (for RBI compliance)
  • Certificate of Origin draft (if FTA route selected)

All documents are cross-validated before generation.
The system flags mismatches in:
  • Values (Invoice vs SB vs BRC)
  • Weights (Packing List vs B/L)
  • Quantities (across all documents)
  • Buyer names and addresses`,
      tech: "Template Engine + Validation Rules + ICEGATE Schema",
      why: "ICEGATE 2.0 has strict XML schemas. Manual entry errors cause rejection. Our template engine ensures 100% schema compliance, while validation rules catch logical errors humans miss.",
      ascii: `
┌─────────────────────────────────────────┐
│  DOCUMENT GENERATION PIPELINE         │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Product  │  │ Buyer    │  │ Bank   │ │
│  │ Data     │  │ Details  │  │ Info   │ │
│  └────┬─────┘  └────┬─────┘  └───┬────┘ │
│       │             │            │      │
│       └─────────────┴────────────┘      │
│                     │                   │
│                     ▼                   │
│       ┌─────────────────────┐           │
│       │  AI Document        │           │
│       │  Generator          │           │
│       │  (Templates +       │           │
│       │   ICEGATE Schema)    │           │
│       └──────────┬──────────┘           │
│                  │                      │
│       ┌──────────┴──────────┐           │
│       ▼                     ▼           │
│  ┌─────────┐           ┌─────────┐      │
│  │VALIDATOR│           │ HUMAN   │      │
│  │(Auto)   │──────────▶│ REVIEW  │      │
│  └─────────┘  Flags    └─────────┘      │
│               if issues                   │
│                     │                   │
│                     ▼                   │
│              ┌─────────────┐            │
│              │ ICEGATE XML │            │
│              │ UPLOAD      │            │
│              └─────────────┘            │
└─────────────────────────────────────────┘`,
      example: "An exporter generates documents for a ₹25 lakh machinery shipment to Kenya. The system auto-fills: Invoice with HSN 8459.61.90, Packing List with crate dimensions, Shipping Bill with port Mundra and scheme RoDTEP, and GR Form with AD bank details. Validation catches that the B/L number is missing — user adds it before upload. Total time: 8 minutes vs. 4 hours manually.",
      mistakes: [
        "Uploading to ICEGATE without human review — AI can hallucinate bank details",
        "Not updating master data (buyer address, bank account) when changes occur",
        "Forgetting that some destinations need additional docs (fumigation, pre-shipment inspection)",
      ],
      bestPractices: [
        "Always review buyer and bank details — these change most frequently",
        "Use 'master data' feature to store recurring buyer profiles",
        "Download documents in both PDF (for records) and XML (for ICEGATE)",
      ],
    },
  ];

  const current = steps[step - 1];

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-700 mb-6">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            4-Step Export Workflow
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-slate-900">
            One Intelligence Layer for<br />
            <span className="text-slate-400">Your Entire Export Workflow.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            From product description to ICEGATE submission — ShipSync AI handles the complexity so you focus on growing your business.
          </p>
        </div>
      </section>

      {/* High-Level Flow */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">The Complete Data Flow</h2>
        <div className="rounded-2xl bg-slate-900 p-8 overflow-x-auto">
          <pre className="text-emerald-400 text-xs md:text-sm font-mono leading-relaxed whitespace-pre">
{`
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   STEP 01   │     │   STEP 02   │     │   STEP 03   │     │   STEP 04   │
│  DESCRIBE   │────▶│  CLASSIFY   │────▶│  OPTIMIZE   │────▶│  GENERATE   │
│             │     │             │     │             │     │             │
│ Product     │     │ AI HS Code  │     │ DGFT Scheme │     │ ICEGATE     │
│ Catalog     │     │ Suggestion  │     │ + FTA Route │     │ Documents   │
│             │     │             │     │             │     │             │
│ Input:      │     │ Output:     │     │ Output:     │     │ Output:     │
│ Text/PDF/   │     │ 8-Digit HS  │     │ Duty Rate   │     │ Invoice,    │
│ Image/CSV   │     │ + Confidence│     │ + Benefits  │     │ SB, PL, GR  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       └───────────────────┴───────────────────┴───────────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │   COMPLIANCE DASHBOARD      │
                    │   (Live Tracking + Alerts)  │
                    └─────────────────────────────┘
`}
          </pre>
        </div>
      </section>

      {/* Step Navigation */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => setStep(i + 1)}
              className={`rounded-xl p-6 text-left transition-all border ${
                step === i + 1
                  ? "bg-slate-900 text-white border-slate-900 shadow-xl scale-105"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${step === i + 1 ? "text-emerald-400" : "text-slate-400"}`}>
                Step {s.num}
              </div>
              <div className="font-semibold">{s.title}</div>
            </button>
          ))}
        </div>

        {/* Step Detail */}
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{current.icon}</span>
                <div>
                  <div className="text-sm font-bold text-emerald-600 uppercase tracking-wider">Step {current.num}</div>
                  <h2 className="text-3xl font-bold text-slate-900">{current.title}</h2>
                </div>
              </div>
              <p className="text-lg text-slate-600 leading-relaxed">{current.desc}</p>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-3">What Happens Under the Hood</h3>
              <pre className="text-slate-700 text-sm font-mono whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-lg p-4">
                {current.detail}
              </pre>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-100 p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Technology Stack</div>
                <div className="text-sm font-medium text-slate-900">{current.tech}</div>
              </div>
              <div className="rounded-xl bg-slate-100 p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Why This Matters</div>
                <div className="text-sm font-medium text-slate-900">{current.why}</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl bg-slate-900 p-6 overflow-x-auto">
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Architecture Detail</h3>
              <pre className="text-emerald-400 text-xs font-mono whitespace-pre leading-relaxed">
                {current.ascii}
              </pre>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-3">🏭 Real Industry Example</h3>
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
                Implement <strong className="text-white">Step {current.num}: {current.title}</strong> with a 2-week pilot on 5-10 shipments. Track metrics: time-per-shipment, error rate, and team adoption. Use the pilot data to build internal SOPs before rolling out to the full team. Document what works and what needs customization for your product category.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* System Architecture */}
      <section className="bg-white border-t border-slate-200 mt-16">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">ShipSync AI System Architecture</h2>
          <p className="text-slate-500 mb-8">How all components connect in production.</p>

          <div className="rounded-2xl bg-slate-900 p-8 overflow-x-auto">
            <pre className="text-emerald-400 text-xs md:text-sm font-mono leading-relaxed whitespace-pre">
{`
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Web App    │  │   Mobile     │  │   API        │  │   ICEGATE    │     │
│  │   (Next.js)  │  │   (PWA)      │  │   Clients    │  │   Plugin     │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │                  │
          └──────────────────┴──────────────────┴──────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY (AWS API GW / Vercel Edge)              │
│  • Rate Limiting  • Auth (JWT)  • SSL Termination  • DDoS Protection       │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          ▼                          ▼                          ▼
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│  AI INFERENCE   │        │  BUSINESS LOGIC │        │  DATA LAYER     │
│  SERVICES       │        │  (Node/Python)  │        │                 │
│                 │        │                 │        │  ┌───────────┐   │
│  ┌───────────┐  │        │  • HS Code      │        │  │ PostgreSQL│   │
│  │ LLM Core  │  │        │    Rules Engine │        │  │ (Users,   │   │
│  │ (Fine-    │  │        │  • Document     │        │  │  Orders)  │   │
│  │  tuned)   │  │        │    Templates    │        │  └───────────┘   │
│  └───────────┘  │        │  • DGFT Parser  │        │  ┌───────────┐   │
│  ┌───────────┐  │        │  • FTA Matcher  │        │  │ MongoDB   │   │
│  │ Vision    │  │        │  • Validator    │        │  │ (Docs,    │   │
│  │ Model     │  │        │                 │        │  │  Logs)    │   │
│  └───────────┘  │        └─────────────────┘        │  └───────────┘   │
│  ┌───────────┐  │                                 │  ┌───────────┐   │
│  │ OCR/NLP   │  │                                 │  │ Redis     │   │
│  │ Pipeline  │  │                                 │  │ (Cache,   │   │
│  └───────────┘  │                                 │  │  Sessions)│   │
└─────────────────┘                                 │  └───────────┘   │
                                                    └─────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      THIRD-PARTY INTEGRATIONS                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ ICEGATE  │  │ DGFT     │  │ Payment  │  │ Email/   │  │ Cloud    │      │
│  │ 2.0 API  │  │ Portal   │  │ Gateway  │  │ WhatsApp │  │ Storage  │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
`}
            </pre>
          </div>

          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-5">
              <h4 className="font-semibold text-slate-900 mb-2">Why Next.js + Vercel?</h4>
              <p className="text-sm text-slate-600">Next.js gives us SSR for SEO (critical for content marketing), API routes for serverless backend, and Edge functions for low-latency AI inference. Vercel deploys globally in seconds with zero DevOps overhead.</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-5">
              <h4 className="font-semibold text-slate-900 mb-2">Why PostgreSQL + MongoDB?</h4>
              <p className="text-sm text-slate-600">PostgreSQL handles structured relational data (users, subscriptions, transactions) with ACID compliance. MongoDB stores unstructured documents (AI outputs, DGFT notifications, export records) with flexible schema evolution.</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-5">
              <h4 className="font-semibold text-slate-900 mb-2">Why Fine-tuned LLM vs. API?</h4>
              <p className="text-sm text-slate-600">Generic LLMs (GPT-4, Claude) don't know India's 8-digit tariff lines or DGFT-specific classifications. A fine-tuned model on 50K+ validated records gives 94%+ accuracy vs. 60% from generic models. Also: data stays in India, no third-party training.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-8">Security & Compliance Architecture</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="rounded-xl bg-white border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Data Protection Layers</h3>
            <pre className="text-slate-700 text-xs font-mono whitespace-pre bg-slate-50 rounded-lg p-4">
{`
Layer 1: Transport    │  TLS 1.3 (End-to-End Encryption)
Layer 2: At Rest      │  AES-256 (Database + Storage)
Layer 3: Application  │  RBAC + MFA + API Key Rotation
Layer 4: Network      │  VPC + WAF + DDoS Protection
Layer 5: Audit        │  Immutable Logs + 7-Year Retention
Layer 6: Compliance   │  DPDP Act 2023 + IT Act 2000
`}
            </pre>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Compliance Checklist</h3>
            <div className="space-y-3">
              {[
                ["DPDP Act 2023", "Consent management, data principal rights, grievance officer"],
                ["IT Act 2000 (Sec 79)", "Intermediary guidelines, content moderation, takedown"],
                ["SPDI Rules 2011", "Reasonable security practices, privacy policy, data retention"],
                ["Customs Act 1962", "Export record retention (5 years), audit trail"],
                ["GST Act 2017", "Invoice compliance, tax record retention (8 years)"],
                ["RBI/FEMA", "GR form compliance, AD bank integration"],
              ].map(([act, req], i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                  <div>
                    <div className="text-sm font-medium text-slate-900">{act}</div>
                    <div className="text-xs text-slate-500">{req}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
