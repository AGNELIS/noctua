"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getMoonPhase, getMoonSign, getGreeting, getDailyInsight, type MoonPhaseInfo, type MoonSignInfo } from "@/lib/moon";
import { useLanguage } from "@/lib/i18n";
import NotificationBell from "@/components/NotificationBell";
import { getEffectivePerms } from "@/lib/effective-perms";

const NAV_CARDS = [
  { titleKey: "nav_journal" as const, descKey: "nav_journal_desc" as const, href: "/journal" },
  { titleKey: "nav_shadow" as const, descKey: "nav_shadow_desc" as const, href: "/shadow-work" },
  { titleKey: "nav_dreams" as const, descKey: "nav_dreams_desc" as const, href: "/dreams" },
  { titleKey: "nav_symbols" as const, descKey: "nav_symbols_desc" as const, href: "/symbols" },
  { titleKey: "nav_cycle" as const, descKey: "nav_cycle_desc" as const, href: "/cycle" },
  { titleKey: "nav_grounding" as const, descKey: "nav_grounding_desc" as const, href: "/grounding" },
  { titleKey: "nav_reports" as const, descKey: "nav_reports_desc" as const, href: "/reports" },
  { titleKey: "nav_shop" as const, descKey: "nav_shop_desc" as const, href: "/shop" },
];

function WatercolorCloud({ title, desc, onClick }: { title: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative w-full flex items-center justify-center transition-all duration-300 ease-out hover:scale-[1.05] focus:outline-none active:scale-[0.97]"
      style={{ background: "none", border: "none", padding: "8px 0" }}
    >
      <img
        src="/noctua-cloud.png"
        alt=""
        className="w-60 md:w-48 h-auto"
        style={{ filter: "drop-shadow(0 2px 8px rgba(180,140,170,0.2))" }}
      />
      <div className="absolute inset-0 flex items-center justify-center px-8">
        <span
          style={{
            color: "#3a0825",
            fontFamily: "var(--font-antic), 'Antic Didone', Georgia, serif",
            fontSize: "1.25rem",
            fontWeight: 400,
          }}
        >
          {title}
        </span>
      </div>
    </button>
  );
}

