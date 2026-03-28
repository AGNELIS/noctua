"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n";
type DreamSymbol = {
  id: string;
  symbol: string;
  meaning_general: string;
  meaning_shadow: string | null;
  meaning_lunar: string | null;
  related_archetypes: string[];
  category: string | null;
  is_premium: boolean;
};

const CATEGORIES = [
  { value: "all", label: "All", pl: "Wszystkie" },
  { value: "animals", label: "🦉 Animals", pl: "🦉 Zwierzeta" },
  { value: "nature", label: "🌿 Nature", pl: "🌿 Natura" },
  { value: "elements", label: "🔥 Elements", pl: "🔥 Zywioly" },
  { value: "objects", label: "🔑 Objects", pl: "🔑 Przedmioty" },
  { value: "actions", label: "⚡ Actions", pl: "⚡ Dzialania" },
  { value: "people", label: "👤 People", pl: "👤 Ludzie" },
  { value: "body", label: "🩸 Body", pl: "🩸 Cialo" },
  { value: "places", label: "🏠 Places", pl: "🏠 Miejsca" },
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
    const { data: purchases } = await supabase
      .from("user_purchases")
      .select("product_id, shop_products(name)")
      .eq("shop_products.category", "symbol_pack");

    const ownsExtended = (purchases || []).some((p: any) => p.shop_products?.name === "Extended Dream Symbols");
    setHasExtended(ownsExtended);

    let query = supabase.from("dream_symbols").select("*").order("symbol", { ascending: true });
    if (!ownsExtended) query = query.eq("is_premium", false);

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
    <div className="min-h-screen transition-colors duration-500" style={{ backgroundColor: "var(--color-cream)" }}>
      <header className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/dashboard")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>← {t("back")}</button>
          <div className="w-12" />
        </div>
        <h1 className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3" style={{ color: "var(--color-plum)", fontFamily: "'Antic Didone', Georgia, serif", fontWeight: 700 }}>{t("symbols_title")}</h1>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-12 space-y-5">
        {hasExtended ? (
          <p className="text-center text-xs tracking-wide" style={{ color: "var(--color-mauve)" }}>
            {language === "pl" ? "Rozszerzony pakiet" : "Extended Pack"} - {symbols.length} {language === "pl" ? "symboli" : "symbols"}
          </p>
        ) : (
          <div className="text-center space-y-2">
            <p className="text-xs" style={{ color: "var(--color-mauve)" }}>{freeCount} {language === "pl" ? "symboli" : "symbols"}</p>
            <button onClick={() => router.push("/shop")}
              className="text-xs px-4 py-1.5 rounded-full border transition-all hover:scale-105"
              style={{ borderColor: "var(--color-gold)", color: "var(--color-gold)" }}>
              {language === "pl" ? "Odblokuj wiecej symboli" : "Unlock more symbols"} →
            </button>
          </div>
        )}

        <div className="relative">
          <input type="text" placeholder={language === "pl" ? "Szukaj symboli..." : "Search symbols..."} value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors duration-500"
            style={{ background: "var(--color-blush)", border: "1px solid var(--color-dusty-rose)", color: "var(--color-dark)" }} />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-6 px-6">
          {CATEGORIES.map((c) => (
            <button key={c.value} onClick={() => setCategory(c.value)}
              className="px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all border shrink-0"
              style={{
                background: category === c.value ? "var(--color-blush)" : "transparent",
                borderColor: category === c.value ? "var(--color-mauve)" : "var(--color-dusty-rose)",
                color: category === c.value ? "var(--color-plum)" : "var(--color-mauve)",
              }}>{language === "pl" ? c.pl : c.label}</button>
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
                    <span className="text-sm font-medium capitalize" style={{ color: "var(--color-dark)" }}>{s.symbol}</span>
                    {s.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--color-cream)", color: "var(--color-mauve)" }}>{language === "pl" ? (CATEGORIES.find(c => c.value === s.category)?.pl?.replace(/^.\s/, "") || s.category) : s.category}</span>
                    )}
                  </div>
                  <span className="text-xs transition-transform" style={{ color: "var(--color-dusty-rose)", transform: expanded === s.id ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
                </div>
                {expanded === s.id && (
                  <div className="px-4 pb-4 space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-gold)" }}>{t("symbols_meaning")}</p>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--color-dark)" }}>{s.meaning_general}</p>
                    </div>
                    {s.meaning_shadow && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-mauve)" }}>{t("symbols_shadow")}</p>
                        <p className="text-sm leading-relaxed italic" style={{ color: "var(--color-mauve)" }}>{s.meaning_shadow}</p>
                      </div>
                    )}
                    {s.meaning_lunar && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-plum)" }}>{language === "pl" ? "Znaczenie ksiezycowe" : "Lunar Meaning"}</p>
                        <p className="text-sm leading-relaxed italic" style={{ color: "var(--color-plum)" }}>{s.meaning_lunar}</p>
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