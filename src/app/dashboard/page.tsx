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
    bg: "bg-[#f0e4ec]",
    border: "border-[#d4b5c7]/40",
    iconColor: "text-[#8b5e7c]",
  },
  {
    title: "Dream Journal",
    description: "Capture the messages of the night",
    href: "/dreams",
    icon: "☽",
    bg: "bg-[#e4e0f0]",
    border: "border-[#9b8ec4]/40",
    iconColor: "text-[#6b5e8b]",
  },
  {
    title: "Cycle Tracker",
    description: "Honour your body's rhythm",
    href: "/cycle",
    icon: "◯",
    bg: "bg-[#f0e0e4]",
    border: "border-[#c49b8e]/40",
    iconColor: "text-[#8b5e5e]",
  },
  {
    title: "Dream Symbols",
    description: "Decode the language of dreams",
    href: "/symbols",
    icon: "⟡",
    bg: "bg-[#ede8dc]",
    border: "border-[#c4b68e]/40",
    iconColor: "text-[#7c6b3f]",
  },
];

function MoonVisual({
  phase,
  illumination,
}: {
  phase: string;
  illumination: number;
}) {
  const isWaxing = phase.includes("Waxing") || phase === "First Quarter";
  const isNewMoon = phase === "New Moon";
  const isFullMoon = phase === "Full Moon";
  const frac = illumination / 100;
  const curve = (1 - frac * 2) * 50;

  const craters = [
    { cx: 38, cy: 35, r: 6, opacity: 0.08 },
    { cx: 55, cy: 25, r: 4, opacity: 0.06 },
    { cx: 45, cy: 55, r: 8, opacity: 0.07 },
    { cx: 60, cy: 50, r: 3, opacity: 0.05 },
    { cx: 30, cy: 50, r: 5, opacity: 0.06 },
    { cx: 50, cy: 40, r: 7, opacity: 0.04 },
    { cx: 35, cy: 65, r: 4, opacity: 0.07 },
    { cx: 62, cy: 38, r: 5, opacity: 0.05 },
  ];

  let shadowPath = "";
  if (isNewMoon) {
    shadowPath = "M 50 6 A 44 44 0 0 1 50 94 A 44 44 0 0 1 50 6 Z";
  } else if (isWaxing) {
    shadowPath = `M 50 6 A 44 44 0 0 0 50 94 A ${curve} 44 0 0 1 50 6 Z`;
  } else {
    shadowPath = `M 50 6 A 44 44 0 0 1 50 94 A ${-curve} 44 0 0 0 50 6 Z`;
  }

  return (
    <svg
      viewBox="0 0 100 100"
      className="w-40 h-40 md:w-52 md:h-52"
      style={{ filter: "drop-shadow(0 4px 20px rgba(212, 175, 55, 0.15))" }}
    >
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f5e6d3" stopOpacity="0.6" />
          <stop offset="60%" stopColor="#e8d0b8" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#dcc4a8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="surface" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#faf0e0" />
          <stop offset="40%" stopColor="#ede0c8" />
          <stop offset="100%" stopColor="#d4c4a0" />
        </radialGradient>
        <radialGradient id="shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3d2e4a" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#2a1f35" stopOpacity="0.95" />
        </radialGradient>
        <clipPath id="clip">
          <circle cx="50" cy="50" r="44" />
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r="49" fill="url(#glow)" />
      <g clipPath="url(#clip)">
        <circle cx="50" cy="50" r="44" fill="url(#surface)" />
        {craters.map((c, i) => (
          <circle
            key={i}
            cx={c.cx}
            cy={c.cy}
            r={c.r}
            fill="#c4a87a"
            opacity={c.opacity}
          />
        ))}
        {!isFullMoon && <path d={shadowPath} fill="url(#shadow)" />}
      </g>
      <circle
        cx="50"
        cy="50"
        r="44"
        fill="none"
        stroke="#f5e6d3"
        strokeWidth="0.5"
        opacity="0.4"
      />
    </svg>
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
      className="min-h-screen relative"
      style={{
        background:
          "linear-gradient(to bottom, #f8f0e8, #f5ede4, #efe4dc)",
      }}
    >
      {/* Floral background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <svg
          className="absolute -top-10 -right-10 w-80 h-80 opacity-[0.07]"
          viewBox="0 0 300 300"
          fill="none"
        >
          <path
            d="M150 50 C180 80, 220 70, 250 100 C230 130, 200 120, 180 150 C210 160, 240 200, 220 240 C190 220, 160 230, 150 200 C140 230, 110 220, 80 240 C60 200, 90 160, 120 150 C100 120, 70 130, 50 100 C80 70, 120 80, 150 50Z"
            fill="#8b5e7c"
          />
          <circle cx="150" cy="140" r="20" fill="#c49b8e" />
        </svg>
        <svg
          className="absolute -bottom-16 -left-16 w-96 h-96 opacity-[0.05]"
          viewBox="0 0 400 400"
        >
          <path
            d="M200 380 C200 300, 160 250, 120 200 C100 170, 110 130, 140 110 C170 90, 200 100, 200 130"
            stroke="#6b5e8b"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M200 380 C200 300, 240 250, 280 200 C300 170, 290 130, 260 110 C230 90, 200 100, 200 130"
            stroke="#6b5e8b"
            strokeWidth="2"
            fill="none"
          />
          <ellipse
            cx="120"
            cy="180"
            rx="30"
            ry="45"
            fill="#9b8ec4"
            opacity="0.3"
            transform="rotate(-20 120 180)"
          />
          <ellipse
            cx="280"
            cy="180"
            rx="30"
            ry="45"
            fill="#9b8ec4"
            opacity="0.3"
            transform="rotate(20 280 180)"
          />
        </svg>
        <svg
          className="absolute top-1/3 -right-6 w-48 h-64 opacity-[0.06]"
          viewBox="0 0 200 300"
        >
          <path
            d="M100 280 C100 220, 80 180, 60 140 C50 110, 60 80, 80 60"
            stroke="#8b5e7c"
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="80" cy="60" r="12" fill="#c49b8e" opacity="0.4" />
          <circle cx="55" cy="130" r="8" fill="#9b8ec4" opacity="0.3" />
        </svg>
      </div>

      {/* Header */}
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
        {/* Greeting */}
        <section className="text-center space-y-1 pt-4">
          <p
            className="text-sm tracking-wide font-light"
            style={{ color: "#6b5270" }}
          >
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

        {/* Moon Phase */}
        <section className="flex flex-col items-center space-y-5">
          <MoonVisual phase={moon.phase} illumination={moon.illumination} />
          <div className="text-center space-y-2">
            <h2
              className="text-2xl font-light tracking-wide"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                color: "#3d2e4a",
              }}
            >
              {moon.phase}
            </h2>
            <p
              className="text-xs tracking-widest uppercase"
              style={{ color: "#9b8a7a" }}
            >
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

        {/* Divider */}
        <div className="flex items-center justify-center gap-4">
          <div
            className="h-px w-20"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(196,176,160,0.4))",
            }}
          />
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            style={{ color: "#c4a87a" }}
          >
            <path
              d="M8 0 L9.5 6.5 L16 8 L9.5 9.5 L8 16 L6.5 9.5 L0 8 L6.5 6.5 Z"
              fill="currentColor"
              opacity="0.4"
            />
          </svg>
          <div
            className="h-px w-20"
            style={{
              background:
                "linear-gradient(to left, transparent, rgba(196,176,160,0.4))",
            }}
          />
        </div>

        {/* Navigation Cards */}
        <section className="grid grid-cols-2 gap-4">
          {NAV_CARDS.map((card) => (
            <button
              key={card.title}
              onClick={() => router.push(card.href)}
              className={`group text-left p-5 rounded-2xl border ${card.border} ${card.bg}
                hover:scale-[1.03] hover:shadow-lg
                transition-all duration-300 ease-out
                focus:outline-none focus:ring-2 focus:ring-[#9b8ec4]/30`}
            >
              <span
                className={`text-xl ${card.iconColor} group-hover:scale-110 inline-block transition-transform duration-300`}
              >
                {card.icon}
              </span>
              <h3
                className="mt-3 text-sm font-medium tracking-wide"
                style={{ color: "#3d2e4a" }}
              >
                {card.title}
              </h3>
              <p
                className="mt-1 text-xs leading-relaxed"
                style={{ color: "#8a7a6a" }}
              >
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