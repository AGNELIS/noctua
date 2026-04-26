"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n";
import { OwlIcon, LeafIcon, DiamondIcon, KeyIcon, BoltIcon, SilhouetteIcon, BodyIcon, BuildingIcon } from "@/components/NoctuaIcons";
import { getEffectivePerms } from "@/lib/effective-perms";
type DreamSymbol = {
  id: string;
  symbol: string;
  symbol_pl: string | null;
  meaning_general: string;
  meaning_general_pl: string | null;
  meaning_shadow: string | null;
  meaning_shadow_pl: string | null;
  meaning_lunar: string | null;
  meaning_lunar_pl: string | null;
  related_archetypes: string[];
  category: string | null;
  is_premium: boolean;
};

const CATEGORIES = [
  { value: "all", icon: null, label: "All", pl: "Wszystkie" },
  { value: "animals", icon: <OwlIcon size={40} />, label: "Animals", pl: "Zwierzęta" },
  { value: "nature", icon: <LeafIcon size={40} />, label: "Nature", pl: "Natura" },
  { value: "elements", icon: <DiamondIcon size={40} />, label: "Elements", pl: "Żywioły" },
  { value: "objects", icon: <KeyIcon size={40} />, label: "Objects", pl: "Przedmioty" },
  { value: "actions", icon: <BoltIcon size={40} />, label: "Actions", pl: "Działania" },
  { value: "people", icon: <SilhouetteIcon size={40} />, label: "People", pl: "Ludzie" },
  { value: "body", icon: <BodyIcon size={40} />, label: "Body", pl: "Ciało" },
  { value: "places", icon: <BuildingIcon size={40} />, label: "Places", pl: "Miejsca" },
];

export default function SymbolsPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [symbols, setSymbols] = useState<DreamSymbol[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [hasExtended, setHasExtended] = useState(false);

  useEffect(() => { loadSymbols(); }, []);

  const loadSymbols = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium, is_admin, admin_test_mode")
      .eq("id", user!.id)
      .single();
    const { isPremium: userIsPremium } = getEffectivePerms(profile);

    const { data: purchases } = await supabase
      .from("user_purchases")
      .select("product_id, shop_products(name)")
      .eq("shop_products.category", "symbol_pack");

    const ownsExtended = (purchases || []).some((p: any) => p.shop_products?.name === "Extended Dream Symbols");
    const hasFullAccess = ownsExtended || userIsPremium;
    setHasExtended(hasFullAccess);

    let query = supabase.from("dream_symbols").select("*").order("symbol", { ascending: true });
    if (!hasFullAccess) query = query.eq("is_premium", false);

    const { data } = await query;
    setSymbols(data || []);
    setLoading(false);
  };

  const filtered = symbols.filter((s) => {
    const matchesSearch = s.symbol.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || s.category === category;
    return matchesSearch && matchesCategory;
  });

  const freeCount = symbols.filter((s) => !s.is_premium).length;

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
      <header className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/dashboard")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>← {t("back")}</button>
          <div className="w-12" />
        </div>
        <h1 className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>{t("symbols_title")}</h1>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-12 space-y-5">
        {hasExtended ? (
          <p className="text-center text-xs tracking-wide" style={{ color: "var(--color-mauve)" }}>
            {language === "pl" ? "Rozszerzony pakiet" : "Extended Pack"} - {symbols.length} {language === "pl" ? "symboli" : "symbols"}
          </p>
        ) : (
          <div className="text-center space-y-2">
            <p className="text-xs" style={{ color: "var(--color-mauve)" }}>{freeCount} {language === "pl" ? "symboli" : "symbols"}</p>
            <button onClick={() => router.push("/premium")}
              className="text-xs px-4 py-1.5 rounded-full border transition-all hover:scale-105"
              style={{ borderColor: "var(--color-gold)", color: "var(--color-gold)" }}>
              {language === "pl" ? "Przejdź na Premium — wszystkie symbole" : "Go Premium — all symbols unlocked"} →
            </button>
          </div>
        )}

        <div className="relative">
          <input type="text" placeholder={language === "pl" ? "Szukaj symboli..." : "Search symbols..."} value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors duration-500"
            style={{ background: "var(--color-blush)", border: "1px solid var(--color-dusty-rose)", color: "var(--color-dark)" }} />
        </div>

        <div className="grid grid-cols-4 gap-3 gap-y-4">
          {CATEGORIES.filter(c => c.value !== "all").map((c) => (
            <button key={c.value} onClick={() => setCategory(c.value)}
              className="flex flex-col items-center gap-1 transition-all duration-200"
              style={{ opacity: category === c.value || category === "all" ? 1 : 0.35 }}>
              <div style={{ transform: category === c.value ? "scale(1.2)" : "scale(1)", transition: "transform 0.2s" }}>
                {c.icon}
              </div>
              <span className="text-xs" style={{ color: "var(--color-plum)", fontWeight: category === c.value ? 700 : 500 }}>
                {language === "pl" ? c.pl : c.label}
              </span>
              {category === c.value && (
                <div style={{ width: "20px", height: "2px", background: "var(--color-plum)", borderRadius: "1px" }} />
              )}
            </button>
          ))}
        </div>

        <p className="text-xs text-center" style={{ color: "var(--color-dusty-rose)" }}>{filtered.length} {language === "pl" ? "symboli" : (filtered.length !== 1 ? "symbols" : "symbol")}</p>

        {loading ? (
          <p className="text-center text-sm pt-10" style={{ color: "var(--color-dusty-rose)" }}>{t("loading")}</p>
        ) : filtered.length === 0 ? (
          <div className="text-center pt-10 space-y-2">
            <p className="text-3xl">⟡</p>
            <p className="text-sm" style={{ color: "var(--color-mauve)" }}>{language === "pl" ? "Nie znaleziono symboli." : "No symbols found."}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => (
              <button key={s.id} onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                className="w-full text-left rounded-2xl border transition-all"
                style={{ background: "var(--color-blush)", borderColor: expanded === s.id ? "var(--color-mauve)" : "var(--color-dusty-rose)" }}>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium capitalize" style={{ color: "var(--color-dark)" }}>{language === "pl" && s.symbol_pl ? s.symbol_pl : s.symbol}</span>
                    
                  </div>
                  <span className="text-xs transition-transform" style={{ color: "var(--color-dusty-rose)", transform: expanded === s.id ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
                </div>
                {expanded === s.id && (
                  <div className="px-4 pb-4 space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-gold)" }}>{t("symbols_meaning")}</p>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--color-dark)" }}>{language === "pl" && s.meaning_general_pl ? s.meaning_general_pl : s.meaning_general}</p>
                    </div>
                    {s.meaning_shadow && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-mauve)" }}>{t("symbols_shadow")}</p>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--color-dark)", opacity: 0.85 }}>{language === "pl" && s.meaning_shadow_pl ? s.meaning_shadow_pl : s.meaning_shadow}</p>
                      </div>
                    )}
                    {s.meaning_lunar && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-plum)" }}>{language === "pl" ? "Znaczenie ksiezycowe" : "Lunar Meaning"}</p>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--color-dark)", opacity: 0.85 }}>{language === "pl" && s.meaning_lunar_pl ? s.meaning_lunar_pl : s.meaning_lunar}</p>
                      </div>
                    )}
                    {s.related_archetypes?.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {s.related_archetypes.map((a) => (<span key={a} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--color-cream)", color: "var(--color-plum)" }}>{a}</span>))}
                      </div>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}