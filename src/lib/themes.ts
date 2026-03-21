// Theme color definitions — maps theme name → CSS variable overrides
// Keys match the @theme variables in globals.css

export type ThemeColors = {
  cream: string;
  blush: string;
  "dusty-rose": string;
  mauve: string;
  plum: string;
  gold: string;
  dark: string;
  deep: string;
};

// Default (base) Noctua palette — used when no theme is active
export const DEFAULT_THEME: ThemeColors = {
  cream: "#FAF7F5",
  blush: "#F5EBE8",
  "dusty-rose": "#D4A5A5",
  mauve: "#9B6B8D",
  plum: "#4A2545",
  gold: "#C8A87C",
  dark: "#2A1A28",
  deep: "#1A0E1A",
};

// Each key matches the `name` field in shop_products table
export const THEME_MAP: Record<string, ThemeColors> = {
  "Midnight Garden": {
    cream: "#0f0f1e",
    blush: "#1a1a2e",
    "dusty-rose": "#e94560",
    mauve: "#533483",
    plum: "#16213e",
    gold: "#e94560",
    dark: "#f0e6f6",
    deep: "#ffffff",
  },
  "Golden Hour": {
    cream: "#fffdf5",
    blush: "#fff8e7",
    "dusty-rose": "#daa520",
    mauve: "#b8860b",
    plum: "#7a5c00",
    gold: "#ffd700",
    dark: "#3d2e10",
    deep: "#1a1400",
  },
  "Ocean Depths": {
    cream: "#f0fafa",
    blush: "#e0f4f4",
    "dusty-rose": "#7ec8c8",
    mauve: "#2d6a6a",
    plum: "#1a3a3a",
    gold: "#5fb8b8",
    dark: "#0f2e2e",
    deep: "#081a1a",
  },
  "Cherry Blossom": {
    cream: "#fff8fa",
    blush: "#fff0f5",
    "dusty-rose": "#ffb7c5",
    mauve: "#e75480",
    plum: "#c71585",
    gold: "#ff92b2",
    dark: "#3d1a28",
    deep: "#2a0e1a",
  },
  "Aurora Borealis": {
    cream: "#060618",
    blush: "#0a0a2a",
    "dusty-rose": "#95d5b2",
    mauve: "#40916c",
    plum: "#1b4332",
    gold: "#74c69d",
    dark: "#d8f3dc",
    deep: "#ffffff",
  },
};

export function applyTheme(themeName: string | null) {
  const colors = themeName && THEME_MAP[themeName]
    ? THEME_MAP[themeName]
    : DEFAULT_THEME;

  const root = document.documentElement;
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
}