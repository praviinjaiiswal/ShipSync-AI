"use client";

import Link from "next/link";

export default function PrivacyPolicy() {
  const lastUpdated = "August 12, 2026";

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-8"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Back to ShipSync AI
          </Link>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
          <p className="mt-3 text-slate-500">Last updated: {lastUpdated}</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="prose prose-slate max-w-none">

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-10">
            <p className="text-sm text-amber-800 m-0 font-medium">
              ⚠️ Legal Notice: This Privacy Policy is drafted in compliance with the Information Technology Act, 2000 (as amended), the Digital Personal Data Protection Act, 2023 (DPDP Act), and applicable Indian export regulations. We recommend having this reviewed by your legal counsel before publication.
            </p>
          </div>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Introduction & Scope</h2>
            <p className="text-slate-600 leading-relaxed">
              ShipSync AI ("we," "us," or "our") is operated by [Your Legal Entity Name], a company incorporated in India. This Privacy Policy explains how we collect, process, store, and protect your personal data, business data, and export-related information when you use our AI-powered export compliance platform, website, APIs, and related services (collectively, the "Services").
            </p>
            <p className="text-slate-600 leading-relaxed mt-3">
              This policy applies to all users, including visitors, registered exporters, customs brokers, and enterprise clients. By accessing or using ShipSync AI, you consent to the practices described in this policy. If you do not agree, please discontinue use immediately.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Data Controller & Contact Information</h2>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <p className="text-slate-700 m-0"><strong>Data Controller:</strong> [Your Legal Entity Name]</p>
              <p className="text-slate-700 mt-2 m-0"><strong>Registered Address:</strong> [Your Complete Registered Office Address, India]</p>
              <p className="text-slate-700 mt-2 m-0"><strong>CIN:</strong> [Corporate Identification Number]</p>
              <p className="text-slate-700 mt-2 m-0"><strong>Email:</strong> privacy@shipsync.ai</p>
              <p className="text-slate-700 mt-2 m-0"><strong>Grievance Officer:</strong> [Name], appointed under Section 79(2) of the IT Act, 2000 and Rule 3(2) of the IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021. Contact: grievance@shipsync.ai</p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. Categories of Data We Collect</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              We collect and process the following categories of data to provide AI-powered export compliance services:
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">3.1 Personal Data (Digital Personal Data under DPDP Act, 2023)</h3>
            <ul className="list-disc pl-6 text-slate-600 space-y-1">
              <li>Full name, designation, and contact details (email, phone)</li>
              <li>Government-issued identifiers (PAN, IEC — Import Export Code, GSTIN where required)</li>
              <li>Account credentials and authentication data</li>
              <li>IP address, device information, browser type, and access logs</li>
              <li>Communication records (support tickets, emails, chat transcripts)</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">3.2 Business & Export Data (Non-Personal but Sensitive Business Information)</h3>
            <ul className="list-disc pl-6 text-slate-600 space-y-1">
              <li>Company name, registered address, and business constitution</li>
              <li>Product catalogs, descriptions, specifications, and technical sheets</li>
              <li>HS (Harmonized System) code history and classification preferences</li>
              <li>Destination countries, trade routes, and shipping volumes</li>
              <li>DGFT scheme utilization history (RoDTEP, MEIS, FTA claims)</li>
              <li>ICEGATE credentials and shipping bill metadata (where integrated)</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">3.3 Document Data (Uploads for AI Processing)</h3>
            <ul className="list-disc pl-6 text-slate-600 space-y-1">
              <li>Commercial invoices, packing lists, shipping bills, and GR forms</li>
              <li>Certificates of Origin, FTA-related documentation</li>
              <li>Bank realization certificates and payment proofs</li>
              <li>Any other documents uploaded for AI validation or generation</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">3.4 AI Interaction Data</h3>
            <ul className="list-disc pl-6 text-slate-600 space-y-1">
              <li>Prompts, queries, and inputs provided to our AI models</li>
              <li>AI-generated outputs (HS code suggestions, document drafts, route recommendations)</li>
              <li>Feedback, corrections, and ratings on AI outputs</li>
              <li>Usage patterns, feature interactions, and session analytics</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Legal Basis & Purpose of Processing</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Under Section 4 of the DPDP Act, 2023, we process your digital personal data based on:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li><strong>Consent:</strong> Explicit consent obtained during registration and for specific processing activities (marketing, AI training opt-ins).</li>
              <li><strong>Legitimate Use:</strong> Processing necessary for the performance of our contract with you, compliance with legal obligations (DGFT, Customs Act, 1962), and protection of your vital interests.</li>
            </ul>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm text-left border border-slate-200 rounded-xl">
                <thead className="bg-slate-50 text-slate-700 font-semibold">
                  <tr>
                    <th className="px-4 py-3 border-b border-slate-200">Purpose</th>
                    <th className="px-4 py-3 border-b border-slate-200">Data Used</th>
                    <th className="px-4 py-3 border-b border-slate-200">Legal Basis</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600">
                  <tr className="border-b border-slate-100">
                    <td className="px-4 py-3">Account creation & authentication</td>
                    <td className="px-4 py-3">Name, email, phone, IEC, PAN</td>
                    <td className="px-4 py-3">Consent + Contract</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-4 py-3">AI HS Code Classification</td>
                    <td className="px-4 py-3">Product descriptions, catalogs, technical specs</td>
                    <td className="px-4 py-3">Consent + Contract</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-4 py-3">Document Generation & Validation</td>
                    <td className="px-4 py-3">Invoices, packing lists, shipping bills</td>
                    <td className="px-4 py-3">Consent + Contract</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-4 py-3">DGFT Benefit Discovery</td>
                    <td className="px-4 py-3">Export history, product categories, destination data</td>
                    <td className="px-4 py-3">Consent + Legitimate Use</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-4 py-3">AI Model Improvement</td>
                    <td className="px-4 py-3">Anonymized prompts, outputs, feedback</td>
                    <td className="px-4 py-3">Consent (explicit opt-in)</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-4 py-3">Regulatory Compliance</td>
                    <td className="px-4 py-3">All categories as required by law</td>
                    <td className="px-4 py-3">Legal Obligation</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Fraud prevention & security</td>
                    <td className="px-4 py-3">IP logs, device info, access patterns</td>
                    <td className="px-4 py-3">Legitimate Use</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. AI Model Processing & Data Usage</h2>
            <p className="text-slate-600 leading-relaxed">
              ShipSync AI utilizes proprietary and third-party large language models (LLMs) and machine learning models to deliver export compliance services. This section specifically addresses how your data interacts with our AI systems:
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">5.1 Real-Time Processing</h3>
            <p className="text-slate-600 leading-relaxed">
              When you submit product descriptions or documents for AI processing, the data is transmitted to our secure AI inference infrastructure. This processing occurs in real-time to generate HS code classifications, document drafts, and compliance recommendations. Your data is encrypted in transit (TLS 1.3) and at rest (AES-256).
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">5.2 AI Training & Model Improvement</h3>
            <p className="text-slate-600 leading-relaxed">
              We <strong>do not</strong> use your personal data or identifiable business data for training our AI models without your explicit consent. We may use anonymized, aggregated, and de-identified data for model improvement only if you have opted in. You can withdraw this consent at any time via your account settings or by contacting privacy@shipsync.ai.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">5.3 Third-Party AI Providers</h3>
            <p className="text-slate-600 leading-relaxed">
              We may engage third-party AI infrastructure providers (e.g., cloud GPU providers, API services) for model hosting and inference. All such providers are bound by data processing agreements (DPAs) that prohibit use of your data for their own model training and mandate deletion of data post-processing. We do not use consumer-facing LLM APIs that retain data for training purposes.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">5.4 Output Accuracy & Limitations</h3>
            <p className="text-slate-600 leading-relaxed">
              AI-generated outputs (including HS code suggestions, duty calculations, and document drafts) are probabilistic in nature and provided for assistance only. Our AI models are trained on validated Indian export datasets, but we do not guarantee 100% accuracy. You must verify all AI outputs with a licensed customs broker or CHA before submission to ICEGATE, DGFT, or customs authorities.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Data Sharing & Third-Party Disclosures</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              We do not sell your personal data. We may share data only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li><strong>Service Providers:</strong> Cloud hosting (AWS India / Azure India), payment gateways, email services, customer support tools. All providers are contractually bound to data protection standards.</li>
              <li><strong>Government & Regulatory Authorities:</strong> DGFT, Customs Department, RBI, FEMA authorities, tax authorities, or courts when legally mandated under the Customs Act, 1962, Foreign Trade Policy, or other applicable laws.</li>
              <li><strong>ICEGATE Integration:</strong> If you authorize ICEGATE connectivity, relevant shipping data is transmitted to ICEGATE 2.0 as per your explicit instructions.</li>
              <li><strong>Business Transfers:</strong> In case of merger, acquisition, or asset sale, data may be transferred with prior notice.</li>
              <li><strong>Legal Enforcement:</strong> To protect our rights, property, or safety, or when required by a competent Indian court or law enforcement agency.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Data Retention & Deletion</h2>
            <p className="text-slate-600 leading-relaxed">
              We retain your data only for as long as necessary to fulfill the purposes outlined in this policy:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mt-3">
              <li><strong>Account Data:</strong> Retained for the duration of your account plus 7 years post-termination (as required by Indian tax and company law).</li>
              <li><strong>Export Documents:</strong> Retained for 5 years from the date of shipment (standard customs record-keeping requirement) unless you request earlier deletion.</li>
              <li><strong>AI Interaction Logs:</strong> Retained for 12 months for debugging and service improvement, then anonymized or deleted.</li>
              <li><strong>Payment Records:</strong> Retained for 8 years as per GST and Income Tax requirements.</li>
            </ul>
            <p className="text-slate-600 leading-relaxed mt-4">
              Upon account deletion request, we will delete your personal data within 30 days, except where retention is required by law. Document data can be permanently deleted immediately upon request via privacy@shipsync.ai.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Your Rights Under the DPDP Act, 2023</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              As a Data Principal under the DPDP Act, 2023, you have the following rights:
            </p>
            <div className="grid gap-4">
              {[
                { right: "Right to Access", desc: "Obtain confirmation of processing and a summary of your personal data we hold." },
                { right: "Right to Correction & Erasure", desc: "Request correction of inaccurate data or deletion of data no longer necessary for processing." },
                { right: "Right to Grievance Redressal", desc: "File a complaint with our Grievance Officer or the Data Protection Board of India." },
                { right: "Right to Nominate", desc: "Nominate another individual to exercise your rights in case of incapacity or death." },
                { right: "Right to Withdraw Consent", desc: "Withdraw consent for specific processing activities (e.g., AI training, marketing) without affecting the lawfulness of prior processing." },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4 bg-slate-50 rounded-lg p-4 border border-slate-100">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{item.right}</h4>
                    <p className="text-sm text-slate-600 mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-slate-600 leading-relaxed mt-4">
              To exercise these rights, email us at <strong>privacy@shipsync.ai</strong> with the subject line "DPDP Rights Request." We will respond within 30 days as mandated by the Act.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. Data Security Measures</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              We implement reasonable security practices and procedures as required under Section 8 of the DPDP Act, 2023 and Rule 8 of the SPDI Rules, 2011:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-1">
              <li><strong>Encryption:</strong> TLS 1.3 for data in transit; AES-256 for data at rest.</li>
              <li><strong>Access Controls:</strong> Role-based access control (RBAC), multi-factor authentication (MFA), and principle of least privilege.</li>
              <li><strong>Infrastructure:</strong> ISO 27001 and SOC 2 Type II certified cloud infrastructure hosted in India.</li>
              <li><strong>Monitoring:</strong> 24/7 security operations center (SOC), intrusion detection systems, and regular vulnerability assessments.</li>
              <li><strong>Incident Response:</strong> In case of a personal data breach, we will notify the Data Protection Board and affected users within 72 hours as required by Section 8(7) of the DPDP Act.</li>
              <li><strong>Employee Training:</strong> All personnel handling export data undergo background verification and data protection training.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">10. Cookies & Tracking Technologies</h2>
            <p className="text-slate-600 leading-relaxed">
              We use cookies and similar technologies to enhance user experience, analyze traffic, and improve our AI models. Categories include:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-1 mt-2">
              <li><strong>Essential Cookies:</strong> Required for authentication and security (cannot be disabled).</li>
              <li><strong>Analytics Cookies:</strong> Help us understand feature usage and platform performance.</li>
              <li><strong>Preference Cookies:</strong> Remember your settings (language, HS code preferences).</li>
            </ul>
            <p className="text-slate-600 leading-relaxed mt-3">
              You can manage cookie preferences through your browser settings. For detailed information, see our Cookie Policy.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">11. Children's Privacy</h2>
            <p className="text-slate-600 leading-relaxed">
              Our Services are intended for business use by individuals aged 18 and above. We do not knowingly collect data from children under 18. If we discover that a minor's data has been collected, we will delete it immediately upon verification. Parents or guardians may contact us at privacy@shipsync.ai to report such incidents.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">12. Cross-Border Data Transfers</h2>
            <p className="text-slate-600 leading-relaxed">
              Your data is primarily stored and processed within India. In limited cases (e.g., using global cloud infrastructure), data may be transferred to jurisdictions outside India. All such transfers comply with Section 16 of the DPDP Act, 2023, and are protected by standard contractual clauses, adequacy decisions, or government-approved transfer mechanisms. We ensure that the receiving jurisdiction maintains data protection standards comparable to Indian law.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">13. Changes to This Policy</h2>
            <p className="text-slate-600 leading-relaxed">
              We may update this Privacy Policy to reflect changes in our practices, technology, legal requirements, or regulatory guidance. Material changes will be notified via email and a prominent banner on our platform at least 7 days before taking effect. The "Last Updated" date at the top of this page indicates the most recent revision. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">14. Contact Us</h2>
            <div className="bg-slate-900 text-white rounded-xl p-8">
              <p className="text-slate-300 leading-relaxed">
                For questions, concerns, or to exercise your data protection rights, please contact:
              </p>
              <div className="mt-6 space-y-3">
                <p className="m-0"><strong className="text-white">Data Protection Officer / Grievance Officer</strong></p>
                <p className="text-slate-300 m-0">Email: privacy@shipsync.ai</p>
                <p className="text-slate-300 m-0">Grievance: grievance@shipsync.ai</p>
                <p className="text-slate-300 m-0">Address: [Your Registered Office Address]</p>
                <p className="text-slate-400 text-sm mt-4 m-0">Response time: Within 48 hours for acknowledgment; 30 days for resolution per DPDP Act requirements.</p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
