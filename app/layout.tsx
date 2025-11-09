import "./globals.css";
import { Outfit } from "next/font/google";
import type { Metadata } from "next";
import Script from "next/script";
import Providers from "./providers";
import AppShell from "@/components/AppShell";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://reefregen.org";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Reef.Regen - Verifiable Coral Restoration Platform",
    template: "%s · Reef.Regen",
  },
  description: "Reef.Regen empowers organizations, citizen scientists, and communities to create verifiable, blockchain-based records of coral restoration activities. Document and showcase your conservation work with transparency and immutability.",
  keywords: [
    "coral restoration",
    "reef conservation",
    "blockchain verification",
    "marine conservation",
    "Ethereum Attestation Service",
    "environmental impact",
    "sustainable ocean",
    "coral reef",
    "conservation technology",
  ],
  authors: [{ name: "Reef.Regen", url: baseUrl }],
  creator: "Pollen Labs",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "Reef.Regen",
    title: "Reef.Regen - Verifiable Coral Restoration Platform",
    description: "Empower organizations and communities to create verifiable, blockchain-based records of coral restoration activities.",
    images: [
      {
        url: "/assets/OG-reefregen-org.png",
        width: 1200,
        height: 630,
        alt: "Reef.Regen - Coral Restoration Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Reef.Regen - Verifiable Coral Restoration Platform",
    description: "Empower organizations and communities to create verifiable, blockchain-based records of coral restoration activities.",
    images: ["/assets/OG-reefregen-org.png"],
    creator: "@reefregen",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/assets/favicon.ico", rel: "icon", sizes: "any" },
      { url: "/assets/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/assets/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [
      { url: "/assets/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  verification: {
    // Add Google Search Console verification code here if needed
    // google: "your-verification-code",
  },
};

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  // Include full range so "Black" weight is available for headings
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://reefregen.org";
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Reef.Regen",
    description: "Verifiable coral restoration platform empowering organizations and communities to create blockchain-based records of conservation activities",
    url: baseUrl,
    applicationCategory: "EnvironmentalApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: {
      "@type": "Organization",
      name: "Pollen Labs",
    },
    keywords: "coral restoration, reef conservation, blockchain verification, marine conservation",
  };

  return (
    <html lang="en" className={outfit.variable}>
      <body>
        {/* Structured Data for SEO */}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {/* Privacy-friendly analytics by Plausible */}
        <Script
          src="https://plausible.io/js/pa-2EIohlzUgzyuIbiYKrD1D.js"
          strategy="afterInteractive"
        />
        <Script id="plausible-init" strategy="afterInteractive">
          {`
            window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)};
            plausible.init=plausible.init||function(i){plausible.o=i||{}};
            plausible.init();
          `}
        </Script>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
