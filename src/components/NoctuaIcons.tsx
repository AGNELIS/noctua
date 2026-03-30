// src/components/NoctuaIcons.tsx
// 3D gradient SVG icons for Noctua

import React from "react";

type IconProps = {
  size?: number;
  className?: string;
};

// ☀ Słoneczko — Radiant / Joyful
export const SunIcon = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
    <defs>
      <radialGradient id="sunG" cx="38%" cy="35%" r="55%">
        <stop offset="0%" stopColor="#f5e060"/><stop offset="40%" stopColor="#d4a020"/><stop offset="100%" stopColor="#8a6508"/>
      </radialGradient>
    </defs>
    <circle cx="40" cy="40" r="28" fill="url(#sunG)"/>
    <g stroke="#d4a020" strokeWidth="3" strokeLinecap="round">
      <line x1="40" y1="5" x2="40" y2="0"/><line x1="40" y1="75" x2="40" y2="80"/>
      <line x1="5" y1="40" x2="0" y2="40"/><line x1="75" y1="40" x2="80" y2="40"/>
      <line x1="14" y1="14" x2="10" y2="10"/><line x1="66" y1="14" x2="70" y2="10"/>
      <line x1="14" y1="66" x2="10" y2="70"/><line x1="66" y1="66" x2="70" y2="70"/>
    </g>
    <circle cx="35" cy="34" r="8" fill="#f5e878" opacity="0.4"/>
  </svg>
);

// ☁ Chmurka niebieska — Calm (journal)
export const CloudIcon = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
    <defs>
      <radialGradient id="cloudG" cx="38%" cy="35%" r="55%">
        <stop offset="0%" stopColor="#a0c8e8"/><stop offset="40%" stopColor="#5898d0"/><stop offset="100%" stopColor="#285888"/>
      </radialGradient>
    </defs>
    <ellipse cx="40" cy="44" rx="30" ry="20" fill="url(#cloudG)"/>
    <ellipse cx="26" cy="36" rx="16" ry="14" fill="url(#cloudG)"/>
    <ellipse cx="52" cy="34" rx="14" ry="12" fill="url(#cloudG)"/>
    <ellipse cx="40" cy="30" rx="14" ry="12" fill="#88b8e0" opacity="0.5"/>
    <ellipse cx="30" cy="30" rx="6" ry="5" fill="#b0d8f0" opacity="0.35"/>
  </svg>
);

// ● Szara kula — Neutral
export const SphereIcon = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
    <defs>
      <radialGradient id="neutralG" cx="38%" cy="35%" r="55%">
        <stop offset="0%" stopColor="#c8c4c0"/><stop offset="40%" stopColor="#9a9590"/><stop offset="100%" stopColor="#605a55"/>
      </radialGradient>
    </defs>
    <circle cx="40" cy="40" r="30" fill="url(#neutralG)"/>
    <ellipse cx="32" cy="30" rx="12" ry="10" fill="#e0dcd8" opacity="0.35"/>
  </svg>
);

// 🏋 Sztanga — Heavy
export const BarbellIcon = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
    <defs>
      <radialGradient id="barbellG" cx="38%" cy="35%" r="55%">
        <stop offset="0%" stopColor="#80a0d0"/><stop offset="40%" stopColor="#4070b0"/><stop offset="100%" stopColor="#203860"/>
      </radialGradient>
    </defs>
    <rect x="14" y="28" width="14" height="24" rx="3" fill="url(#barbellG)"/>
    <rect x="52" y="28" width="14" height="24" rx="3" fill="url(#barbellG)"/>
    <rect x="28" y="36" width="24" height="8" rx="2" fill="url(#barbellG)"/>
    <line x1="8" y1="40" x2="14" y2="40" stroke="#4070b0" strokeWidth="3" strokeLinecap="round"/>
    <line x1="66" y1="40" x2="72" y2="40" stroke="#4070b0" strokeWidth="3" strokeLinecap="round"/>
    <rect x="16" y="30" width="6" height="6" rx="1" fill="#a0c0e8" opacity="0.3"/>
  </svg>
);

// ★ Czerwona gwiazda — Stormy / Angry
export const StarIcon = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
    <defs>
      <radialGradient id="stormyG" cx="38%" cy="35%" r="55%">
        <stop offset="0%" stopColor="#d05060"/><stop offset="40%" stopColor="#903040"/><stop offset="100%" stopColor="#501020"/>
      </radialGradient>
    </defs>
    <path d="M40 4 L47 28 L72 28 L52 44 L58 68 L40 54 L22 68 L28 44 L8 28 L33 28 Z" fill="url(#stormyG)"/>
    <path d="M36 18 L40 28 L48 28 L42 34" fill="#e08090" opacity="0.3"/>
  </svg>
);

