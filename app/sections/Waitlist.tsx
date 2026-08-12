"use client";

import { motion } from "framer-motion";
import { WaitlistForm } from "../components/WaitlistForm";
import { GradientBackground } from "../components/GradientBackground";
import { SocialProof } from "../components/SocialProof";

export function Waitlist() {
  return (
    <section id="waitlist" className="py-24 relative overflow-hidden">
      <GradientBackground />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10"
        >
          <span className="text-ocean-deep font-semibold text-sm uppercase tracking-wider">
            Exclusive Early Access
          </span>
          <h2 className="mt-4 font-heading text-3xl sm:text-5xl font-bold text-navy-deep">
            Your Next Shipment Starts With{" "}
            <span className="text-ocean-deep">Better Intelligence.</span>
          </h2>
          <p className="mt-4 text-ocean-muted max-w-xl mx-auto text-lg">
            Join the first exporters building a faster, smarter compliance workflow with ShipSync AI.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-ocean-deep/10 to-navy-deep/10 rounded-2xl blur-xl" />
          <div className="relative p-8 sm:p-12 rounded-2xl bg-white border border-border shadow-2xl">
            <WaitlistForm />
          <SocialProof />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
