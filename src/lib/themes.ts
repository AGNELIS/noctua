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

export const THEME_MAP: Record<string, ThemeColors> = {
  "Midnight Garden": {
    cream: "#0c0c1e",
    blush: "#141428",
    "dusty-rose": "#e94560",
    mauve: "#a46bbd",
    plum: "#e06090",
    gold: "#d4af37",
    dark: "#ede0f5",
    deep: "#f8f4fc",
  },
  "Golden Hour": {
    cream: "#fdfaf2",
    blush: "#f8f0dc",
    "dusty-rose": "#c8a050",
    mauve: "#96703a",
    plum: "#6b4a18",
    gold: "#d4a020",
    dark: "#3a2a10",
    deep: "#1e1608",
  },
  "Ocean Depths": {
    cream: "#f2fafa",
    blush: "#e0f0ef",
    "dusty-rose": "#6aada5",
    mauve: "#3a7a76",
    plum: "#1c4a48",
    gold: "#60bab2",
    dark: "#102e2d",
    deep: "#081c1c",
  },
  "Cherry Blossom": {
    cream: "#fdf5f7",
    blush: "#f5e4ea",
    "dusty-rose": "#c98a9a",
    mauve: "#a05570",
    plum: "#7a2e4a",
    gold: "#c8907a",
    dark: "#3a1828",
    deep: "#28101c",
  },
  "Aurora Borealis": {
    cream: "#080814",
    blush: "#0e1024",
    "dusty-rose": "#74c69d",
    mauve: "#40916c",
    plum: "#52b788",
    gold: "#b7e4c7",
    dark: "#d8f3dc",
    deep: "#f0faf2",
  },
};

export function applyTheme(themeName: string | null) {
  const colors =
    themeName && THEME_MAP[themeName] ? THEME_MAP[themeName] : DEFAULT_THEME;

  const root = document.documentElement;
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
}