// 🟢 Zielona kula — Calm (dreams)
export const GreenSphereIcon = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
    <defs>
      <radialGradient id="calmGreenG" cx="38%" cy="35%" r="55%">
        <stop offset="0%" stopColor="#8ac090"/><stop offset="40%" stopColor="#5a9060"/><stop offset="100%" stopColor="#2a5030"/>
      </radialGradient>
    </defs>
    <circle cx="40" cy="40" r="30" fill="url(#calmGreenG)"/>
    <ellipse cx="32" cy="30" rx="12" ry="10" fill="#a0d8a8" opacity="0.35"/>
  </svg>
);

// ✳ Kolczasta — Anxious
export const SpikyIcon = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
    <defs>
      <radialGradient id="anxG" cx="38%" cy="35%" r="55%">
        <stop offset="0%" stopColor="#90a8d8"/><stop offset="40%" stopColor="#5070b0"/><stop offset="100%" stopColor="#283868"/>
      </radialGradient>
    </defs>
    <path d="M40 8 L50 32 L72 22 L58 42 L76 58 L52 52 L40 74 L28 52 L4 58 L22 42 L8 22 L30 32 Z" fill="url(#anxG)"/>
    <path d="M34 24 L40 32 L48 28" fill="#a8c0e8" opacity="0.3"/>
  </svg>
);

// 🎭 Maska — Scared
export const MaskIcon = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
    <defs>
      <radialGradient id="maskG" cx="38%" cy="35%" r="55%">
        <stop offset="0%" stopColor="#b888c8"/><stop offset="40%" stopColor="#784898"/><stop offset="100%" stopColor="#402060"/>
      </radialGradient>
    </defs>
    <path d="M12 22 C12 12 24 4 40 4 C56 4 68 12 68 22 C68 38 60 48 54 50 C50 51 48 46 40 46 C32 46 30 51 26 50 C20 48 12 38 12 22Z" fill="url(#maskG)"/>
    <ellipse cx="28" cy="24" rx="7" ry="8" fill="#402060"/>
    <ellipse cx="52" cy="24" rx="7" ry="8" fill="#402060"/>
    <ellipse cx="28" cy="22" rx="3" ry="4" fill="#d0b8e0" opacity="0.4"/>
    <ellipse cx="52" cy="22" rx="3" ry="4" fill="#d0b8e0" opacity="0.4"/>
  </svg>
);

// 💧 Kropla — Sad
export const DropIcon = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
    <defs>
      <radialGradient id="sadG" cx="38%" cy="35%" r="55%">
        <stop offset="0%" stopColor="#a8b8d0"/><stop offset="40%" stopColor="#607898"/><stop offset="100%" stopColor="#304058"/>
      </radialGradient>
    </defs>
    <path d="M40 6 C40 6 24 20 24 36 C24 44.8 31.2 52 40 52 C48.8 52 56 44.8 56 36 C56 20 40 6 40 6Z" fill="url(#sadG)"/>
    <ellipse cx="34" cy="28" rx="6" ry="8" fill="#c0d0e8" opacity="0.3"/>
  </svg>
);

// 🦉 Sowa — Animals
export const OwlIcon = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
    <defs>
      <radialGradient id="owlG" cx="38%" cy="35%" r="55%">
        <stop offset="0%" stopColor="#b888c8"/><stop offset="40%" stopColor="#784898"/><stop offset="100%" stopColor="#402060"/>
      </radialGradient>
    </defs>
    <ellipse cx="40" cy="42" rx="22" ry="26" fill="url(#owlG)"/>
    <circle cx="32" cy="34" r="8" fill="#402060"/><circle cx="48" cy="34" r="8" fill="#402060"/>
    <circle cx="32" cy="33" r="4" fill="#d0b8e0" opacity="0.7"/><circle cx="48" cy="33" r="4" fill="#d0b8e0" opacity="0.7"/>
    <circle cx="32" cy="33" r="2" fill="#402060"/><circle cx="48" cy="33" r="2" fill="#402060"/>
    <path d="M38 44 L40 47 L42 44" stroke="#d0b8e0" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 24 L28 30" stroke="#b888c8" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M60 24 L52 30" stroke="#b888c8" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

// 🍃 Liść — Nature
export const LeafIcon = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
    <defs>
      <radialGradient id="leafG" cx="38%" cy="35%" r="55%">
        <stop offset="0%" stopColor="#88c8a0"/><stop offset="40%" stopColor="#408860"/><stop offset="100%" stopColor="#185030"/>
      </radialGradient>
    </defs>
    <path d="M20 68 C20 68 22 40 40 24 C58 8 68 6 68 6 C68 6 66 36 48 52 C30 68 20 68 20 68Z" fill="url(#leafG)"/>
    <path d="M40 24 C34 32 28 44 24 56" stroke="#185030" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5"/>
  </svg>
);

