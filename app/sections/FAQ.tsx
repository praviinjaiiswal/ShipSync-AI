"use client";

import { useState, useEffect } from "react";
import { AnimatedSection } from "../components/AnimatedSection";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";

const faqs = [
  {
    question: "What is HS code classification and why does it matter?",
    answer:
      "HS (Harmonized System) code is an 8-digit number that identifies your product for customs. Every exported item needs one. The wrong code means wrong tax calculation, customs penalties, and shipment delays. Getting it right saves money and time.",
  },
  {
    question: "How is ShipSync AI different from a customs broker (CHA)?",
    answer:
      "ShipSync AI doesn&apos;t replace your CHA — it makes them faster. While CHAs charge &#8377;2,000-8,000 per shipment and take hours, our AI classifies products in seconds. You can still use your CHA for final filing, but with perfect documents ready.",
  },
  {
    question: "Will ShipSync AI work with ICEGATE?",
    answer:
      "Yes. Our documents are generated in ICEGATE-compatible formats. We are building direct API integration with ICEGATE 2.0 so you can auto-file shipping bills without manual data entry.",
  },
  {
    question: "How much can I save with the DGFT Benefit Finder?",
    answer:
      "Indian exporters typically miss 30-40% of eligible DGFT benefits. On a &#8377;50 lakh annual export volume, that could mean &#8377;1.5-2 lakh in unclaimed RoDTEP, MEIS, or FTA advantages. ShipSync AI scans every notification and alerts you instantly.",
  },
  {
    question: "Is my export data secure on ShipSync AI?",
    answer:
      "Absolutely. We use end-to-end encryption, SOC 2 compliant infrastructure, and your data is never used to train AI models. We are also building an on-premise deployment option for enterprises who want data to stay within their servers.",
  },
  {
    question: "Do I need technical knowledge to use ShipSync AI?",
    answer:
      "Not at all. If you can use WhatsApp, you can use ShipSync AI. Just type your product description in plain English (or Hindi), upload your purchase order, and the AI does the rest.",
  },
  {
    question: "Which export categories does ShipSync AI support?",
    answer:
      "We currently specialize in engineering goods, textiles, pharmaceuticals, agriculture, and chemicals. Our AI is trained on Indian export data and gets smarter with every classification.",
  },
  {
    question: "When will ShipSync AI launch?",
    answer:
      "We are in closed beta with 50+ exporters. Public launch is planned for Q1 2027. Waitlist members get first access and a lifetime 50% discount on all plans.",
  },
];

export function FAQ() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6 animate-pulse">
          <div className="h-10 w-48 mx-auto bg-muted/20 mb-12"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 w-full bg-muted/10 rounded-xl"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="faq" className="py-32 relative bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <AnimatedSection className="text-center mb-16">
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-navy-deep">
            Answers for <span className="text-ocean-deep">Exporters.</span>
          </h2>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border/50 rounded-2xl px-6 bg-editorial-light hover:border-border transition-all duration-300"
              >
                <AccordionTrigger className="text-left text-navy-deep hover:text-ocean-deep hover:no-underline py-6 text-lg font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-ocean-muted leading-relaxed text-base pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </AnimatedSection>
      </div>
    </section>
  );
}
