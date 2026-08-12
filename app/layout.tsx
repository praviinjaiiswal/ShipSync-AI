import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://shipsync.ai"), // <-- YEH LINE ADD KARNI HAI
  title: "ShipSync AI — AI Export Compliance for Indian Engineering Exporters",
  description:
    "Auto-find HS codes, generate export documents, and never miss DGFT benefits. AI-powered compliance for Indian engineering exporters.",
  keywords: [
    "HS code classifier India",
    "export documentation software",
    "DGFT benefits",
    "Indian exporter compliance",
    "AI trade compliance",
    "ICEGATE automation",
  ],
  authors: [{ name: "ShipSync AI" }],
  creator: "ShipSync AI",
  publisher: "ShipSync AI",
  robots: "index, follow",
  alternates: {
    canonical: "https://shipsync.ai",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://shipsync.ai",
    siteName: "ShipSync AI",
    title: "ShipSync AI — AI Export Compliance for Indian Engineering Exporters",
    description:
      "Auto-find HS codes, generate export documents, and never miss DGFT benefits. AI-powered compliance for Indian engineering exporters.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ShipSync AI - AI Export Compliance Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ShipSync AI — AI Export Compliance",
    description: "Auto-find HS codes, never miss DGFT benefits.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://shipsync.ai/#organization",
                  name: "ShipSync AI",
                  url: "https://shipsync.ai",
                  logo: {
                    "@type": "ImageObject",
                    url: "https://shipsync.ai/logo.png",
                  },
                },
                {
                  "@type": "WebSite",
                  "@id": "https://shipsync.ai/#website",
                  url: "https://shipsync.ai",
                  name: "ShipSync AI",
                },
                {
                  "@type": "SoftwareApplication",
                  name: "ShipSync AI",
                  applicationCategory: "BusinessApplication",
                  operatingSystem: "Web",
                  offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "INR",
                  },
                  description:
                    "AI-powered export compliance platform for Indian exporters.",
                },
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
