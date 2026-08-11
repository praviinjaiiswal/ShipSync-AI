import { Navbar } from "@/app/sections/Navbar";
import { Hero } from "@/app/sections/Hero";
import { Problem } from "@/app/sections/Problem";
import { Solution } from "@/app/sections/Solution";
import { Features } from "@/app/sections/Features";
import { Stats } from "@/app/sections/Stats";
import { Waitlist } from "@/app/sections/Waitlist";
import { FAQ } from "@/app/sections/FAQ";
import { Footer } from "@/app/sections/Footer";

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      <Navbar />
      <Hero />
      <Problem />
      <Solution />
      <Features />
      <Stats />
      <Waitlist />
      <FAQ />
      <Footer />
    </main>
  );
}
