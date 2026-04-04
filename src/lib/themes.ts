export type ThemeColors = {
  cream: string;
  blush: string;
  "dusty-rose": string;
  mauve: string;
  plum: string;
  gold: string;
  dark: string;
  deep: string;
  gradient: string;
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
  gradient: "#FAF7F5",
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
    gradient: "linear-gradient(180deg, #0c0c1e 0%, #1a1030 40%, #241440 100%)",
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
    gradient: "linear-gradient(180deg, #fdfaf2 0%, #f8f0dc 35%, #f0e4c0 100%)",
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
    gradient: "linear-gradient(180deg, #f2fafa 0%, #e0f0ef 35%, #c8e8e6 100%)",
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
    gradient: "linear-gradient(180deg, #fdf5f7 0%, #f5e4ea 35%, #ecd0dc 100%)",
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
    gradient: "linear-gradient(180deg, #080814 0%, #0a1420 40%, #0c2020 100%)",
  },
  "Lilac Dream": {
    cream: "#f8f4fc",
    blush: "#f0e6f5",
    "dusty-rose": "#c4a0d8",
    mauve: "#8e5aab",
    plum: "#5c2d82",
    gold: "#b498c8",
    dark: "#2a1838",
    deep: "#1a0e28",
    gradient: "linear-gradient(180deg, #f8f4fc 0%, #f0e6f5 35%, #e4d4ec 100%)",
  },
  "Ruby Flame": {
    cream: "#fdf5f5",
    blush: "#f5e0e0",
    "dusty-rose": "#c47070",
    mauve: "#a04040",
    plum: "#7a2020",
    gold: "#d4806a",
    dark: "#3a1418",
    deep: "#280c10",
    gradient: "linear-gradient(180deg, #fdf5f5 0%, #f5e0e0 35%, #ecc8c8 100%)",
  },
  "Amber Glow": {
    cream: "#fdf9f2",
    blush: "#f5eadc",
    "dusty-rose": "#c89860",
    mauve: "#a07030",
    plum: "#7a4e10",
    gold: "#d4a030",
    dark: "#3a2810",
    deep: "#281c08",
    gradient: "linear-gradient(180deg, #fdf9f2 0%, #f5eadc 35%, #ecdcc4 100%)",
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