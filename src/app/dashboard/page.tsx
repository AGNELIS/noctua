"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getMoonPhase, getGreeting, type MoonPhaseInfo } from "@/lib/moon";
import { useLanguage } from "@/lib/i18n";

const NAV_CARDS = [
  { titleKey: "nav_journal" as const, descKey: "nav_journal_desc" as const, href: "/journal" },
  { titleKey: "nav_dreams" as const, descKey: "nav_dreams_desc" as const, href: "/dreams" },
  { titleKey: "nav_cycle" as const, descKey: "nav_cycle_desc" as const, href: "/cycle" },
  { titleKey: "nav_symbols" as const, descKey: "nav_symbols_desc" as const, href: "/symbols" },
  { titleKey: "nav_grounding" as const, descKey: "nav_grounding_desc" as const, href: "/grounding" },
  { titleKey: "nav_shop" as const, descKey: "nav_shop_desc" as const, href: "/shop" },
];

function WatercolorCloud({ title, desc, onClick }: { title: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative w-full transition-all duration-300 ease-out hover:scale-[1.05] focus:outline-none active:scale-[0.97]"
      style={{ background: "none", border: "none", padding: 0 }}
    >
      <svg viewBox="0 0 290 170" className="w-full h-auto">
        <ellipse cx="145" cy="85" rx="145" ry="68" fill="#e8a0b0" opacity="0.4"/>
        <ellipse cx="75" cy="60" rx="65" ry="55" fill="#e0909e" opacity="0.5"/>
        <ellipse cx="205" cy="55" rx="62" ry="52" fill="#e0909e" opacity="0.5"/>
        <ellipse cx="145" cy="50" rx="58" ry="46" fill="#e8a8b5" opacity="0.6"/>
        <ellipse cx="120" cy="78" rx="100" ry="42" fill="#d88898" opacity="0.35"/>
        <ellipse cx="170" cy="68" rx="78" ry="34" fill="#e8a0a8" opacity="0.4"/>
        <ellipse cx="100" cy="55" rx="45" ry="28" fill="#f0c0c8" opacity="0.5"/>
        <ellipse cx="185" cy="48" rx="40" ry="25" fill="#f0c0c8" opacity="0.4"/>
        <text
          x="145" y="72"
          textAnchor="middle"
          fontFamily="var(--font-antic), 'Antic Didone', Georgia, serif"
          fontSize="24"
          fontWeight="400"
          fill="#3a0825"
        >
          {title}
        </text>
        <text
          x="145" y="100"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="14"
          fontWeight="400"
          letterSpacing="0.3"
          fill="#5a1838"
        >
          {desc}
        </text>
      </svg>
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
    shadowPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${Math.abs(curve)} ${r} 0 0 ${curve > 0 ? 0 : 1} ${cx} ${cy - r} Z`;
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
  const { t } = useLanguage();
  const [moon, setMoon] = useState<MoonPhaseInfo | null>(null);
  const [greeting, setGreeting] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMoon(getMoonPhase());
    setGreeting(getGreeting());
  }, []);

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
      style={{ backgroundColor: "var(--color-cream)" }}
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
      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <h1
          className="text-lg md:text-xl tracking-[0.3em] uppercase transition-colors duration-500"
          style={{ color: "var(--color-plum)", fontWeight: 700, fontFamily: "'Cinzel Decorative', serif" }}
        >
          Noctua
        </h1>
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
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-2xl mx-auto px-6 pb-12 space-y-10">
        {/* Greeting */}
        <section className="text-center space-y-2 pt-6">
          <p
            className="text-xl md:text-2xl tracking-wide transition-colors duration-500"
            style={{ color: "var(--color-plum)", fontWeight: 500 }}
          >
            {greeting}
          </p>
          <p
            className="text-base md:text-lg tracking-wide transition-colors duration-500"
            style={{ color: "var(--color-mauve)" }}
          >
            {new Date().toLocaleDateString("en-GB", {
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
              {moon.phase}
            </h2>
            <p
              className="text-base md:text-lg tracking-widest uppercase transition-colors duration-500"
              style={{ color: "var(--color-mauve)", fontWeight: 500 }}
            >
              {moon.illumination}% {t("illuminated")}
            </p>
          </div>
          <div className="max-w-md mx-auto">
            <p
              className="text-center text-lg md:text-xl leading-relaxed italic transition-colors duration-500"
              style={{ color: "var(--color-plum)" }}
            >
              &ldquo;{moon.description}&rdquo;
            </p>
          </div>
        </section>

        {/* Divider */}
        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-20" style={{ background: "linear-gradient(to right, transparent, var(--color-gold))" }} />
          <span style={{ color: "var(--color-gold)", fontSize: "12px", opacity: 0.6 }}>&#10023;</span>
          <div className="h-px w-20" style={{ background: "linear-gradient(to left, transparent, var(--color-gold))" }} />
        </div>

        {/* Cloud navigation */}
        <section className="grid grid-cols-1 gap-y-0 max-w-[280px] mx-auto md:max-w-xl md:grid-cols-2 md:gap-x-1">
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