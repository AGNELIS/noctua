"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getMoonPhase, getGreeting, type MoonPhaseInfo } from "@/lib/moon";

const NAV_CARDS = [
  {
    title: "Journal",
    description: "Reflect on your inner world",
    href: "/journal",
    icon: "✦",
    bg: "rgba(232, 213, 224, 0.65)",
    border: "rgba(212, 181, 199, 0.5)",
    iconColor: "#8b5e7c",
  },
  {
    title: "Dream Journal",
    description: "Capture the messages of the night",
    href: "/dreams",
    icon: "☽",
    bg: "rgba(228, 224, 240, 0.65)",
    border: "rgba(155, 142, 196, 0.5)",
    iconColor: "#6b5e8b",
  },
  {
    title: "Cycle Tracker",
    description: "Honour your body's rhythm",
    href: "/cycle",
    icon: "◯",
    bg: "rgba(240, 224, 228, 0.65)",
    border: "rgba(196, 155, 142, 0.5)",
    iconColor: "#8b5e5e",
  },
  {
    title: "Dream Symbols",
    description: "Decode the language of dreams",
    href: "/symbols",
    icon: "⟡",
    bg: "rgba(237, 232, 220, 0.65)",
    border: "rgba(196, 182, 142, 0.5)",
    iconColor: "#7c6b3f",
  },
];

