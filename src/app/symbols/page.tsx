"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type DreamSymbol = {
  id: string;
  symbol: string;
  meaning_general: string;
  meaning_shadow: string | null;
  meaning_lunar: string | null;
  related_archetypes: string[];
  category: string | null;
};

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "animals", label: "🦉 Animals" },
  { value: "nature", label: "🌿 Nature" },
  { value: "elements", label: "🔥 Elements" },
  { value: "objects", label: "🔑 Objects" },
  { value: "actions", label: "⚡ Actions" },
  { value: "people", label: "👤 People" },
  { value: "body", label: "🩸 Body" },
  { value: "places", label: "🏠 Places" },
];

export default function SymbolsPage() {
  const router = useRouter();
  const [symbols, setSymbols] = useState<DreamSymbol[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { loadSymbols(); }, []);

  const loadSymbols = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("dream_symbols").select("*").order("symbol", { ascending: true });
    setSymbols(data || []);
    setLoading(false);
  };

  const filtered = symbols.filter((s) => {
    const matchesSearch = s.symbol.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || s.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ backgroundColor: "var(--color-cream)" }}>
      <header className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/dashboard")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>← Back</button>
          <div className="w-12" />
        </div>
        <h1 className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3" style={{ color: "var(--color-plum)", fontFamily: "'Antic Didone', Georgia, serif", fontWeight: 700 }}>Dream Symbols</h1>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-12 space-y-5">
        <div className="relative">
          <input type="text" placeholder="Search symbols..." value={search} onChange={(e) => setSearch(e.target.value)}
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
              }}
            >{c.label}</button>
          ))}
        </div>

        <p className="text-xs text-center" style={{ color: "var(--color-dusty-rose)" }}>{filtered.length} symbol{filtered.length !== 1 ? "s" : ""}</p>

        {loading ? (
          <p className="text-center text-sm pt-10" style={{ color: "var(--color-dusty-rose)" }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center pt-10 space-y-2">
            <p className="text-3xl">⟡</p>
            <p className="text-sm" style={{ color: "var(--color-mauve)" }}>No symbols found.</p>
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
                    {s.category && (<span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--color-cream)", color: "var(--color-mauve)" }}>{s.category}</span>)}
                  </div>
                  <span className="text-xs transition-transform" style={{ color: "var(--color-dusty-rose)", transform: expanded === s.id ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
                </div>
                {expanded === s.id && (
                  <div className="px-4 pb-4 space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-gold)" }}>General Meaning</p>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--color-dark)" }}>{s.meaning_general}</p>
                    </div>
                    {s.meaning_shadow && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-mauve)" }}>Shadow Meaning</p>
                        <p className="text-sm leading-relaxed italic" style={{ color: "var(--color-mauve)" }}>{s.meaning_shadow}</p>
                      </div>
                    )}
                    {s.meaning_lunar && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-plum)" }}>Lunar Meaning</p>
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