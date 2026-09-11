import type { Metadata } from "next";
import { HomePageClient } from "@/app/components/live-feed/HomePageClient";

export const metadata: Metadata = {
  title: "Live Regulatory Gazette & Trade Feed | ShipSync AI",
  description:
    "Live news channel monitoring DGFT circulars, RoDTEP extensions, and SCOMET trade intelligence for Indian exporters and importers.",
  openGraph: {
    title: "Live Regulatory Gazette & Trade Feed | ShipSync AI",
    description:
      "Live news channel monitoring DGFT notifications, trade circulars, and tariff revisions.",
    url: "https://shipsync.ai",
    siteName: "ShipSync AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Live Regulatory Gazette & Trade Feed | ShipSync AI",
    description:
      "Real-time Indian trade and customs intelligence feed.",
  },
};

export default function Home() {
  return <HomePageClient />;
}
