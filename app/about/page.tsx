import type { Metadata } from "next";
import { Navbar } from "@/app/sections/Navbar";
import { Hero } from "@/app/sections/Hero";
import { Problem } from "@/app/sections/Problem";
import { Solution } from "@/app/sections/Solution";
import { Features } from "@/app/sections/Features";
import { Stats } from "@/app/sections/Stats";
import { FAQ } from "@/app/sections/FAQ";
import { Footer } from "@/app/sections/Footer";

export const metadata: Metadata = {
  title: "What is ShipSync AI? | Product Overview & Compliance Platform",
  description:
    "Discover how ShipSync AI automates Indian export customs filings, DGFT compliance checks, HS Code classifications, and statutory tariff intelligence.",
};

export default function AboutPage() {
  return (
    <main className="relative overflow-hidden min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Problem />
      <Solution />
      <Features />
      <Stats />
      <FAQ />
      <Footer />
    </main>
  );
}
