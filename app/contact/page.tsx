import { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, Clock, Ship, ArrowLeft } from "lucide-react";
import { ContactForm } from "@/app/components/ContactForm";
import { GradientBackground } from "@/app/components/GradientBackground";

export const metadata: Metadata = {
  title: "Contact Us — ShipSync AI",
  description:
    "Have questions about export compliance or want to partner with us? Get in touch with the ShipSync AI team.",
};

export default function ContactPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <GradientBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-ocean-muted hover:text-navy-deep transition-colors mb-12 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-editorial-light border border-border flex items-center justify-center shadow-sm">
                  <Ship className="w-6 h-6 text-ocean-deep" />
                </div>
                <span className="font-heading font-bold text-2xl text-navy-deep tracking-tight">
                  ShipSync<span className="text-ocean-deep"> AI</span>
                </span>
              </div>

              <h1 className="font-heading text-4xl sm:text-6xl font-bold text-navy-deep mb-6 leading-tight">
                Let's Start a <br/><span className="text-ocean-deep">Conversation.</span>
              </h1>
              <p className="text-lg text-ocean-muted leading-relaxed max-w-md">
                Have questions about export compliance or want to explore enterprise partnerships? Our intelligence team is ready.
              </p>
            </div>

            <div className="space-y-4 mt-8">
              {[
                {
                  icon: Mail,
                  title: "Direct Email",
                  content: "animusitmanagement@gmail.com",
                  description: "Priority response for exporters",
                },
                {
                  icon: MapPin,
                  title: "Headquarters",
                  content: "Mumbai, Maharashtra, India",
                  description: "Global trade intelligence hub",
                },
                {
                  icon: Clock,
                  title: "Operating Hours",
                  content: "Within 24 hours",
                  description: "Monday to Saturday, IST",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-5 p-6 rounded-2xl bg-editorial-light border border-border/60 hover:border-ocean-muted/40 hover:shadow-md transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-white border border-border flex items-center justify-center shrink-0 shadow-sm">
                    <item.icon className="w-5 h-5 text-ocean-deep" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy-deep text-lg mb-1">{item.title}</h3>
                    <p className="text-ocean-deep font-medium mb-1">{item.content}</p>
                    <p className="text-sm text-ocean-muted">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-8 lg:mt-0">
            <div className="absolute -inset-1 bg-gradient-to-r from-ocean-deep/10 to-navy-deep/10 rounded-3xl blur-xl opacity-70" />
            <div className="relative p-8 sm:p-12 rounded-3xl bg-white border border-border shadow-2xl">
              <h2 className="text-3xl font-heading font-bold text-navy-deep mb-8">
                Secure Inquiry
              </h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
