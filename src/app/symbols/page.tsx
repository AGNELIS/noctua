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

  useEffect(() => {
    loadSymbols();
  }, []);

  const loadSymbols = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("dream_symbols")
      .select("*")
      .order("symbol", { ascending: true });
    setSymbols(data || []);
    setLoading(false);
  };

  const filtered = symbols.filter((s) => {
    const matchesSearch = s.symbol
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory =
      category === "all" || s.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(to bottom, #f8f2e8, #f2ebe0, #ede4d8)",
      }}
    >
      <header className="flex items-center justify-between px-6 py-5">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-xs tracking-wide"
          style={{ color: "#9b8a7a" }}
        >
          ← Back
        </button>
        <h1
          className="text-sm tracking-[0.35em] uppercase font-light"
          style={{ color: "#7c6b3f" }}
        >
          Dream Symbols
        </h1>
        <div className="w-12" />
      </header>

      <main className="max-w-xl mx-auto px-6 pb-12 space-y-5">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search symbols..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder:text-[#c4b0a0]"
            style={{
              background: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(196,182,142,0.3)",
              color: "#3d2e4a",
            }}
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-6 px-6">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className="px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all border shrink-0"
              style={{
                background:
                  category === c.value
                    ? "rgba(124,107,63,0.12)"
                    : "rgba(255,255,255,0.4)",
                borderColor:
                  category === c.value
                    ? "rgba(124,107,63,0.3)"
                    : "rgba(196,182,142,0.3)",
                color: category === c.value ? "#3d2e4a" : "#8a7a6a",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-xs text-center" style={{ color: "#9b8a7a" }}>
          {filtered.length} symbol{filtered.length !== 1 ? "s" : ""}
        </p>

        {/* Symbol list */}
        {loading ? (
          <p className="text-center text-sm pt-10" style={{ color: "#9b8a7a" }}>
            Loading...
          </p>
        ) : filtered.length === 0 ? (
          <div className="text-center pt-10 space-y-2">
            <p className="text-3xl">⟡</p>
            <p className="text-sm" style={{ color: "#7c6b3f" }}>
              No symbols found.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() =>
                  setExpanded(expanded === s.id ? null : s.id)
                }
                className="w-full text-left rounded-2xl border transition-all"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  borderColor:
                    expanded === s.id
                      ? "rgba(124,107,63,0.4)"
                      : "rgba(196,182,142,0.25)",
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="text-sm font-medium capitalize"
                      style={{ color: "#3d2e4a" }}
                    >
                      {s.symbol}
                    </span>
                    {s.category && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(124,107,63,0.08)",
                          color: "#7c6b3f",
                        }}
                      >
                        {s.category}
                      </span>
                    )}
                  </div>
                  <span
                    className="text-xs transition-transform"
                    style={{
                      color: "#9b8a7a",
                      transform:
                        expanded === s.id
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                    }}
                  >
                    ▾
                  </span>
                </div>

                {/* Expanded content */}
                {expanded === s.id && (
                  <div className="px-4 pb-4 space-y-4">
                    {/* General meaning */}
                    <div className="space-y-1">
                      <p
                        className="text-xs font-medium uppercase tracking-wider"
                        style={{ color: "#7c6b3f" }}
                      >
                        General Meaning
                      </p>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "#4a3a3a" }}
                      >
                        {s.meaning_general}
                      </p>
                    </div>

                    {/* Shadow meaning */}
                    {s.meaning_shadow && (
                      <div className="space-y-1">
                        <p
                          className="text-xs font-medium uppercase tracking-wider"
                          style={{ color: "#8b5e7c" }}
                        >
                          Shadow Meaning
                        </p>
                        <p
                          className="text-sm leading-relaxed italic"
                          style={{ color: "#5e4e5e" }}
                        >
                          {s.meaning_shadow}
                        </p>
                      </div>
                    )}

                    {/* Lunar meaning */}
                    {s.meaning_lunar && (
                      <div className="space-y-1">
                        <p
                          className="text-xs font-medium uppercase tracking-wider"
                          style={{ color: "#6b5e8b" }}
                        >
                          Lunar Meaning
                        </p>
                        <p
                          className="text-sm leading-relaxed italic"
                          style={{ color: "#5e4e6b" }}
                        >
                          {s.meaning_lunar}
                        </p>
                      </div>
                    )}

                    {/* Archetypes */}
                    {s.related_archetypes &&
                      s.related_archetypes.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                          {s.related_archetypes.map((a) => (
                            <span
                              key={a}
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: "rgba(107,82,112,0.1)",
                                color: "#6b5270",
                              }}
                            >
                              {a}
                            </span>
                          ))}
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