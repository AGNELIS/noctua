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
  cream: "#ffffff",
  blush: "#fdf9f3",
  "dusty-rose": "#a6856a",
  mauve: "#8a6a4a",
  plum: "#6e5032",
  gold: "#a6856a",
  dark: "#4a2f15",
  deep: "#2a1808",
  gradient: "#ffffff",
};

export const THEME_MAP: Record<string, ThemeColors> = {
  
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
  "Moonstone": {
    cream: "#f5f2fa",
    blush: "#ebe4f4",
    "dusty-rose": "#b8a8d0",
    mauve: "#7868a0",
    plum: "#4a3870",
    gold: "#a898c0",
    dark: "#221830",
    deep: "#140e20",
    gradient: "linear-gradient(180deg, #f5f2fa 0%, #ebe4f4 35%, #ddd4ec 100%)",
  },
  "Velvet Night": {
    cream: "#0c0c1e",
    blush: "#141428",
    "dusty-rose": "#a66fad",
    mauve: "#d090c0",
    plum: "#e8a0d0",
    gold: "#c8a0e0",
    dark: "#f0e6f5",
    deep: "#f8f4fc",
    gradient: "linear-gradient(180deg, #0c0c1e 0%, #1a1030 40%, #241440 100%)",
  },
  "Falling Stars": {
    cream: "#0a0a1a",
    blush: "#141020",
    "dusty-rose": "#c8a060",
    mauve: "#e8d090",
    plum: "#f0e0a0",
    gold: "#ffe8a0",
    dark: "#f0e4d0",
    deep: "#f8f2e8",
    gradient: "linear-gradient(180deg, #0a0a1a 0%, #1a1028 40%, #0c0818 100%)",
  },
  "Cherry Rain": {
    cream: "#fff5f8",
    blush: "#fce8ee",
    "dusty-rose": "#d08090",
    mauve: "#b04060",
    plum: "#8a2040",
    gold: "#c87090",
    dark: "#4a1020",
    deep: "#2a0810",
    gradient: "linear-gradient(180deg, #fff5f8 0%, #fce8ee 35%, #f8d8e2 100%)",
  },
  "Ocean Drift": {
    cream: "#e8f4f8",
    blush: "#c8e4f0",
    "dusty-rose": "#6090b0",
    mauve: "#3070a0",
    plum: "#1a4060",
    gold: "#50a0c8",
    dark: "#102838",
    deep: "#081820",
    gradient: "linear-gradient(180deg, #e8f4f8 0%, #c8e4f0 35%, #a8d0e4 100%)",
  },
  "Obsidian Rose": {
    cream: "#faf5f5",
    blush: "#f5e8e8",
    "dusty-rose": "#964e52",
    mauve: "#905060",
    plum: "#6a2838",
    gold: "#8a5e4c",
    dark: "#381820",
    deep: "#280e14",
    gradient: "linear-gradient(180deg, #faf5f5 0%, #f5e8e8 35%, #ecd4d8 100%)",
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