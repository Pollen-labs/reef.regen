import "./globals.css";
import { Outfit } from "next/font/google";
import type { Metadata } from "next";
import Providers from "./providers";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Reef.Regen",
  description: "Reef.Regen is a platform for creating and managing reef restoration projects.",
};

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  // Include full range so “Black” weight is available for headings
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={outfit.variable}>
      <body>
        <Providers>
          <Nav />
          <main style={{ margin: "2rem auto", maxWidth: 720, padding: 16 }}>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
