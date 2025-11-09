import type { Metadata } from "next";
import Hero from "@/components/landing/Hero";
import Motivation from "@/components/landing/Motivation";
import RegenAction from "@/components/landing/RegenAction";
import ExploreSection from "@/components/landing/ExploreSection";
import FAQ from "@/components/landing/FAQ";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://reefregen.org";

export const metadata: Metadata = {
  title: "Home",
  description: "Join Reef.Regen to document, verify, and showcase your coral restoration activities. Create verifiable, blockchain-based records of conservation work with transparency and immutability.",
  openGraph: {
    title: "Reef.Regen - Verifiable Coral Restoration Platform",
    description: "Join Reef.Regen to document, verify, and showcase your coral restoration activities.",
    url: baseUrl,
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
    description: "Join Reef.Regen to document, verify, and showcase your coral restoration activities.",
    images: ["/assets/OG-reefregen-org.png"],
  },
};

export default function Page() {
  return (
    <div className="relative">
      {/* Order: hero → motivation → regen action + explore CTA → FAQ */}
      <Hero />
      <Motivation />
      <RegenAction />
      <ExploreSection />
      <FAQ />
    </div>
  );
}
