"use client";

import { useState } from "react";
import Link from "next/link";

const categories = ["All", "HS Codes", "DGFT", "FTA", "Documents", "Compliance", "AI & Tech"];

const posts = [
  {
    title: "How to Find the Correct HS Code for Your Export Product",
    excerpt: "A step-by-step guide to HS code classification for Indian exporters. Learn the 8-digit structure, common mistakes, and how AI can help.",
    category: "HS Codes",
    readTime: "8 min read",
    date: "Aug 10, 2026",
    featured: true,
  },
  {
    title: "RoDTEP Scheme 2026: What Exporters Need to Know",
    excerpt: "Updated rates, eligible HS codes, and how to claim RoDTEP benefits on your shipping bills. Includes the latest DGFT notification summary.",
    category: "DGFT",
    readTime: "6 min read",
    date: "Aug 5, 2026",
    featured: false,
  },
  {
    title: "India-UAE CEPA: FTA Benefits for Textile Exporters",
    excerpt: "How to claim zero duty under the India-UAE Comprehensive Economic Partnership Agreement. Rules of Origin explained with examples.",
    category: "FTA",
    readTime: "10 min read",
    date: "Jul 28, 2026",
    featured: false,
  },
  {
    title: "ICEGATE 2.0: What's New and How to Prepare",
    excerpt: "The upgraded ICEGATE portal brings API access, real-time tracking, and new document formats. Here's what exporters must know before transition.",
    category: "Documents",
    readTime: "7 min read",
    date: "Jul 20, 2026",
    featured: false,
  },
  {
    title: "Common Shipping Bill Errors That Trigger Customs Queries",
    excerpt: "The top 15 mistakes exporters make on shipping bills — and how to avoid them. Based on analysis of 10,000+ ICEGATE submissions.",
    category: "Compliance",
    readTime: "9 min read",
    date: "Jul 15, 2026",
    featured: false,
  },
  {
    title: "Can AI Really Classify HS Codes? We Tested 500 Products.",
    excerpt: "Results from our internal benchmark: fine-tuned LLM vs generic AI vs human CHA. Accuracy, speed, and cost comparison.",
    category: "AI & Tech",
    readTime: "12 min read",
    date: "Jul 8, 2026",
    featured: false,
  },
  {
    title: "MEIS vs RoDTEP: Which Scheme Applies to Your Product?",
    excerpt: "A clear comparison of India's two major export incentive schemes. Eligibility criteria, claim process, and recent changes.",
    category: "DGFT",
    readTime: "5 min read",
    date: "Jun 30, 2026",
    featured: false,
  },
  {
    title: "Export Documentation Checklist: 20 Items Before Every Shipment",
    excerpt: "A printable checklist covering commercial invoice, packing list, shipping bill, GR form, and certificates of origin.",
    category: "Documents",
    readTime: "6 min read",
    date: "Jun 22, 2026",
    featured: false,
  },
];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const filtered = activeCategory === "All" ? posts : posts.filter((p) => p.category === activeCategory);
  const featured = posts.find((p) => p.featured);

  return (
    <main className="min-h-screen bg-[#F8F9FC] text-slate-900">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0B1121]">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-4 py-1.5 text-sm font-medium text-slate-300 mb-8">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Export Intelligence Blog
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            Smarter Exports,<br />
            <span className="text-slate-400">One Article at a Time.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 leading-relaxed">
            Practical guides for Indian exporters. HS codes, DGFT schemes, FTA benefits, and AI-powered compliance — explained simply.
          </p>
        </div>
      </section>

      {/* WHY BLOG EXISTS */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6 mb-12">
          <h3 className="font-semibold text-emerald-900 mb-2">🎯 Why We Write</h3>
          <p className="text-emerald-800 text-sm leading-relaxed">
            Our blog serves three purposes: (1) <strong>SEO</strong> — rank for "HS code" and "RoDTEP" queries that exporters search daily, (2) <strong>Trust</strong> — demonstrate domain expertise before asking for an email, (3) <strong>Education</strong> — reduce support tickets by answering common questions in public. Every article is written or reviewed by a compliance expert.
          </p>
        </div>
      </section>

      {/* FEATURED POST */}
      {featured && (
        <section className="mx-auto max-w-6xl px-6 pb-12">
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow">
            <div className="grid lg:grid-cols-2">
              <div className="bg-slate-100 min-h-[300px] flex items-center justify-center">
                <div className="text-6xl">📝</div>
              </div>
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{featured.category}</span>
                  <span className="text-xs text-slate-400">{featured.date} · {featured.readTime}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">{featured.title}</h2>
                <p className="text-slate-600 leading-relaxed mb-6">{featured.excerpt}</p>
                <button className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-emerald-700 transition-colors">
                  Read Article
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CATEGORY FILTER */}
      <section className="mx-auto max-w-6xl px-6 pb-8">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* POSTS GRID */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((post, i) => (
            <article key={i} className="rounded-2xl bg-white border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="h-48 bg-slate-100 flex items-center justify-center">
                <span className="text-4xl group-hover:scale-110 transition-transform">📄</span>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">{post.category}</span>
                  <span className="text-xs text-slate-400">{post.readTime}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">{post.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">{post.excerpt}</p>
                <div className="mt-4 text-xs text-slate-400">{post.date}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CONTENT STRATEGY */}
      <section className="bg-white border-y border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Content Strategy for Export SaaS</h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                A blog is not a side project for a B2B SaaS company — it is your cheapest customer acquisition channel. Indian exporters search Google for "HS code for [product]" 100,000+ times per month. Ranking for these queries brings qualified leads at ₹0 cost.
              </p>
              <div className="rounded-2xl bg-[#0B1121] p-6 overflow-x-auto">
                <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">SEO Funnel Architecture</h3>
                <pre className="text-emerald-400 text-xs font-mono whitespace-pre leading-relaxed">
{`
    TOFU (Top of Funnel)
    ┌─────────────────────────────────────┐
    │ "What is HS code?"                  │
    │ "How to export from India?"         │
    │ "RoDTEP scheme explained"           │
    │ → Educational, broad reach          │
    └──────────────┬──────────────────────┘
                   │
    MOFU (Middle of Funnel)
    ┌──────────────┴──────────────────────┐
    │ "HS code for textile products"        │
    │ "DGFT benefit for chemical exports"   │
    │ "ICEGATE document upload guide"       │
    │ → Problem-aware, solution-seeking   │
    └──────────────┬──────────────────────┘
                   │
    BOFU (Bottom of Funnel)
    ┌──────────────┴──────────────────────┐
    │ "Best HS code classifier tool"      │
    │ "ShipSync vs CHA"                   │
    │ "Export compliance software India"  │
    │ → Ready to buy, comparison mode     │
    └─────────────────────────────────────┘
`}
                </pre>
              </div>
            </div>
            <div className="space-y-6">
              <div className="rounded-xl bg-red-50 border border-red-200 p-6">
                <h4 className="font-semibold text-red-900 mb-3">❌ Common Content Mistakes</h4>
                <ul className="space-y-2 text-sm text-red-800">
                  <li>• Writing for other startups, not exporters — jargon kills conversion</li>
                  <li>• No keyword research — "export tips" gets 10 searches/month; "HS code 5208" gets 5,000</li>
                  <li>• Inconsistent publishing — Google rewards consistency; one post/month minimum</li>
                  <li>• No CTA — every article should have a soft CTA (download checklist, join waitlist)</li>
                  <li>• Ignoring Hindi/regional language SEO — 40% of Indian exporters search in Hindi</li>
                </ul>
              </div>
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6">
                <h4 className="font-semibold text-emerald-900 mb-3">✅ Best Practices for B2B SaaS Content</h4>
                <ul className="space-y-2 text-sm text-emerald-800">
                  <li>• Target long-tail keywords: "HS code for cotton saree" not just "HS code"</li>
                  <li>• Include downloadable assets (PDF checklists, Excel templates) for email capture</li>
                  <li>• Update old posts quarterly — DGFT rules change, stale content hurts SEO</li>
                  <li>• Repurpose every blog into LinkedIn post + WhatsApp status + YouTube Short</li>
                  <li>• Track "time on page" — under 2 minutes means content isn't answering the question</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-2xl bg-[#0B1121] p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Weekly Export Intelligence</h2>
          <p className="text-slate-400 max-w-xl mx-auto mb-8">
            One email every Monday: DGFT notification summary, new FTA updates, and HS code tips. No spam. Unsubscribe anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="rajesh@company.com"
              className="flex-1 rounded-full bg-slate-800 border border-slate-700 px-5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* FINAL RECOMMENDATION */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-2xl bg-slate-900 p-8">
          <h3 className="text-white font-semibold mb-3">✅ Final Recommendation for ShipSync AI</h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            Publish 2 articles per week: one TOFU (educational, broad) and one MOFU/BOFU (problem-specific, product-tied). Use Surfer SEO or Clearscope for keyword optimization. Set up Google Search Console on Day 1 and track impressions for "HS code" queries. A well-executed blog can become your #1 customer acquisition channel within 12 months — cheaper than paid ads and more scalable than outbound sales.
          </p>
        </div>
      </section>
    </main>
  );
}