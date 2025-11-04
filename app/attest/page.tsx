import { WalletConnect } from "@/components/WalletConnect";
import { AttestSection } from "@/components/AttestSection";

export default function Page() {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <h1>Attest</h1>
      <WalletConnect />
      {/* Soft onboarding + form (client wrapper) */}
      <AttestSection />
    </div>
  );
}
