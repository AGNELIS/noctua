"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/context/ThemeContext";

const EXCLUSIVE_THEMES = [
  {
    name: "Moonstone",
    colors: ["#f5f2fa", "#ebe4f4", "#7868a0", "#4a3870"],
    en: "Soft violet with silver undertones. Contemplative and still.",
    pl: "Delikatny fiolet ze srebrnymi podtonami. Kontemplacyjny i cichy.",
  },
  {
    name: "Velvet Night",
    colors: ["#140c1e", "#1e1230", "#9858a0", "#d090c0"],
    en: "Deep purple darkness with luminous accents. For those who do their best work at night.",
    pl: "Gleboki fioletowy mrok z luminescencyjnymi akcentami. Dla tych, ktore najlepiej pracuja w nocy.",
  },
  {
    name: "Obsidian Rose",
    colors: ["#1a1014", "#241820", "#804858", "#c08890"],
    en: "Dark warmth. Rose emerging from volcanic glass. Intensity with softness.",
    pl: "Ciemne cieplo. Roza wyrastajaca z wulkanicznego szkla. Intensywnosc z miekoscia.",
  },
];

export default function ExclusiveThemesPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { switchTheme } = useTheme();
  const pl = language === "pl";
  const [activating, setActivating] = useState<string | null>(null);
  const [activated, setActivated] = useState<string | null>(null);

  const handleActivate = async (themeName: string) => {
    setActivating(themeName);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Find theme product in shop
    const { data: product } = await supabase
      .from("shop_products")
      .select("id")
      .eq("name", themeName)
      .single();

    if (product) {
      // Add to purchases if not already owned
      const { data: existing } = await supabase
        .from("user_purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .limit(1);

      if (!existing || existing.length === 0) {
        await supabase.from("user_purchases").insert({
          user_id: user.id,
          product_id: product.id,
        });
      }

      // Set as active theme
      await supabase.from("profiles").update({ active_theme: product.id }).eq("id", user.id);
      switchTheme(product.id, themeName);
    }

    setActivating(null);
    setActivated(themeName);
  };

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
      <header className="px-6 pt-5 pb-2">
        <button onClick={() => router.push("/referral")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
          ← {pl ? "Wroc" : "Back"}
        </button>
        <h1 className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3"
          style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>
          {pl ? "Ekskluzywne motywy" : "Exclusive Themes"}
        </h1>
        <p className="text-center text-sm mt-2" style={{ color: "var(--color-mauve)", opacity: 0.7 }}>
          {pl ? "Dostepne tylko przez zaproszenia. Nie ma ich w sklepie." : "Available only through invitations. Not in the shop."}
        </p>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-16 pt-6 space-y-4">
        {EXCLUSIVE_THEMES.map((theme) => {
          const isActivated = activated === theme.name;
          return (
            <div key={theme.name} className="rounded-2xl border p-5 transition-all" style={{
              background: "var(--color-blush)",
              borderColor: isActivated ? "var(--color-plum)" : "var(--color-dusty-rose)",
            }}>
              {/* Color preview */}
              <div className="flex gap-2 mb-4">
                {theme.colors.map((color, i) => (
                  <div key={i} className="flex-1 h-12 rounded-lg" style={{
                    background: i < 2
                      ? `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})`
                      : `linear-gradient(135deg, ${theme.colors[2]}, ${theme.colors[3]})`,
                  }} />
                ))}
              </div>

              <p className="text-lg mb-1" style={{ color: "var(--color-dark)", fontWeight: 600, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                {theme.name}
              </p>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--color-dark)", opacity: 0.8 }}>
                {pl ? theme.pl : theme.en}
              </p>

              {isActivated ? (
                <p className="text-sm text-center py-2" style={{ color: "var(--color-plum)", fontWeight: 500 }}>
                  {pl ? "Aktywowano" : "Activated"} ✓
                </p>
              ) : (
                <button
                  onClick={() => handleActivate(theme.name)}
                  disabled={activating === theme.name}
                  className="w-full py-2.5 rounded-xl text-sm tracking-widest uppercase transition-all disabled:opacity-50"
                  style={{ backgroundColor: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}
                >
                  {activating === theme.name ? "..." : (pl ? "Aktywuj" : "Activate")}
                </button>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}