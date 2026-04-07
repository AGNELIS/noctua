"use client";

import { useTheme } from "@/context/ThemeContext";
import { useEffect, useRef } from "react";

const ANIMATED_THEMES: Record<string, string> = {
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

  const animationType = activeThemeName ? ANIMATED_THEMES[activeThemeName] || null : null;

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
        p.style.left = (Math.random() * 100) + "%";
        p.style.top = (-10 - Math.random() * 20) + "%";
        p.style.width = (5 + Math.random() * 8) + "px";
        p.style.height = (6 + Math.random() * 8) + "px";
        p.style.background = `rgba(${200 + Math.floor(Math.random() * 55)},${80 + Math.floor(Math.random() * 60)},${100 + Math.floor(Math.random() * 60)},0.25)`;
        p.style.setProperty("--rot", (Math.random() * 360) + "deg");
        p.style.animation = `noctuaCherryFall ${6 + Math.random() * 8}s ease-in-out infinite`;
        p.style.animationDelay = (Math.random() * 10) + "s";
        petalsRef.current.appendChild(p);
      }
    }
    if (animationType === "obsidian" && petalsRef.current && petalsRef.current.childNodes.length === 0) {
      for (let i = 0; i < 14; i++) {
        const p = document.createElement("div");
        p.className = "noctua-petal";
        p.style.left = (5 + Math.random() * 90) + "%";
        p.style.setProperty("--dur", (8 + Math.random() * 10) + "s");
        p.style.setProperty("--rot", (Math.random() * 360) + "deg");
        p.style.animationDelay = (Math.random() * 12) + "s";
        p.style.width = (6 + Math.random() * 6) + "px";
        p.style.height = (8 + Math.random() * 8) + "px";
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
          z-index: 9999;
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
        .noctua-star {
          position: absolute;
          background: #fff;
          border-radius: 50%;
          animation: noctuaTwinkle var(--dur) ease-in-out infinite;
          opacity: 0;
        }
        @keyframes noctuaTwinkle {
          0%, 100% { opacity: 0.1; transform: scale(0.8); }
          50% { opacity: 0.85; transform: scale(1.2); }
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
          background: rgba(152, 88, 160, 0.15);
          top: 10%;
          right: -10%;
        }
        .noctua-neb2 {
          width: 160px;
          height: 160px;
          background: rgba(100, 60, 140, 0.12);
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
          background: rgba(192, 88, 120, 0.15);
          border-radius: 50% 50% 50% 0;
          animation: noctuaPetalRise var(--dur) linear infinite;
          bottom: -20px;
          transform: rotate(var(--rot));
        }
        @keyframes noctuaPetalRise {
          0% { transform: translateY(0) rotate(var(--rot)) scale(1); opacity: 0; }
          10% { opacity: 0.5; }
          90% { opacity: 0.2; }
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
          5% { opacity: 0.9; }
          70% { opacity: 0.4; }
          100% { transform: translateY(100vh) translateX(80px); opacity: 0; }
        }
        .noctua-ftrail {
          position: absolute;
          width: 1px;
          height: 30px;
          background: linear-gradient(to bottom, rgba(255,232,160,0.5), transparent);
          border-radius: 1px;
          opacity: 0;
          transform: rotate(-15deg);
        }
        @keyframes noctuaFallTrail {
          0% { transform: translateY(0) translateX(0) rotate(-15deg); opacity: 0; }
          5% { opacity: 0.7; }
          50% { opacity: 0.2; }
          100% { transform: translateY(100vh) translateX(80px) rotate(-15deg); opacity: 0; }
        }
        .noctua-cherry {
          position: absolute;
          border-radius: 50% 50% 50% 0;
          opacity: 0;
        }
        @keyframes noctuaCherryFall {
          0% { transform: translateY(0) rotate(var(--rot)) translateX(0); opacity: 0; }
          8% { opacity: 0.6; }
          50% { transform: translateY(50vh) rotate(calc(var(--rot) + 120deg)) translateX(40px); opacity: 0.4; }
          100% { transform: translateY(110vh) rotate(calc(var(--rot) + 260deg)) translateX(-20px); opacity: 0; }
        }
        .noctua-ocean-wave {
          position: absolute;
          bottom: 0;
          left: -20%;
          width: 140%;
          border-radius: 50%;
        }
        .noctua-ow0 { height: 60px; bottom: 0; background: rgba(40,100,160,0.04); animation: noctuaWaveMove 4s ease-in-out infinite; }
        .noctua-ow1 { height: 80px; bottom: 12px; background: rgba(40,100,160,0.06); animation: noctuaWaveMove 5.5s ease-in-out infinite 0.8s; }
        .noctua-ow2 { height: 100px; bottom: 24px; background: rgba(40,100,160,0.08); animation: noctuaWaveMove 7s ease-in-out infinite 1.6s; }
        .noctua-ow3 { height: 120px; bottom: 36px; background: rgba(40,100,160,0.1); animation: noctuaWaveMove 8.5s ease-in-out infinite 2.4s; }
        .noctua-ow4 { height: 140px; bottom: 48px; background: rgba(40,100,160,0.12); animation: noctuaWaveMove 10s ease-in-out infinite 3.2s; }
        @keyframes noctuaWaveMove {
          0%, 100% { transform: translateX(-5%) translateY(0); }
          50% { transform: translateX(5%) translateY(-8px); }
        }
        .noctua-volcanic-glow {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 40%;
          background: radial-gradient(ellipse at bottom center, rgba(180, 60, 80, 0.07) 0%, transparent 70%);
          animation: noctuaVolcanicPulse 6s ease-in-out infinite;
        }
        @keyframes noctuaVolcanicPulse {
          0%, 100% { opacity: 0.4; }
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
            {[0,1,2,3,4].map(i => (
              <div key={i} className={`noctua-ocean-wave noctua-ow${i}`} />
            ))}
          </>
        )}

        {animationType === "moonstone" && (
          <>
            <div className="noctua-aurora-wave noctua-aw1" />
            <div className="noctua-aurora-wave noctua-aw2" />
            <div className="noctua-aurora-wave noctua-aw3" />
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
      </div>
    </>
  );
}