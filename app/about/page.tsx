"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#F8F9FC] text-slate-900">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0B1121]">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-4 py-1.5 text-sm font-medium text-slate-300 mb-8">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            About ShipSync AI
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
            Built by Exporters,<br />
            <span className="text-slate-400">for Exporters.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 leading-relaxed">
            We started ShipSync AI because we watched family businesses lose lakhs to compliance errors — and knew AI could fix it.
          </p>
        </div>
      </section>

      {/* OUR STORY */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Our Story</div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Why We Exist</h2>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                ShipSync AI was born in [City], India, when our founders — [Founder Name] and [Co-founder Name] — spent months helping their family's textile export business navigate compliance.
              </p>
              <p>
                The same story repeated everywhere: exporters spending 4+ hours per shipment on paperwork, paying CHAs ₹2,000+ per HS code query, and missing DGFT benefits simply because notifications were impossible to track.
              </p>
              <p>
                In [Year], we asked a simple question: <strong className="text-slate-900">"Why can't AI do this?"</strong>
              </p>
              <p>
                Today, ShipSync AI is building the intelligence layer that turns export complexity into competitive advantage — one shipment at a time.
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-[#0B1121] p-8 overflow-x-auto">
            <h3 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">The Journey</h3>
            <pre className="text-emerald-400 text-sm font-mono whitespace-pre leading-relaxed">
{`
    [YEAR]          Idea born from family export business pain
       │
       ▼
    [YEAR]          First prototype: HS code classifier
       │
       ▼
    [YEAR]          50+ pilot exporters, 94% accuracy validated
       │
       ▼
    [YEAR]          ShipSync AI incorporated, team hired
       │
       ▼
    [YEAR]          Beta launch: 6 AI tools, 200+ waitlist
       │
       ▼
    [YEAR]          [Next milestone — add your target]
`}
            </pre>
          </div>
        </div>
      </section>

      {/* MISSION + VISION */}
      <section className="bg-white border-y border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-10">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Mission</h3>
              <p className="text-slate-600 leading-relaxed">
                Make export compliance so simple that every Indian exporter — from a 2-person startup to a 500-crore enterprise — can ship with confidence, without depending on expensive consultants or risking costly errors.
              </p>
            </div>
            <div className="rounded-2xl bg-[#0B1121] p-10">
              <div className="text-3xl mb-4">🔭</div>
              <h3 className="text-2xl font-bold text-white mb-4">Vision</h3>
              <p className="text-slate-300 leading-relaxed">
                Become the global standard for trade intelligence. Every exporter, in every country, should have access to AI-powered compliance that is accurate, affordable, and instantaneous.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CORE VALUES */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">How We Work</div>
          <h2 className="text-3xl font-bold text-slate-900">Our Core Values</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: "⚡", title: "Exporter-First", desc: "Every feature decision starts with: 'Does this save an exporter time or money?' If not, we don't build it." },
            { icon: "🔒", title: "Trust Through Transparency", desc: "We show confidence scores, not black-box answers. We cite sources. We admit when AI is uncertain." },
            { icon: "🇮🇳", title: "India-First, Global-Ready", desc: "Built for Indian compliance first (DGFT, ICEGATE, Customs Act) but architected to expand to ASEAN, EU, and Middle East." },
            { icon: "📈", title: "Relentless Improvement", desc: "Every classification error is a learning opportunity. Every user correction makes the model better for everyone." },
          ].map((v) => (
            <div key={v.title} className="rounded-2xl bg-white border border-slate-200 p-8 hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-4">{v.icon}</div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">{v.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TEAM */}
      <section className="bg-white border-y border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">The People</div>
            <h2 className="text-3xl font-bold text-slate-900">Meet the Team</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">A small, focused team combining export domain expertise with AI engineering.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "[Founder Name]", role: "Co-Founder & CEO", bio: "[Add: Background, export industry experience, education, previous ventures]" },
              { name: "[Co-Founder Name]", role: "Co-Founder & CTO", bio: "[Add: AI/ML background, engineering experience, open-source contributions, education]" },
              { name: "[Team Member]", role: "Head of Compliance", bio: "[Add: Former CHA, DGFT experience, or customs background. Domain expert who validates AI outputs.]" },
            ].map((member) => (
              <div key={member.name} className="rounded-2xl bg-slate-50 border border-slate-200 p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-slate-200 mx-auto mb-4 flex items-center justify-center text-2xl">👤</div>
                <h3 className="text-lg font-bold text-slate-900">{member.name}</h3>
                <div className="text-sm text-emerald-600 font-medium mt-1">{member.role}</div>
                <p className="text-slate-500 text-sm mt-3 leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">+ [Add number] engineers, designers, and compliance specialists.</p>
          </div>
        </div>
      </section>

      {/* BY THE NUMBERS */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Traction</div>
          <h2 className="text-3xl font-bold text-slate-900">ShipSync by the Numbers</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "[ADD]", label: "Exporters on Waitlist", sub: "From 15+ Indian cities" },
            { value: "[ADD]", label: "HS Codes Classified", sub: "During beta testing" },
            { value: "[ADD]%", label: "Classification Accuracy", sub: "On validated test set" },
            { value: "[ADD]", label: "DGFT Notifications Parsed", sub: "Weekly, automated" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white border border-slate-200 p-8 text-center">
              <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">{stat.value}</div>
              <div className="text-sm font-medium text-slate-600">{stat.label}</div>
              <div className="text-xs text-slate-400 mt-1">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT MAKES US DIFFERENT */}
      <section className="bg-white border-y border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">What Makes Us Different</h2>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-slate-900">Dimension</th>
                  <th className="px-6 py-4 text-center font-semibold text-slate-700">Generic SaaS</th>
                  <th className="px-6 py-4 text-center font-semibold text-slate-700">Traditional CHA</th>
                  <th className="px-6 py-4 text-center font-semibold bg-emerald-50 text-emerald-700">ShipSync AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ["Speed", "Fast", "Hours/Days", "Seconds"],
                  ["Cost", "₹X/month", "₹2,000+/query", "Flat SaaS pricing"],
                  ["Accuracy Source", "Generic data", "Human experience", "50K+ validated records"],
                  ["Availability", "24/7", "Business hours", "24/7"],
                  ["Scalability", "Limited", "Linear (hire more)", "Unlimited (AI)"],
                  ["Data Ownership", "You", "CHA holds data", "You own everything"],
                  ["Learning", "Static", "Individual expert", "Collective (every user improves AI)"],
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{row[0]}</td>
                    <td className="px-6 py-4 text-center text-slate-600">{row[1]}</td>
                    <td className="px-6 py-4 text-center text-slate-600">{row[2]}</td>
                    <td className="px-6 py-4 text-center font-semibold text-emerald-700 bg-emerald-50/20">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* BEST PRACTICES + MISTAKES */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="rounded-xl bg-red-50 border border-red-200 p-6">
            <h4 className="font-semibold text-red-900 mb-3">❌ Common Mistakes in Startup "About" Pages</h4>
            <ul className="space-y-2 text-sm text-red-800">
              <li>• Fake team photos or bios — investors and customers verify LinkedIn</li>
              <li>• Vague mission statements like "we empower exporters" — no one remembers</li>
              <li>• No traction numbers — signals pre-product or pre-validation</li>
              <li>• Copy-paste values from Google — generic values = generic company</li>
              <li>• Hiding the team — transparency builds trust, especially in B2B</li>
            </ul>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6">
            <h4 className="font-semibold text-emerald-900 mb-3">✅ Best Practices for Startup About Pages</h4>
            <ul className="space-y-2 text-sm text-emerald-800">
              <li>• Tell a real origin story — pain you personally experienced</li>
              <li>• Show actual team members with real LinkedIn links</li>
              <li>• Include specific numbers (even small ones) — honesty beats hype</li>
              <li>• Values should be actionable — "Exporter-First" means saying no to bad features</li>
              <li>• Update quarterly — stale About pages signal a dead company</li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 p-8">
          <h3 className="text-white font-semibold mb-3">✅ Final Recommendation for ShipSync AI</h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            Your About page is your trust anchor. Every B2B buyer, investor, and potential employee will visit it. Keep it authentic — use real team photos (not stock), real numbers (even if small), and a story that shows you lived the problem. Update it every quarter as you hit milestones. A stale About page is worse than no About page.
          </p>
        </div>
      </section>
    </main>
  );
}