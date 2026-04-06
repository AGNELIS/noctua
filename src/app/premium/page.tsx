"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

export default function PremiumPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loadingSubscribe, setLoadingSubscribe] = useState(false);
  const [loadingPack, setLoadingPack] = useState(false);
  const [promoCode, setPromoCode] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setLoadingSubscribe(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: billingCycle, promoCode }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoadingSubscribe(false);
      }
    } catch {
      setLoadingSubscribe(false);
    }
  };

  const features = [
    { key: "pf_patterns" as const },
    { key: "pf_monthly" as const },
    { key: "pf_ai_dreams" as const },
    { key: "pf_cycle_moon" as const },
    { key: "pf_seasonal" as const },
    { key: "pf_symbols" as const },
    { key: "pf_weekly" as const },
  ];

  return (
    <div
      className="min-h-screen transition-colors duration-500"
      style={{ background: "var(--color-gradient)" }}
    >
      {/* Header */}
      <header className="px-6 pt-5 pb-2">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm tracking-wide transition-colors"
          style={{ color: "var(--color-mauve)" }}
        >
          ← {t("back")}
        </button>
      </header>

      <main className="max-w-lg mx-auto px-6 pb-12 space-y-6">
        {/* Hero section */}
        <section className="text-center space-y-5 pt-8">
          <p className="text-xs tracking-[0.4em] uppercase" style={{ color: "var(--color-gold)", fontWeight: 600 }}>
            Noctua
          </p>
          <h1
            className="text-3xl md:text-4xl leading-tight"
            style={{
              color: "var(--color-dark)",
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 400,
            }}
          >
            {language === "pl" ? "Widzę twoje wzorce." : "I see your patterns."}
            <br />
            {language === "pl" ? "Pokażę ci je." : "Let me show you."}
          </h1>
          <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: "var(--color-mauve)" }}>
            {language === "pl"
              ? "Nie płacisz za funkcje. Płacisz za to, że ktoś widzi to, czego sama nie widzisz."
              : "You are not paying for features. You are paying for someone to see what you cannot see yourself."}
          </p>
        </section>

        {/* Divider */}
        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-16" style={{ background: "linear-gradient(to right, transparent, var(--color-gold))" }} />
          <span style={{ color: "var(--color-gold)", fontSize: "10px", opacity: 0.5 }}>&#10023;</span>
          <div className="h-px w-16" style={{ background: "linear-gradient(to left, transparent, var(--color-gold))" }} />
        </div>

        {/* What you get */}
        <section className="space-y-4">
          <div className="rounded-2xl p-5 space-y-4" style={{ background: "var(--color-blush)", border: "1px solid color-mix(in srgb, var(--color-dusty-rose) 40%, transparent)" }}>
            {features.map((f, i) => (
              <div key={f.key} className="flex items-start gap-3">
                <span className="text-xs mt-0.5" style={{ color: "var(--color-gold)" }}>✦</span>
                <span className="text-sm leading-relaxed" style={{ color: "var(--color-dark)" }}>
                  {t(f.key)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setBillingCycle("monthly")}
            className="px-5 py-2 rounded-full text-sm tracking-wide transition-all duration-300"
            style={{
              background: billingCycle === "monthly"
                ? "linear-gradient(135deg, var(--color-plum), var(--color-mauve))"
                : "transparent",
              color: billingCycle === "monthly" ? "var(--color-cream)" : "var(--color-mauve)",
              border: billingCycle === "monthly" ? "none" : "1px solid var(--color-dusty-rose)",
            }}
          >
            {t("premium_monthly")}
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className="px-5 py-2 rounded-full text-sm tracking-wide transition-all duration-300 relative"
            style={{
              background: billingCycle === "yearly"
                ? "linear-gradient(135deg, var(--color-plum), var(--color-mauve))"
                : "transparent",
              color: billingCycle === "yearly" ? "var(--color-cream)" : "var(--color-mauve)",
              border: billingCycle === "yearly" ? "none" : "1px solid var(--color-dusty-rose)",
            }}
          >
            {t("premium_yearly")}
            {billingCycle === "yearly" && (
              <span
                className="absolute -top-2 -right-3 text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: "var(--color-gold)", color: "#fff" }}
              >
                -33%
              </span>
            )}
          </button>
        </div>

        {/* Price + CTA */}
        <section className="text-center space-y-5 pt-2">
          <div>
            <span style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "3.5rem", fontWeight: 300 }}>
              {billingCycle === "monthly" ? "£9.99" : "£79.99"}
            </span>
            <span className="text-sm ml-1" style={{ color: "var(--color-mauve)" }}>
              {billingCycle === "monthly" ? t("premium_per_month") : t("premium_per_year")}
            </span>
          </div>

          {billingCycle === "yearly" && (
            <p className="text-xs" style={{ color: "var(--color-plum)" }}>
              £6.67{t("premium_per_month")}
            </p>
          )}

          <button
            onClick={handleSubscribe}
            disabled={loadingSubscribe}
            className="w-full py-4 rounded-2xl text-base tracking-widest uppercase font-medium transition-all duration-300 hover:shadow-lg disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, var(--color-plum), var(--color-mauve))",
              color: "var(--color-cream)",
              boxShadow: "0 4px 20px rgba(74,37,69,0.25)",
            }}
          >
            {loadingSubscribe ? t("loading") : t("premium_subscribe")}
          </button>

          <button
            className="text-xs tracking-wide"
            style={{ color: "var(--color-dusty-rose)" }}
          >
            {t("premium_restore")}
          </button>
        </section>

        {/* Bottom note */}
        <section className="text-center pt-4 pb-8">
          <p className="text-xs italic leading-relaxed" style={{ color: "var(--color-mauve)", opacity: 0.7 }}>
            {language === "pl"
              ? "Premium = Rozumiem cię. Prowadzę cię. Pokazuję ci wzorce."
              : "Premium = I understand you. I guide you. I show you patterns."}
          </p>
        </section>
      </main>
    </div>
  );
}