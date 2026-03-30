// src/components/NoctuaIcons.tsx
// Custom SVG icons for Noctua — all hand-crafted, no external dependencies

import React from "react";

type IconProps = {
  size?: number;
  color?: string;
  className?: string;
};

const defaults = { size: 24, color: "currentColor" };

// ☀ Słoneczko — daily insights, energy
export const SunIcon = ({ size = defaults.size, color = defaults.color, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1.5" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
      <line
        key={deg}
        x1="12"
        y1="2"
        x2="12"
        y2="4.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        transform={`rotate(${deg} 12 12)`}
      />
    ))}
  </svg>
);

// 🍃 Liść — grounding, nature, return to self
export const LeafIcon = ({ size = defaults.size, color = defaults.color, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M6 21C6 21 7 14 12 9C17 4 21 3 21 3C21 3 20 10 15 15C10 20 6 21 6 21Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M12 9C9.5 11.5 7.5 15 6.5 18" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

// ◯ Koło — cycle, wholeness, moon
export const CircleIcon = ({ size = defaults.size, color = defaults.color, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
  </svg>
);

// ◇ Romb — clarity, precision, dream symbols
export const DiamondIcon = ({ size = defaults.size, color = defaults.color, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 2L22 12L12 22L2 12L12 2Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

// 🎭 Maska — shadow work, hidden self
export const MaskIcon = ({ size = defaults.size, color = defaults.color, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M3 10C3 6 7 3 12 3C17 3 21 6 21 10C21 14 18 17 16 17C14.5 17 14 15.5 12 15.5C10 15.5 9.5 17 8 17C6 17 3 14 3 10Z"
      stroke={color}
      strokeWidth="1.5"
    />
    <circle cx="8.5" cy="10" r="1.5" fill={color} />
    <circle cx="15.5" cy="10" r="1.5" fill={color} />
  </svg>
);

// 💧 Kropla — emotions, tears, water element
export const DropIcon = ({ size = defaults.size, color = defaults.color, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 3C12 3 5 11 5 15C5 18.866 8.134 22 12 22C15.866 22 19 18.866 19 15C19 11 12 3 12 3Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

// ✦ Iskra — insight, spark, intuition
export const SparkIcon = ({ size = defaults.size, color = defaults.color, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 2L13.5 9L20 7L14.5 12L20 17L13.5 15L12 22L10.5 15L4 17L9.5 12L4 7L10.5 9L12 2Z"
      stroke={color}
      strokeWidth="1.2"
      strokeLinejoin="round"
      fill={color}
      fillOpacity="0.15"
    />
  </svg>
);

// 🦉 Zwierzę (sowa) — wisdom, Noctua, night creature
export const OwlIcon = ({ size = defaults.size, color = defaults.color, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <ellipse cx="12" cy="13" rx="7" ry="8" stroke={color} strokeWidth="1.5" />
    <circle cx="9.5" cy="11" r="2" stroke={color} strokeWidth="1.3" />
    <circle cx="14.5" cy="11" r="2" stroke={color} strokeWidth="1.3" />
    <circle cx="9.5" cy="11" r="0.8" fill={color} />
    <circle cx="14.5" cy="11" r="0.8" fill={color} />
    <path d="M11 14L12 15.5L13 14" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 8L8 10" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    <path d="M19 8L16 10" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

// 🪨 Kamień — stability, grounding, foundation
export const StoneIcon = ({ size = defaults.size, color = defaults.color, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M4 16C4 16 5 10 9 8C13 6 17 7 19 10C21 13 20 18 16 19C12 20 4 16 4 16Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M9 12C11 11 14 11 16 13" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
  </svg>
);

// 🔑 Klucz — unlock, premium, access
export const KeyIcon = ({ size = defaults.size, color = defaults.color, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="8" cy="10" r="4" stroke={color} strokeWidth="1.5" />
    <path d="M11.5 12.5L20 21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M16 17L18 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M18 19L20 17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 🫀 Tors — body, cycle, physical self
export const TorsoIcon = ({ size = defaults.size, color = defaults.color, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="6" r="3" stroke={color} strokeWidth="1.5" />
    <path
      d="M6 22V18C6 15 8 13 12 13C16 13 18 15 18 18V22"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// 👤 Sylwetka — profile, personal, identity
export const SilhouetteIcon = ({ size = defaults.size, color = defaults.color, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.5" />
    <path
      d="M4 21C4 17.134 7.582 14 12 14C16.418 14 20 17.134 20 21"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// 🧰 Kuferek — shop, treasures, collection
export const ChestIcon = ({ size = defaults.size, color = defaults.color, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="8" width="18" height="12" rx="2" stroke={color} strokeWidth="1.5" />
    <path d="M3 14H21" stroke={color} strokeWidth="1.2" />
    <path d="M7 8V6C7 4.343 9.239 3 12 3C14.761 3 17 4.343 17 6V8" stroke={color} strokeWidth="1.5" />
    <circle cx="12" cy="17" r="1.5" stroke={color} strokeWidth="1.2" />
  </svg>
);

// 🏋 Sztanga — strength, workout, discipline
export const BarbellIcon = ({ size = defaults.size, color = defaults.color, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="8" y="11" width="8" height="2" rx="1" fill={color} />
    <rect x="4" y="8" width="3" height="8" rx="1" stroke={color} strokeWidth="1.3" />
    <rect x="17" y="8" width="3" height="8" rx="1" stroke={color} strokeWidth="1.3" />
    <line x1="2" y1="12" x2="4" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="20" y1="12" x2="22" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);