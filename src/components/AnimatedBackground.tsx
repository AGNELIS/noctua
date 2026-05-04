"use client";

import { useTheme } from "@/context/ThemeContext";
import { useEffect, useRef } from "react";

const ANIMATED_THEMES: Record<string, string> = {
  "Default": "default-owls",
  "Moonstone": "moonstone",
  "Velvet Night": "velvet",
  "Obsidian Rose": "obsidian",
  "Falling Stars": "falling-stars",
  "Cherry Rain": "cherry-rain",
  "Ocean Drift": "ocean-drift",
};

export default function AnimatedBackground() {
  const { activeThemeName } = useTheme();
  const starsRef = useRef<HTMLDivElement>(null);
  const petalsRef = useRef<HTMLDivElement>(null);

  const animationType = activeThemeName ? ANIMATED_THEMES[activeThemeName] || null : "default-owls";

  useEffect(() => {
    if (animationType === "velvet" && starsRef.current && starsRef.current.childNodes.length === 0) {
      for (let i = 0; i < 60; i++) {
        const s = document.createElement("div");
        s.className = "noctua-star";
        s.style.left = Math.random() * 100 + "%";
        s.style.top = Math.random() * 100 + "%";
        s.style.setProperty("--dur", (2 + Math.random() * 4) + "s");
        s.style.animationDelay = (Math.random() * 5) + "s";
        const size = (1 + Math.random() * 2) + "px";
        s.style.width = size;
        s.style.height = size;
        starsRef.current.appendChild(s);
      }
    }
    if (animationType === "falling-stars" && starsRef.current && starsRef.current.childNodes.length === 0) {
      for (let i = 0; i < 15; i++) {
        const s = document.createElement("div");
        s.className = "noctua-fstar";
        s.style.left = (5 + Math.random() * 80) + "%";
        s.style.top = (Math.random() * 30) + "%";
        s.style.animation = `noctuaFallStar ${3 + Math.random() * 4}s linear infinite`;
        s.style.animationDelay = (Math.random() * 8) + "s";
        const size = (1.5 + Math.random() * 2) + "px";
        s.style.width = size;
        s.style.height = size;
        starsRef.current.appendChild(s);
        const t = document.createElement("div");
        t.className = "noctua-ftrail";
        t.style.left = s.style.left;
        t.style.top = s.style.top;
        t.style.animation = `noctuaFallTrail ${3 + Math.random() * 4}s linear infinite`;
        t.style.animationDelay = s.style.animationDelay;
        starsRef.current.appendChild(t);
      }
    }
    if (animationType === "cherry-rain" && petalsRef.current && petalsRef.current.childNodes.length === 0) {
      for (let i = 0; i < 18; i++) {
        const p = document.createElement("div");
        p.className = "noctua-cherry";
        p.textContent = "🍒";
        p.style.left = (Math.random() * 100) + "%";
        p.style.top = (-10 - Math.random() * 20) + "%";
        p.style.fontSize = (14 + Math.random() * 10) + "px";
        p.style.opacity = "0";
        p.style.setProperty("--rot", (Math.random() * 360) + "deg");
        p.style.animation = `noctuaCherryFall ${12 + Math.random() * 10}s ease-in-out infinite`;
        p.style.animationDelay = (Math.random() * 10) + "s";
        petalsRef.current.appendChild(p);
      }
    }
    if (animationType === "obsidian" && petalsRef.current && petalsRef.current.childNodes.length === 0) {
      for (let i = 0; i < 14; i++) {
        const p = document.createElement("div");
        p.className = "noctua-petal";
        p.textContent = "🌸";
        p.style.left = (5 + Math.random() * 90) + "%";
        p.style.setProperty("--dur", (14 + Math.random() * 12) + "s");
        p.style.setProperty("--rot", (Math.random() * 360) + "deg");
        p.style.animationDelay = (Math.random() * 12) + "s";
        p.style.fontSize = (16 + Math.random() * 8) + "px";
        petalsRef.current.appendChild(p);
      }
    }

    return () => {
      if (starsRef.current) starsRef.current.innerHTML = "";
      if (petalsRef.current) petalsRef.current.innerHTML = "";
    };
  }, [animationType]);

  return (
    <>
      <style>{`
        .noctua-anim-layer {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 11;
          opacity: 0.45;
          overflow: hidden;
        }
        .noctua-aurora-wave {
          position: absolute;
          width: 200%;
          height: 120px;
          opacity: 0.25;
          border-radius: 50%;
          filter: blur(30px);
        }
        .noctua-aw1 {
          background: #9B6BCD;
          top: 15%;
          left: -50%;
          animation: noctuaAuroraFlow 8s ease-in-out infinite;
        }
        .noctua-aw2 {
          background: #7868a0;
          top: 45%;
          left: -30%;
          animation: noctuaAuroraFlow 12s ease-in-out infinite reverse;
        }
        .noctua-aw3 {
          background: #b498c8;
          top: 70%;
          left: -60%;
          animation: noctuaAuroraFlow 10s ease-in-out infinite 2s;
        }
        @keyframes noctuaAuroraFlow {
          0%, 100% { transform: translateX(-10%) scaleY(1); }
          50% { transform: translateX(15%) scaleY(1.3); }
        }
        .noctua-heart {
          position: absolute;
          bottom: -20px;
          opacity: 0;
          animation: noctuaHeartRise var(--hdur) ease-in-out infinite;
          animation-delay: var(--hdelay);
          color: rgba(155, 107, 205, 0.7);
          font-size: var(--hsize);
          line-height: 1;
        }
        @keyframes noctuaHeartRise {
          0% { transform: translateY(0) scale(0.6) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          50% { transform: translateY(-50vh) scale(1) rotate(15deg); opacity: 0.8; }
          90% { opacity: 0.4; }
          100% { transform: translateY(-110vh) scale(0.8) rotate(-10deg); opacity: 0; }
        }
        .noctua-star {
          position: absolute;
          background: #fff;
          border-radius: 50%;
          animation: noctuaTwinkle var(--dur) ease-in-out infinite;
          opacity: 0;
        }
        @keyframes noctuaTwinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        .noctua-nebula {
          position: absolute;
          border-radius: 50%;
          filter: blur(40px);
          animation: noctuaNebulaPulse 15s ease-in-out infinite;
        }
        .noctua-neb1 {
          width: 200px;
          height: 200px;
          background: rgba(152, 88, 160, 0.3);
          top: 10%;
          right: -10%;
        }
        .noctua-neb2 {
          width: 160px;
          height: 160px;
          background: rgba(100, 60, 140, 0.25);
          bottom: 20%;
          left: -5%;
          animation-delay: 5s;
        }
        @keyframes noctuaNebulaPulse {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.6; }
          50% { transform: scale(1.2) rotate(10deg); opacity: 1; }
        }
        .noctua-petal {
          position: absolute;
          line-height: 1;
          animation: noctuaPetalRise var(--dur) linear infinite;
          bottom: -20px;
          transform: rotate(var(--rot));
        }
        @keyframes noctuaPetalRise {
          0% { transform: translateY(0) rotate(var(--rot)) scale(1); opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.3; }
          100% { transform: translateY(-110vh) rotate(calc(var(--rot) + 180deg)) scale(0.6); opacity: 0; }
        }
        .noctua-fstar {
          position: absolute;
          background: #ffe8a0;
          border-radius: 50%;
          opacity: 0;
        }
        @keyframes noctuaFallStar {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          5% { opacity: 1; }
          70% { opacity: 0.6; }
          100% { transform: translateY(100vh) translateX(80px); opacity: 0; }
        }
        .noctua-ftrail {
          position: absolute;
          width: 1px;
          height: 30px;
          background: linear-gradient(to bottom, rgba(255,232,160,0.7), transparent);
          border-radius: 1px;
          opacity: 0;
          transform: rotate(-15deg);
        }
        @keyframes noctuaFallTrail {
          0% { transform: translateY(0) translateX(0) rotate(-15deg); opacity: 0; }
          5% { opacity: 0.9; }
          50% { opacity: 0.4; }
          100% { transform: translateY(100vh) translateX(80px) rotate(-15deg); opacity: 0; }
        }
        .noctua-cherry {
          position: absolute;
          line-height: 1;
          opacity: 0;
        }
        @keyframes noctuaCherryFall {
          0% { transform: translateY(0) rotate(var(--rot)) translateX(0); opacity: 0; }
          8% { opacity: 0.55; }
          50% { transform: translateY(50vh) rotate(calc(var(--rot) + 120deg)) translateX(40px); opacity: 0.4; }
          100% { transform: translateY(110vh) rotate(calc(var(--rot) + 260deg)) translateX(-20px); opacity: 0; }
        }
        .noctua-ripple {
          position: absolute;
          border-radius: 50%;
          border: 2.5px solid rgba(30,80,140,0.35);
          animation: noctuaRipple var(--dur) ease-out infinite;
          animation-delay: var(--delay);
          opacity: 0;
          transform: scale(0);
          box-shadow: 0 0 8px rgba(30,80,140,0.1);
        }
        @keyframes noctuaRipple {
          0% { transform: scale(0); opacity: 0.7; border-width: 3px; }
          40% { opacity: 0.4; }
          100% { transform: scale(1); opacity: 0; border-width: 0.5px; }
        }
        .noctua-volcanic-glow {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 40%;
          background: radial-gradient(ellipse at bottom center, rgba(180, 60, 80, 0.3) 0%, transparent 70%);
          animation: noctuaVolcanicPulse 6s ease-in-out infinite;
        }
        @keyframes noctuaVolcanicPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>

      <div className="noctua-anim-layer">
        {animationType === "falling-stars" && (
          <div ref={starsRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} />
        )}

        {animationType === "cherry-rain" && (
          <div ref={petalsRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "hidden" }} />
        )}

        {animationType === "ocean-drift" && (
          <>
            {[
              { x: "30%", y: "25%", size: 300, dur: 6, delay: 0 },
              { x: "70%", y: "60%", size: 250, dur: 7, delay: 2 },
              { x: "50%", y: "45%", size: 350, dur: 8, delay: 4 },
              { x: "20%", y: "70%", size: 200, dur: 5, delay: 1 },
              { x: "80%", y: "30%", size: 280, dur: 7, delay: 3 },
              { x: "45%", y: "80%", size: 320, dur: 9, delay: 5 },
              { x: "65%", y: "15%", size: 220, dur: 6, delay: 2.5 },
            ].map((r, i) => (
              <div key={i} className="noctua-ripple" style={{ left: r.x, top: r.y, width: r.size + "px", height: r.size + "px", marginLeft: -(r.size/2) + "px", marginTop: -(r.size/2) + "px", "--dur": r.dur + "s", "--delay": r.delay + "s" } as React.CSSProperties} />
            ))}
          </>
        )}

        {animationType === "moonstone" && (
          <>
            <div className="noctua-aurora-wave noctua-aw1" />
            <div className="noctua-aurora-wave noctua-aw2" />
            <div className="noctua-aurora-wave noctua-aw3" />
            {[
              { x: "12%", dur: 12, delay: 0, size: 10 },
              { x: "28%", dur: 15, delay: 3, size: 8 },
              { x: "45%", dur: 11, delay: 6, size: 12 },
              { x: "62%", dur: 14, delay: 2, size: 9 },
              { x: "78%", dur: 13, delay: 8, size: 11 },
              { x: "35%", dur: 16, delay: 5, size: 7 },
              { x: "88%", dur: 12, delay: 10, size: 10 },
              { x: "55%", dur: 14, delay: 4, size: 8 },
              { x: "8%", dur: 15, delay: 7, size: 9 },
              { x: "72%", dur: 11, delay: 1, size: 11 },
            ].map((h, i) => (
              <div key={i} className="noctua-heart" style={{ left: h.x, "--hdur": h.dur + "s", "--hdelay": h.delay + "s", "--hsize": h.size * 2.5 + "px" } as React.CSSProperties}>♡</div>
            ))}
          </>
        )}

        {animationType === "velvet" && (
          <>
            <div className="noctua-nebula noctua-neb1" />
            <div className="noctua-nebula noctua-neb2" />
            <div ref={starsRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} />
          </>
        )}

        {animationType === "obsidian" && (
          <>
            <div className="noctua-volcanic-glow" />
            <div ref={petalsRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "hidden" }} />
          </>
        )}

        {animationType === "default-owls" && (
          <>
            {[
              { x: "9%",  y: "7%",  size: 26 },
              { x: "88%", y: "15%", size: 18 },
              { x: "4%",  y: "38%", size: 22 },
              { x: "94%", y: "55%", size: 28 },
              { x: "18%", y: "78%", size: 16 },
              { x: "78%", y: "88%", size: 24 },
              { x: "78%", y: "30%", size: 14 },
              { x: "44%", y: "68%", size: 20 },
            ].map((o, i) => (
              <span
                key={i}
                style={{
                  position: "absolute",
                  left: o.x,
                  top: o.y,
                  fontSize: o.size + "px",
                  lineHeight: 1,
                  opacity: 0.35,
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                🦉
              </span>
            ))}
          </>
        )}
      </div>
    </>
  );
}