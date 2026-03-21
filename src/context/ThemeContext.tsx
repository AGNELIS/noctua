"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { applyTheme } from "@/lib/themes";

type ThemeContextType = {
  activeThemeName: string | null;
  activeThemeId: string | null;
  switchTheme: (productId: string, themeName: string) => Promise<void>;
  resetTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType>({
  activeThemeName: null,
  activeThemeId: null,
  switchTheme: async () => {},
  resetTheme: async () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [activeThemeName, setActiveThemeName] = useState<string | null>(null);
  const [activeThemeId, setActiveThemeId] = useState<string | null>(null);

  // Load user's active theme on mount
  useEffect(() => {
    loadUserTheme();
  }, []);

  const loadUserTheme = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("active_theme")
      .eq("id", user.id)
      .single();

    if (profile?.active_theme) {
      // Fetch theme name from shop_products
      const { data: product } = await supabase
        .from("shop_products")
        .select("name")
        .eq("id", profile.active_theme)
        .single();

      if (product) {
        setActiveThemeId(profile.active_theme);
        setActiveThemeName(product.name);
        applyTheme(product.name);
      }
    }
  };

  const switchTheme = async (productId: string, themeName: string) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({ active_theme: productId })
      .eq("id", user.id);

    setActiveThemeId(productId);
    setActiveThemeName(themeName);
    applyTheme(themeName);
  };

  const resetTheme = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({ active_theme: null })
      .eq("id", user.id);

    setActiveThemeId(null);
    setActiveThemeName(null);
    applyTheme(null);
  };

  return (
    <ThemeContext.Provider
      value={{ activeThemeName, activeThemeId, switchTheme, resetTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);