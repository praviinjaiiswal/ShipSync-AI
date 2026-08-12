"use client";

import { useState } from "react";

const departments = ["All", "Engineering", "AI/ML", "Compliance", "Sales", "Design"];

const openings = [
  {
    title: "Senior Full-Stack Engineer",
    department: "Engineering",
    location: "Remote / [City]",
    type: "Full-time",
    description: "Build the core ShipSync platform: Next.js frontend, Node.js API, PostgreSQL/MongoDB data layer, and ICEGATE integrations.",
    requirements: ["4+ years React/Next.js", "2+ years Node.js/TypeScript", "Experience with PostgreSQL or MongoDB", "Bonus: AWS/Vercel, CI/CD, microservices"],
  },
  {
    title: "AI/ML Engineer — NLP",
    department: "AI/ML",
    location: "Remote / [City]",
    type: "Full-time",
    description: "Fine-tune and deploy LLMs for HS code classification. Build RAG pipelines, evaluation frameworks, and feedback loops.",
    requirements: ["3+ years ML/NLP experience", "Hands-on with transformers (BERT, GPT, LLaMA)", "Python, PyTorch/TensorFlow", "Bonus: Export domain knowledge, HuggingFace, LangChain"],
  },
  {
    title: "Compliance Specialist",
    department: "Compliance",
    location: "[City]",
    type: "Full-time",
    description: "Validate AI-generated HS codes and documents. Monitor DGFT notifications. Build compliance rule engines.",
    requirements: ["3+ years in customs/export compliance", "Deep knowledge of DGFT, ICEGATE, Customs Act", "Experience with CHA or export house", "Bonus: AI tool evaluation experience"],
  },
  {
    title: "Growth Marketing Manager",
    department: "Sales",
    location: "Remote / [City]",
    type: "Full-time",
    description: "Own ShipSync's GTM: SEO content, LinkedIn strategy, EPC partnerships, and trade show presence. Target: 100 paying customers in 12 months.",
    requirements: ["3+ years B2B SaaS marketing", "Proven SEO/content strategy results", "Experience with Indian SMB sales cycles", "Bonus: Export industry network, Hindi content creation"],
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "Remote / [City]",
    type: "Full-time",
    description: "Design intuitive interfaces for complex export workflows. Balance power-user features with simplicity for first-time exporters.",
    requirements: ["3+ years product design (B2B SaaS preferred)", "Strong Figma skills + design systems experience", "User research and usability testing", "Bonus: Experience designing for regulated industries"],
  },
  {
    title: "AI Data Annotator — Export Domain",
    department: "AI/ML",
    location: "Remote",
    type: "Contract / Part-time",
    description: "Label and validate HS code classifications, document pairs, and FTA eligibility data. Critical for model training.",
    requirements: ["Background in export/import or customs", "Attention to detail (99%+ accuracy required)", "Basic computer skills", "Flexible hours, performance-based pay"],
  },
];

const benefits = [
  { icon: "💰", title: "Competitive Salary", desc: "Market-rate + ESOPs for early team members" },
  { icon: "🏠", title: "Remote-First", desc: "Work from anywhere in India. Office optional in [City]." },
  { icon: "⚕️", title: "Health Insurance", desc: "Family health cover (₹5L+) for full-time employees" },
  { icon: "📚", title: "Learning Budget", desc: "₹50,000/year for courses, conferences, and books" },
  { icon: "🌴", title: "Unlimited PTO", desc: "Take time when you need it. We trust our team." },
  { icon: "🚀", title: "Early-Stage Equity", desc: "Meaningful ESOPs. Build something you own." },
];

