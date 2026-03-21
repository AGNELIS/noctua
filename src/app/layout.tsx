import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Noctua by AGNÉLIS",
  description: "Self-development & shadow work app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Antic+Didone&family=Cinzel+Decorative:wght@400;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>{children}</body>
    </html>
  );
}