import "./globals.css";
import { Outfit } from "next/font/google";
import type { Metadata } from "next";
import Providers from "./providers";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Reef.Regen",
  description: "Reef.Regen is a platform for creating and managing reef restoration projects.",
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
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
