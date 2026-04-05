"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n";

export default function CookieConsent() {
  const { language } = useLanguage();
  const pl = language === "pl";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("noctua_cookies_accepted");
    if (!accepted) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("noctua_cookies_accepted", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4" style={{ background: "var(--color-dark)" }}>
      <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-cream)" }}>
          {pl
            ? "Używamy wyłącznie niezbędnych plików cookie do utrzymania sesji logowania. Żadnych reklam, żadnego śledzenia."
            : "We use only essential cookies to maintain your login session. No ads, no tracking."}
          {" "}
          <a href="/privacy" className="underline" style={{ color: "var(--color-gold)" }}>
            {pl ? "Polityka prywatności" : "Privacy Policy"}
          </a>
        </p>
        <button onClick={accept} className="px-4 py-2 rounded-lg text-xs whitespace-nowrap"
          style={{ background: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}>
          OK
        </button>
      </div>
    </div>
  );
}