function ElegantMoon({ phase, illumination }: { phase: string; illumination: number }) {
  const isWaxing = phase.includes("Waxing") || phase === "First Quarter";
  const isNewMoon = phase === "New Moon";
  const isFullMoon = phase === "Full Moon";
  const frac = illumination / 100;
  const r = 44;
  const cx = 50, cy = 50;
  const curve = (1 - frac * 2) * r;

  let shadowPath = "";
  if (isNewMoon) {
    shadowPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${r} ${r} 0 0 1 ${cx} ${cy - r} Z`;
  } else if (isFullMoon) {
    shadowPath = "";
  } else if (isWaxing) {
    shadowPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} A ${Math.abs(curve)} ${r} 0 0 ${curve > 0 ? 1 : 0} ${cx} ${cy - r} Z`;
  } else {
    shadowPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${Math.abs(curve)} ${r} 0 0 ${curve > 0 ? 1 : 0} ${cx} ${cy - r} Z`;
  }

  const craters = [
    { x: 36, y: 30, r: 7, op: 0.12 },
    { x: 56, y: 26, r: 4, op: 0.09 },
    { x: 44, y: 54, r: 10, op: 0.09 },
    { x: 62, y: 48, r: 3.5, op: 0.07 },
    { x: 30, y: 50, r: 5.5, op: 0.10 },
    { x: 52, y: 40, r: 5, op: 0.07 },
    { x: 38, y: 68, r: 4, op: 0.09 },
    { x: 60, y: 64, r: 5, op: 0.08 },
    { x: 48, y: 72, r: 3, op: 0.06 },
  ];

  return (
    <div className="relative flex items-center justify-center">
      <div
        className="absolute w-52 h-52 md:w-64 md:h-64 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(140,170,210,0.15) 0%, rgba(100,130,180,0.06) 40%, transparent 65%)",
        }}
      />
      <svg
        viewBox="0 0 100 100"
        className="relative w-40 h-40 md:w-56 md:h-56"
        style={{ filter: "drop-shadow(0 2px 20px rgba(100,140,200,0.25))" }}
      >
        <defs>
          <radialGradient id="moonSurface" cx="42%" cy="38%" r="58%">
            <stop offset="0%" stopColor="#d8e4f0" />
            <stop offset="30%" stopColor="#c0d0e4" />
            <stop offset="60%" stopColor="#a0b4cc" />
            <stop offset="85%" stopColor="#8498b4" />
            <stop offset="100%" stopColor="#708aaa" />
          </radialGradient>
          <radialGradient id="moonShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0c1a2e" stopOpacity="0.92" />
            <stop offset="60%" stopColor="#081428" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#050e1e" stopOpacity="0.98" />
          </radialGradient>
          <clipPath id="moonClip">
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>
        </defs>
        <g clipPath="url(#moonClip)">
          <circle cx={cx} cy={cy} r={r} fill="url(#moonSurface)" />
          {craters.map((c, i) => (
            <circle key={i} cx={c.x} cy={c.y} r={c.r} fill="#6882a0" opacity={c.op} />
          ))}
          {shadowPath && <path d={shadowPath} fill="url(#moonShadow)" />}
        </g>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#8ca8c8" strokeWidth="0.5" opacity="0.35" />
      </svg>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { t, language } = useLanguage();

  const moonPhaseKey: Record<string, string> = {
    "New Moon": "moon_new",
    "Waxing Crescent": "moon_waxing_crescent",
    "First Quarter": "moon_first_quarter",
    "Waxing Gibbous": "moon_waxing_gibbous",
    "Full Moon": "moon_full",
    "Waning Gibbous": "moon_waning_gibbous",
    "Last Quarter": "moon_last_quarter",
    "Waning Crescent": "moon_waning_crescent",
  };
  const [moon, setMoon] = useState<MoonPhaseInfo | null>(null);
  const [greeting, setGreeting] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    setMoon(getMoonPhase());
    setGreeting(getGreeting(language));

    // Check premium onboarding
    const checkOnboarding = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("is_premium, is_admin, admin_test_mode, birth_date").eq("id", user.id).single();
      const { isPremium } = getEffectivePerms(profile);
      if (isPremium) {
        setIsPremium(true);
        if (!profile?.birth_date) setNeedsOnboarding(true);
      }
    };
    checkOnboarding();

    // Check entry milestones (notifications) — fire-and-forget, ignore network failures
    fetch("/api/check-entry-milestones", { method: "POST" }).catch(() => {});

    // Check referral completion
    const checkReferral = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Am I a referred user with pending status?
      const { data: myReferral } = await supabase
        .from("referrals")
        .select("id, status")
        .eq("referred_id", user.id)
        .eq("status", "pending")
        .maybeSingle();

      if (!myReferral) return;

      // Count my entries (journal + shadow work)
      const { count: jCount } = await supabase
        .from("journal_entries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { count: sCount } = await supabase
        .from("shadow_work_entries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      const total = (jCount || 0) + (sCount || 0);

      if (total >= 3) {
        await supabase
          .from("referrals")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", myReferral.id);
      }
    };

    checkReferral();
  }, [language]);

  const handleLogout = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!moon) return null;

  return (
    <div
      className="min-h-screen relative overflow-hidden transition-colors duration-500"
      style={{ background: "var(--color-gradient)" }}
    >
      {/* Decorative stars */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute top-20 left-16 w-6 h-6" viewBox="0 0 20 20" style={{ opacity: 0.12 }}>
          <path d="M10 2 L11.5 8.5 L18 10 L11.5 11.5 L10 18 L8.5 11.5 L2 10 L8.5 8.5Z" fill="var(--color-gold)" />
        </svg>
        <svg className="absolute bottom-40 right-20 w-5 h-5" viewBox="0 0 20 20" style={{ opacity: 0.09 }}>
          <path d="M10 2 L11.5 8.5 L18 10 L11.5 11.5 L10 18 L8.5 11.5 L2 10 L8.5 8.5Z" fill="var(--color-gold)" />
        </svg>
        <svg className="absolute top-[55%] left-10 w-4 h-4" viewBox="0 0 20 20" style={{ opacity: 0.1 }}>
          <path d="M10 2 L11.5 8.5 L18 10 L11.5 11.5 L10 18 L8.5 11.5 L2 10 L8.5 8.5Z" fill="var(--color-gold)" />
        </svg>
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6">
        <h1
          className="text-lg md:text-xl tracking-[0.3em] uppercase transition-colors duration-500"
          style={{ color: "var(--color-plum)", fontWeight: 700, fontFamily: "'Cinzel Decorative', serif" }}
        >
          Noctua
        </h1>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={() => router.push("/profile")}
            className="transition-all hover:scale-110"
            aria-label="Profile"
          >
            <img
              src="/noctua-owl-icon.png"
              alt="Profile"
              className="w-16 h-16 object-contain"
            />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-2xl mx-auto px-6 pb-12 space-y-10">
        {/* Greeting */}
        <section className="text-center space-y-2 pt-6">
          <p
            className="text-2xl md:text-3xl tracking-wide transition-colors duration-500"
            style={{ color: "var(--color-plum)", fontWeight: 500 }}
          >
            {greeting}
          </p>
          <p
            className="text-base md:text-lg tracking-wide transition-colors duration-500"
            style={{ color: "var(--color-mauve)" }}
          >
            {new Date().toLocaleDateString(language === "pl" ? "pl-PL" : "en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </section>

        {/* Moon */}
        <section className="flex flex-col items-center space-y-6">
          <ElegantMoon phase={moon.phase} illumination={moon.illumination} />
          <div className="text-center space-y-3">
            <h2
              className="text-3xl md:text-4xl tracking-wide transition-colors duration-500"
              style={{
                color: "var(--color-dark)",
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 400,
              }}
            >
              {t((moonPhaseKey[moon.phase] || "moon_new") as any)}
            </h2>
            {(() => {
              const moonSign = getMoonSign();
              return (
                <p
                  className="text-lg tracking-wider transition-colors duration-500"
                  style={{ color: "var(--color-plum)", fontWeight: 500, fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  {language === "pl"
                    ? `w ${moonSign.signPl} · ${moonSign.elementPl}`
                    : `in ${moonSign.sign} · ${moonSign.element}`}
                </p>
              );
            })()}
            <p
              className="text-base md:text-lg tracking-widest uppercase transition-colors duration-500"
              style={{ color: "var(--color-mauve)", fontWeight: 500 }}
            >
              {moon.illumination}% {t("illuminated")}
            </p>
          </div>
          <div className="max-w-md mx-auto text-center">
            <p
              className="text-sm uppercase tracking-widest mb-3"
              style={{ color: "var(--color-dark)", fontWeight: 600 }}
            >
              {language === "pl" ? "Praca z cieniem" : "Shadow Work"}
            </p>
            <p
              className="text-lg md:text-xl leading-relaxed transition-colors duration-500"
              style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
            >
              {getDailyInsight(moon.phase, language)}
            </p>
          </div>
        </section>

        {/* Onboarding reminder */}
        {needsOnboarding && (
          <section className="max-w-md mx-auto">
            <button
              onClick={() => router.push("/onboarding")}
              className="w-full rounded-2xl p-4 text-center transition-all hover:opacity-90"
              style={{ background: "var(--color-blush)", border: "1px solid color-mix(in srgb, var(--color-gold) 40%, transparent)" }}
            >
              <p className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: "var(--color-gold)", fontWeight: 600 }}>
                {language === "pl" ? "Dokończ konfigurację" : "Complete your setup"}
              </p>
              <p className="text-sm" style={{ color: "var(--color-dark)" }}>
                {language === "pl"
                  ? "Podaj dane urodzeniowe żebym mogła czytać Twoje wzorce głębiej."
                  : "Add your birth data so I can read your patterns deeper."}
              </p>
            </button>
          </section>
        )}

        {/* Divider */}
        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-20" style={{ background: "linear-gradient(to right, transparent, var(--color-plum))" }} />
          <span style={{ color: "var(--color-plum)", fontSize: "16px" }}>♡</span>
          <div className="h-px w-20" style={{ background: "linear-gradient(to left, transparent, var(--color-plum))" }} />
        </div>

        {/* Cloud navigation */}
        <section className="grid grid-cols-1 gap-y-0 max-w-[300px] mx-auto md:grid-cols-2 md:max-w-md md:gap-x-0">
          {NAV_CARDS.map((card) => (
            <WatercolorCloud
              key={card.titleKey}
              title={t(card.titleKey)}
              desc={t(card.descKey)}
              onClick={() => router.push(card.href)}
            />
          ))}
        </section>

        <div className="h-4" />
        <p className="text-center pb-8 tracking-[0.35em]"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "0.85rem",
            fontWeight: 500,
            background: "linear-gradient(135deg, #B8860B, #D4AF37, #E8C860, #D4AF37, #B8860B)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
          by AGNÉLIS
        </p>
      </main>
    </div>
  );
}