function ElegantMoon({ phase, illumination }: { phase: string; illumination: number }) {
  const isWaxing = phase.includes("Waxing") || phase === "First Quarter";
  const isNewMoon = phase === "New Moon";
  const isFullMoon = phase === "Full Moon";
  const frac = illumination / 100;
  const curve = (1 - frac * 2) * 44;

  let shadowPath = "";
  if (isNewMoon) {
    shadowPath = "M 50 6 A 44 44 0 0 1 50 94 A 44 44 0 0 1 50 6 Z";
  } else if (isWaxing) {
    shadowPath = `M 50 6 A 44 44 0 0 0 50 94 A ${curve} 44 0 0 1 50 6 Z`;
  } else {
    shadowPath = `M 50 6 A 44 44 0 0 1 50 94 A ${-curve} 44 0 0 0 50 6 Z`;
  }

  return (
    <div className="relative flex items-center justify-center">
      <div
        className="absolute w-52 h-52 md:w-68 md:h-68 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(192,188,200,0.12) 0%, transparent 65%)",
        }}
      />
      <svg viewBox="0 0 100 100" className="relative w-32 h-32 md:w-44 md:h-44">
        <defs>
          <radialGradient id="litSurface" cx="42%" cy="38%" r="55%">
            <stop offset="0%" stopColor="#f0eff2" />
            <stop offset="35%" stopColor="#e0dde5" />
            <stop offset="70%" stopColor="#c8c4d0" />
            <stop offset="100%" stopColor="#b0aab8" />
          </radialGradient>
          <radialGradient id="darkSide" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3d2e4a" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#2a1f35" stopOpacity="0.92" />
          </radialGradient>
          <clipPath id="moonClip">
            <circle cx="50" cy="50" r="44" />
          </clipPath>
        </defs>
        <g clipPath="url(#moonClip)">
          <circle cx="50" cy="50" r="44" fill="url(#litSurface)" />
          <circle cx="36" cy="33" r="6" fill="#b8b2c0" opacity="0.2" />
          <circle cx="56" cy="26" r="3.5" fill="#b8b2c0" opacity="0.15" />
          <circle cx="43" cy="55" r="7" fill="#b0aab8" opacity="0.15" />
          <circle cx="60" cy="48" r="4" fill="#b8b2c0" opacity="0.12" />
          <circle cx="30" cy="52" r="3" fill="#b0aab8" opacity="0.18" />
          <circle cx="52" cy="68" r="5" fill="#b8b2c0" opacity="0.12" />
          <ellipse cx="40" cy="36" rx="12" ry="9" fill="#e8e6ec" opacity="0.25" />
          {!isFullMoon && <path d={shadowPath} fill="url(#darkSide)" />}
        </g>
        <circle cx="50" cy="50" r="44" fill="none" stroke="#c8c4d0" strokeWidth="0.4" opacity="0.5" />
      </svg>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
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
      className="min-h-screen relative overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 70% 10%, rgba(155,107,138,0.06) 0%, transparent 50%),
          radial-gradient(ellipse at 20% 80%, rgba(155,142,196,0.05) 0%, transparent 40%),
          linear-gradient(to bottom, #faf5f0, #f5ede6, #f0e6de)
        `,
      }}
    >
      {/* Decorative images — replace src with your uploaded files */}
      {/* <img src="/your-owl-1.png" alt="" className="fixed top-0 right-0 w-64 opacity-10 pointer-events-none" /> */}
      {/* <img src="/your-owl-2.png" alt="" className="fixed bottom-0 left-0 w-48 opacity-8 pointer-events-none" /> */}

      {/* Tiny gold stars */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute top-20 left-16 w-6 h-6" viewBox="0 0 20 20" style={{ opacity: 0.12 }}>
          <path d="M10 2 L11.5 8.5 L18 10 L11.5 11.5 L10 18 L8.5 11.5 L2 10 L8.5 8.5Z" fill="#d4af37" />
        </svg>
        <svg className="absolute bottom-40 right-20 w-5 h-5" viewBox="0 0 20 20" style={{ opacity: 0.09 }}>
          <path d="M10 2 L11.5 8.5 L18 10 L11.5 11.5 L10 18 L8.5 11.5 L2 10 L8.5 8.5Z" fill="#d4af37" />
        </svg>
        <svg className="absolute top-[55%] left-10 w-4 h-4" viewBox="0 0 20 20" style={{ opacity: 0.1 }}>
          <path d="M10 2 L11.5 8.5 L18 10 L11.5 11.5 L10 18 L8.5 11.5 L2 10 L8.5 8.5Z" fill="#d4af37" />
        </svg>
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <h1
          className="text-sm tracking-[0.35em] uppercase font-light"
          style={{ color: "#6b5270" }}
        >
          Noctua
        </h1>
        <button
          onClick={handleLogout}
          disabled={loading}
          className="text-xs tracking-wide transition-colors duration-300"
          style={{ color: "#9b8a7a" }}
        >
          {loading ? "..." : "Sign out"}
        </button>
      </header>

      <main className="relative z-10 max-w-xl mx-auto px-6 pb-12 space-y-10">
        <section className="text-center space-y-1 pt-4">
          <p className="text-sm tracking-wide font-light" style={{ color: "#6b5270" }}>
            {greeting}
          </p>
          <p className="text-xs tracking-wide" style={{ color: "#9b8a7a" }}>
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </section>

        <section className="flex flex-col items-center space-y-5">
          <ElegantMoon phase={moon.phase} illumination={moon.illumination} />
          <div className="text-center space-y-2">
            <h2
              className="text-2xl font-light tracking-wide"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                color: "#3d2e4a",
              }}
            >
              {moon.phase}
            </h2>
            <p className="text-xs tracking-widest uppercase" style={{ color: "#9b8a7a" }}>
              {moon.illumination}% illuminated
            </p>
          </div>
          <div className="max-w-sm mx-auto">
            <p
              className="text-center text-sm leading-relaxed italic"
              style={{ color: "#7a6580" }}
            >
              &ldquo;{moon.description}&rdquo;
            </p>
          </div>
        </section>

        <div className="flex items-center justify-center gap-4">
          <div
            className="h-px w-20"
            style={{ background: "linear-gradient(to right, transparent, rgba(212,175,55,0.3))" }}
          />
          <span style={{ color: "#d4af37", fontSize: "10px", opacity: 0.6 }}>✧</span>
          <div
            className="h-px w-20"
            style={{ background: "linear-gradient(to left, transparent, rgba(212,175,55,0.3))" }}
          />
        </div>

        <section className="grid grid-cols-2 gap-4">
          {NAV_CARDS.map((card) => (
            <button
              key={card.title}
              onClick={() => router.push(card.href)}
              className="group text-left p-5 rounded-2xl backdrop-blur-sm
                hover:scale-[1.03] hover:shadow-lg
                transition-all duration-300 ease-out
                focus:outline-none focus:ring-2 focus:ring-[#9b8ec4]/30"
              style={{
                background: card.bg,
                border: `1px solid ${card.border}`,
              }}
            >
              <span
                className="text-xl group-hover:scale-110 inline-block transition-transform duration-300"
                style={{ color: card.iconColor }}
              >
                {card.icon}
              </span>
              <h3 className="mt-3 text-sm font-medium tracking-wide" style={{ color: "#3d2e4a" }}>
                {card.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: "#8a7a6a" }}>
                {card.description}
              </p>
            </button>
          ))}
        </section>

        <div className="h-4" />
      </main>
    </div>
  );
}