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
    icon: "\u270E",
    bg: "bg-[#f0e4ec]",
    border: "border-[#d4b5c7]/40",
    iconColor: "text-[#8b5e7c]",
  },
  {
    title: "Dream Journal",
    description: "Capture the messages of the night",
    href: "/dreams",
    icon: "\u263D",
    bg: "bg-[#e4e0f0]",
    border: "border-[#9b8ec4]/40",
    iconColor: "text-[#6b5e8b]",
  },
  {
    title: "Cycle Tracker",
    description: "Honour your body's rhythm",
    href: "/cycle",
    icon: "\u25EF",
    bg: "bg-[#f0e0e4]",
    border: "border-[#c49b8e]/40",
    iconColor: "text-[#8b5e5e]",
  },
  {
    title: "Dream Symbols",
    description: "Decode the language of dreams",
    href: "/symbols",
    icon: "\u27D0",
    bg: "bg-[#ede8dc]",
    border: "border-[#c4b68e]/40",
    iconColor: "text-[#7c6b3f]",
  },
  {
    title: "Grounding",
    description: "Return to yourself",
    href: "/grounding",
    icon: "\uD83C\uDF3F",
    bg: "bg-[#e0eddc]",
    border: "border-[#8eb482]/40",
    iconColor: "text-[#4a6040]",
  },
  {
    title: "Shop",
    description: "Themes, symbols & more",
    href: "/shop",
    icon: "\u2661",
    bg: "bg-[#f0ece4]",
    border: "border-[#c8b896]/40",
    iconColor: "text-[#8a7a50]",
  },
];

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
      {/* Cool blue glow behind moon */}
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
          {/* Nocny Błękit — cool blue-steel surface */}
          <radialGradient id="moonSurface" cx="42%" cy="38%" r="58%">
            <stop offset="0%" stopColor="#d8e4f0" />
            <stop offset="30%" stopColor="#c0d0e4" />
            <stop offset="60%" stopColor="#a0b4cc" />
            <stop offset="85%" stopColor="#8498b4" />
            <stop offset="100%" stopColor="#708aaa" />
          </radialGradient>
          {/* Dark navy shadow */}
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
          {/* Blue-grey craters */}
          {craters.map((c, i) => (
            <circle key={i} cx={c.x} cy={c.y} r={c.r} fill="#6882a0" opacity={c.op} />
          ))}
          {shadowPath && <path d={shadowPath} fill="url(#moonShadow)" />}
        </g>
        {/* Subtle steel-blue rim */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#8ca8c8" strokeWidth="0.5" opacity="0.35" />
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
      {/* Decorative stars */}
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

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <h1
          className="text-lg md:text-xl tracking-[0.3em] uppercase"
          style={{ color: "#4a2545", fontWeight: 700, fontFamily: "'Cinzel Decorative', serif" }}
        >
          Noctua
        </h1>
        <button
          onClick={handleLogout}
          disabled={loading}
          className="text-sm md:text-base tracking-wide transition-colors duration-300 hover:opacity-70"
          style={{ color: "#5a3a5a", fontWeight: 500 }}
        >
          {loading ? "..." : "Sign out"}
        </button>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-2xl mx-auto px-6 pb-12 space-y-10">
        {/* Greeting */}
        <section className="text-center space-y-2 pt-6">
          <p className="text-xl md:text-2xl tracking-wide" style={{ color: "#3d2040", fontWeight: 500 }}>
            {greeting}
          </p>
          <p className="text-base md:text-lg tracking-wide" style={{ color: "#5a4a5a" }}>
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
              className="text-3xl md:text-4xl tracking-wide"
              style={{
                color: "#2a1a38",
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 400,
              }}
            >
              {moon.phase}
            </h2>
            <p
              className="text-base md:text-lg tracking-widest uppercase"
              style={{ color: "#5a4a5a", fontWeight: 500 }}
            >
              {moon.illumination}% illuminated
            </p>
          </div>
          <div className="max-w-md mx-auto">
            <p
              className="text-center text-lg md:text-xl leading-relaxed italic"
              style={{ color: "#3d2848" }}
            >
              &ldquo;{moon.description}&rdquo;
            </p>
          </div>
        </section>

        {/* Divider */}
        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-20" style={{ background: "linear-gradient(to right, transparent, rgba(212,175,55,0.3))" }} />
          <span style={{ color: "#d4af37", fontSize: "12px", opacity: 0.6 }}>&#10023;</span>
          <div className="h-px w-20" style={{ background: "linear-gradient(to left, transparent, rgba(212,175,55,0.3))" }} />
        </div>

        {/* Navigation cards */}
        <section className="grid grid-cols-2 gap-4">
          {NAV_CARDS.map((card) => (
            <button
              key={card.title}
              onClick={() => router.push(card.href)}
              className={`group p-5 md:p-6 rounded-2xl border ${card.border} ${card.bg}
                hover:scale-[1.03] hover:shadow-lg
                transition-all duration-300 ease-out
                focus:outline-none focus:ring-2 focus:ring-[#9b8ec4]/30`}
            >
              <div className="flex flex-col items-center mb-3">
                <span
                  className={`text-2xl md:text-3xl ${card.iconColor} group-hover:scale-110 inline-block transition-transform duration-300`}
                >
                  {card.icon}
                </span>
                <h3
                  className="text-lg md:text-xl tracking-wide mt-2"
                  style={{
                    color: "#2a1a28",
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontWeight: 600,
                  }}
                >
                  {card.title}
                </h3>
              </div>
              <p
                className="text-sm md:text-base leading-relaxed text-center"
                style={{ color: "#4a3a4a" }}
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