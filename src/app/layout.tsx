import type { Metadata } from "next";
import { Antic_Didone, Cormorant_Garamond } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/lib/i18n";
import "./globals.css";
import CookieConsent from "@/components/CookieConsent";

const anticDidone = Antic_Didone({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-antic",
});

const cormorant = Cormorant_Garamond({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: "Noctua by AGNÉLIS",
  description:
    "Self-development & shadow work app. The owl sees what the daylight hides.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${anticDidone.variable} ${cormorant.variable}`}>
      <body>
        <ThemeProvider>
          <LanguageProvider>{children}<CookieConsent /></LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}