export default function CareersPage() {
  const [activeDept, setActiveDept] = useState("All");
  const filtered = activeDept === "All" ? openings : openings.filter((o) => o.department === activeDept);

  return (
    <main className="min-h-screen bg-[#F8F9FC] text-slate-900">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0B1121]">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-4 py-1.5 text-sm font-medium text-slate-300 mb-8">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Join the Team
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
            Build the Future of<br />
            <span className="text-slate-400">Global Trade.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 leading-relaxed">
            We're a small team with a big mission. If you care about AI, exports, and making complex things simple — you'll fit right in.
          </p>
        </div>
      </section>

      {/* WHY JOIN */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Why ShipSync?</div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Work That Actually Matters</h2>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                Most AI jobs involve optimizing ad clicks or recommendation algorithms. At ShipSync, your code directly helps a Surat textile exporter ship $1M worth of fabrics without a customs penalty.
              </p>
              <p>
                We're early — <strong className="text-slate-900">[ADD: team size]</strong> people, pre-Series A, with a clear path to product-market fit. Early team members get meaningful equity, direct founder access, and the chance to shape the company culture.
              </p>
              <p>
                Our stack is modern (Next.js, TypeScript, fine-tuned LLMs, AWS India) but our problems are real (customs penalties, missed benefits, document errors).
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-[#0B1121] p-8 overflow-x-auto">
            <h3 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">What You'll Build</h3>
            <pre className="text-emerald-400 text-sm font-mono whitespace-pre leading-relaxed">
{`
    WEEK 1-2
    ├── Onboarding: Export compliance crash course
    ├── Shadow a CHA for a day
    └── Set up dev environment

    MONTH 1
    ├── Ship your first feature to production
    ├── Join customer calls (2/week)
    └── Contribute to AI model evaluation

    MONTH 3
    ├── Own a product module end-to-end
    ├── Mentor a new hire
    └── Present at team demo day

    MONTH 6
    ├── Lead a cross-functional initiative
    ├── Influence product roadmap
    └── [Potential] Team lead path
`}
            </pre>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="bg-white border-y border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Perks & Benefits</h2>
            <p className="text-slate-500 mt-3">We take care of our team so they can take care of our exporters.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="rounded-2xl bg-slate-50 border border-slate-200 p-8 text-center hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{b.icon}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{b.title}</h3>
                <p className="text-slate-600 text-sm">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OPEN POSITIONS */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Open Roles</div>
          <h2 className="text-3xl font-bold text-slate-900">Join Us</h2>
          <p className="text-slate-500 mt-3">{openings.length} open positions across {new Set(openings.map((o) => o.department)).size} teams</p>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setActiveDept(dept)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeDept === dept ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>

        {/* Job Cards */}
        <div className="space-y-4">
          {filtered.map((job, i) => (
            <div key={i} className="rounded-2xl bg-white border border-slate-200 p-6 md:p-8 hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold text-slate-900">{job.title}</h3>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">{job.department}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-4">
                    <span className="flex items-center gap-1">📍 {job.location}</span>
                    <span className="flex items-center gap-1">⏱️ {job.type}</span>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">{job.description}</p>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Requirements</div>
                    <ul className="grid md:grid-cols-2 gap-1">
                      {job.requirements.map((req, j) => (
                        <li key={j} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="mt-1.5 h-1 w-1 rounded-full bg-emerald-500 flex-shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <a
                    href={`mailto:careers@shipsync.ai?subject=Application:%20${encodeURIComponent(job.title)}`}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                  >
                    Apply Now
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No open roles in this department</h3>
            <p className="text-slate-500 text-sm">Check back later or send us your resume for future opportunities.</p>
          </div>
        )}
      </section>

      {/* HIRING PROCESS */}
      <section className="bg-white border-y border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Our Hiring Process</h2>
            <p className="text-slate-500 mt-3">Transparent, fast, and respectful of your time. Typically 2-3 weeks end-to-end.</p>
          </div>
          <div className="grid md:grid-cols-5 gap-4">
            {[
              { step: "01", title: "Apply", desc: "Resume + short cover letter. Tell us why exports + AI." },
              { step: "02", title: "Screening", desc: "30-min video call with founder. Culture + motivation fit." },
              { step: "03", title: "Task", desc: "Take-home assignment relevant to the role. 3-4 hours max." },
              { step: "04", title: "Deep Dive", desc: "2-hour interview: technical + problem-solving + values." },
              { step: "05", title: "Offer", desc: "Reference checks → Offer letter → Welcome aboard!" },
            ].map((s, i) => (
              <div key={i} className="relative">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 text-center h-full">
                  <div className="text-3xl font-bold text-slate-200 mb-3">{s.step}</div>
                  <h3 className="font-bold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-slate-600 text-xs leading-relaxed">{s.desc}</p>
                </div>
                {i < 4 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <span className="text-slate-300 text-xl">→</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BEST PRACTICES + MISTAKES */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="rounded-xl bg-red-50 border border-red-200 p-6">
            <h4 className="font-semibold text-red-900 mb-3">❌ Common Hiring Mistakes at Early-Stage Startups</h4>
            <ul className="space-y-2 text-sm text-red-800">
              <li>• Hiring for "culture fit" instead of "culture add" — creates echo chambers</li>
              <li>• Vague job descriptions — "rockstar developer" attracts the wrong candidates</li>
              <li>• 5+ interview rounds — top candidates have 3 other offers, you'll lose them</li>
              <li>• No take-home task — you can't assess problem-solving in a 30-min call</li>
              <li>• Delaying ESOP discussion — candidates should know equity upside before accepting</li>
              <li>• Ignoring compliance/domain expertise — AI export tools need people who understand customs</li>
            </ul>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6">
            <h4 className="font-semibold text-emerald-900 mb-3">✅ Best Practices for Startup Hiring</h4>
            <ul className="space-y-2 text-sm text-emerald-800">
              <li>• Write specific JDs with real problems the hire will solve — attracts mission-driven people</li>
              <li>• Move fast: screen within 48 hours, offer within 2 weeks of first contact</li>
              <li>• Include a paid take-home task (₹5,000 stipend) — respects candidate's time</li>
              <li>• Be transparent about runway, burn rate, and funding status — builds trust</li>
              <li>• Hire generalists first, specialists later — early team needs to wear multiple hats</li>
              <li>• Always check references — one bad hire at seed stage can derail the company</li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 p-8">
          <h3 className="text-white font-semibold mb-3">✅ Final Recommendation for ShipSync AI</h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            Your first 10 hires determine your company culture forever. Prioritize: (1) <strong className="text-white">Domain curiosity</strong> — someone who wants to learn exports, not just code, (2) <strong className="text-white">Speed over perfection</strong> — ship fast, iterate faster, (3) <strong className="text-white">Communication</strong> — remote-first teams die without clear async communication. Hire slow for your first 5, then fast for scaling. And never compromise on integrity — one person who cuts corners on compliance data can destroy customer trust.
          </p>
        </div>
      </section>
    </main>
  );
}