// ◇ Diament — Elements
export const DiamondIcon = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
    <defs>
      <radialGradient id="elemG" cx="38%" cy="35%" r="55%">
        <stop offset="0%" stopColor="#6898c8"/><stop offset="40%" stopColor="#305880"/><stop offset="100%" stopColor="#183048"/>
      </radialGradient>
    </defs>
    <path d="M40 8 L68 40 L40 72 L12 40 Z" fill="url(#elemG)"/>
    <path d="M34 28 L40 18 L46 28" fill="#88b8e0" opacity="0.3"/>
  </svg>
);

// 🔑 Klucz — Objects
export const KeyIcon = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
    <defs>
      <radialGradient id="keyG" cx="38%" cy="35%" r="55%">
        <stop offset="0%" stopColor="#d8c060"/><stop offset="40%" stopColor="#a08020"/><stop offset="100%" stopColor="#604808"/>
      </radialGradient>
    </defs>
    <circle cx="32" cy="24" r="14" fill="url(#keyG)"/>
    <circle cx="32" cy="24" r="7" fill="#604808" opacity="0.4"/>
    <rect x="38" y="20" width="28" height="8" rx="2" fill="url(#keyG)"/>
    <rect x="56" y="28" width="6" height="10" rx="1" fill="url(#keyG)"/>
    <rect x="48" y="28" width="6" height="8" rx="1" fill="url(#keyG)"/>
  </svg>
);

// ⚡ Piorun — Actions
export const BoltIcon = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
    <defs>
      <radialGradient id="boltG" cx="38%" cy="35%" r="55%">
        <stop offset="0%" stopColor="#e8a050"/><stop offset="40%" stopColor="#c07020"/><stop offset="100%" stopColor="#704008"/>
      </radialGradient>
    </defs>
    <path d="M44 4 L24 36 L36 36 L32 72 L58 32 L44 32 Z" fill="url(#boltG)"/>
    <path d="M40 16 L32 32 L38 32" fill="#f0c880" opacity="0.35"/>
  </svg>
);

// 👤 Sylwetka jasnoróżowa — People
export const SilhouetteIcon = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
    <defs>
      <radialGradient id="pplG" cx="38%" cy="35%" r="55%">
        <stop offset="0%" stopColor="#f0c8c8"/><stop offset="40%" stopColor="#e0a0a0"/><stop offset="100%" stopColor="#c07878"/>
      </radialGradient>
    </defs>
    <circle cx="40" cy="20" r="12" fill="url(#pplG)"/>
    <path d="M22 68 C22 48 30 38 40 38 C50 38 58 48 58 68" fill="url(#pplG)"/>
    <ellipse cx="36" cy="16" rx="4" ry="5" fill="#f8e0e0" opacity="0.4"/>
  </svg>
);

// 🏢 Budynek — Places
export const BuildingIcon = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
    <defs>
      <radialGradient id="placeG" cx="38%" cy="35%" r="55%">
        <stop offset="0%" stopColor="#a89080"/><stop offset="40%" stopColor="#706050"/><stop offset="100%" stopColor="#403028"/>
      </radialGradient>
    </defs>
    <rect x="18" y="24" width="44" height="44" rx="2" fill="url(#placeG)"/>
    <rect x="30" y="10" width="20" height="18" rx="2" fill="url(#placeG)"/>
    <rect x="24" y="32" width="10" height="8" rx="1" fill="#c8b8a0" opacity="0.3"/>
    <rect x="46" y="32" width="10" height="8" rx="1" fill="#c8b8a0" opacity="0.3"/>
    <rect x="24" y="48" width="10" height="8" rx="1" fill="#c8b8a0" opacity="0.3"/>
    <rect x="46" y="48" width="10" height="8" rx="1" fill="#c8b8a0" opacity="0.3"/>
    <rect x="34" y="52" width="12" height="16" rx="1" fill="#c8b8a0" opacity="0.3"/>
  </svg>
);

// 🩸 Ciało — Body
export const BodyIcon = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
    <defs>
      <radialGradient id="bodyG" cx="38%" cy="35%" r="55%">
        <stop offset="0%" stopColor="#e8b0b0"/><stop offset="40%" stopColor="#c07070"/><stop offset="100%" stopColor="#804040"/>
      </radialGradient>
    </defs>
    <circle cx="40" cy="18" r="10" fill="url(#bodyG)"/>
    <path d="M24 70 L24 50 C24 42 30 36 40 36 C50 36 56 42 56 50 L56 70" fill="url(#bodyG)"/>
    <ellipse cx="36" cy="14" rx="3" ry="4" fill="#f0c8c8" opacity="0.4"/>
  </svg>
);