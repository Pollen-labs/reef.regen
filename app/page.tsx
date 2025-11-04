import Hero from "@/components/landing/Hero";
import Motivation from "@/components/landing/Motivation";
import RegenAction from "@/components/landing/RegenAction";
import ExploreSection from "@/components/landing/ExploreSection";
import FAQ from "@/components/landing/FAQ";

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
