import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Pwa } from "@/components/Pwa";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin"], weight: ["500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Vinkällaren", template: "%s · Vinkällaren" },
  description: "Håll koll på din vin- och spritsamling, din smakprofil och dina vinprovningar.",
  applicationName: "Vinkällaren",
  appleWebApp: { capable: true, title: "Vinkällaren", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#120e0f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sv" className={`${inter.variable} ${cormorant.variable}`}>
      <body>
        <a href="#main" className="btn btn-gold fixed left-3 top-3 z-50 -translate-y-24 focus:translate-y-0">
          Hoppa till innehåll
        </a>
        <Pwa />
        <Nav />
        <main id="main" className="mx-auto max-w-6xl px-4 pb-[calc(var(--nav-h)+var(--safe-b)+32px)] md:px-6 md:pb-16">
          {children}
        </main>
      </body>
    </html>
  );
}
