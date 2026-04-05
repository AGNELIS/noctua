"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

export default function PremiumPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loadingSubscribe, setLoadingSubscribe] = useState(false);
  const [loadingPack, setLoadingPack] = useState(false);

  const handleSubscribe = async () => {
    setLoadingSubscribe(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: billingCycle }),
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
      style={{ backgroundColor: "var(--color-cream)" }}
    >
      {/* Header */}
      <header className="px-6 py-5 space-y-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm tracking-wide transition-colors"
          style={{ color: "var(--color-mauve)" }}
        >
          ← {t("back")}
        </button>
        <h1
          className="text-center text-lg tracking-[0.3em] uppercase"
          style={{
            color: "var(--color-plum)",
            fontWeight: 700,
            fontFamily: "'Cinzel Decorative', serif",
          }}
        >
          {t("premium_title")}
        </h1>
      </header>

      <main className="max-w-lg mx-auto px-6 pb-12 space-y-8">
        {/* Hero */}
        <section className="text-center space-y-3 pt-4">
          <h2
            className="text-2xl md:text-3xl"
            style={{
              color: "var(--color-dark)",
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 500,
            }}
          >
            {t("premium_subtitle")}
          </h2>
        </section>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setBillingCycle("monthly")}
            className="px-5 py-2.5 rounded-full text-sm tracking-wide transition-all duration-300"
            style={{
              background: billingCycle === "monthly"
                ? "linear-gradient(135deg, #9B6B8D, #8B5E7C)"
                : "transparent",
              color: billingCycle === "monthly" ? "#fff" : "var(--color-mauve)",
              border: billingCycle === "monthly" ? "none" : "1px solid var(--color-dusty-rose)",
            }}
          >
            {t("premium_monthly")}
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className="px-5 py-2.5 rounded-full text-sm tracking-wide transition-all duration-300 relative"
            style={{
              background: billingCycle === "yearly"
                ? "linear-gradient(135deg, #9B6B8D, #8B5E7C)"
                : "transparent",
              color: billingCycle === "yearly" ? "#fff" : "var(--color-mauve)",
              border: billingCycle === "yearly" ? "none" : "1px solid var(--color-dusty-rose)",
            }}
          >
            {t("premium_yearly")}
            {billingCycle === "yearly" && (
              <span
                className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: "#D4AF37", color: "#fff" }}
              >
                {t("premium_save")}
              </span>
            )}
          </button>
        </div>

        {/* Price card */}
        <div
          className="rounded-3xl p-6 text-center space-y-5"
          style={{
            background: "linear-gradient(135deg, rgba(155,107,141,0.08), rgba(139,94,124,0.04))",
            border: "1px solid var(--color-dusty-rose)",
          }}
        >
          <div>
            <span style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "3.5rem", fontWeight: 300 }}>
              {billingCycle === "monthly" ? "£9.99" : "£79.99"}
            </span>
            <span
              className="text-base ml-1"
              style={{ color: "var(--color-mauve)" }}
            >
              {billingCycle === "monthly" ? t("premium_per_month") : t("premium_per_year")}
            </span>
          </div>

          {billingCycle === "yearly" && (
            <p className="text-sm" style={{ color: "var(--color-plum)" }}>
              £6.67{t("premium_per_month")} — {t("premium_save")}
            </p>
          )}

          {/* Features list */}
          <div className="space-y-3 text-left pt-2">
            {features.map((f) => (
              <div key={f.key} className="flex items-center gap-3">
                <span className="text-sm" style={{ color: "var(--color-plum)" }}>♡</span>
                <span className="text-sm" style={{ color: "var(--color-dark)" }}>
                  {t(f.key)}
                </span>
              </div>
            ))}
          </div>

          {/* Subscribe button */}
          <button
            onClick={handleSubscribe}
            disabled={loadingSubscribe}
            className="w-full py-3.5 rounded-2xl text-base tracking-wide font-medium transition-all duration-300 hover:shadow-lg disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #9B6B8D, #6b5270)",
              color: "#fff",
            }}
          >
            {loadingSubscribe ? t("loading") : t("premium_subscribe")}
          </button>

          <button
            className="text-xs tracking-wide"
            style={{ color: "var(--color-mauve)" }}
          >
            {t("premium_restore")}
          </button>
        </div>


        <div className="h-8" />
      </main>
    </div>
  );
}