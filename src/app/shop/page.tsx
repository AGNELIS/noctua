"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/lib/i18n";

type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  price_gbp: number;
  preview_emoji: string;
  preview_colors: string[];
};

const CATEGORY_LABELS: Record<string, { en: string; pl: string }> = {
  theme: { en: "Themes", pl: "Motywy" },
  symbol_pack: { en: "Knowledge packs", pl: "Paczki wiedzy" },
  report: { en: "Readings", pl: "Odczyty" },
  interpretation: { en: "Interpretations", pl: "Interpretacje" },
  self_work: { en: "Self Work", pl: "Praca z sobą" },
  depth_work: { en: "Depth Work", pl: "Praca w głębi" },
};

const CATEGORY_ORDER = ["theme", "symbol_pack", "report", "interpretation", "self_work", "depth_work"];

const PRODUCT_NAME_PL: Record<string, string> = {
  "Extended Dream Symbols": "Rozszerzone symbole snów",
  "Shadow Work Workbook": "Zeszyt pracy z cieniem",
  "Dream AI Analysis": "Analiza snu AI",
  "Dream Integration Workbook": "Zeszyt integracji snów",
  "Cycle Alignment Workbook": "Zeszyt harmonii cyklu",
  "Monthly Reading": "Odczyt miesięczny",
  "Pattern Reading": "Odczyt wzorców",
  "Weekly Insight": "Tygodniowy wgląd",
  "Moon Workbook": "Zeszyt Księżyca",
  "Saturn Workbook": "Zeszyt Saturna",
  "Pluto Workbook": "Zeszyt Plutona",
  "Chiron Workbook": "Zeszyt Chirona",
  "Lilith Workbook": "Zeszyt Lilith",
  "Lunar Nodes Workbook": "Zeszyt Węzłów Księżycowych",
};

const MIN_ENTRIES_REQUIRED: Record<string, number> = {
  report: 7,
  interpretation: 1,
  workbook: 3,
};

export default function ShopPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [purchased, setPurchased] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const { switchTheme, activeThemeId, resetTheme } = useTheme();

  useEffect(() => {
    loadShop();
  }, []);

  const loadShop = async () => {
    const supabase = createClient();
    const { data: prods } = await supabase
      .from("shop_products")
      .select("*")
      .eq("is_active", true)
      .in("category", ["theme", "symbol_pack", "report", "interpretation", "self_work", "depth_work"])
      .order("sort_order");

   const { data: purch } = await supabase
      .from("user_purchases")
      .select("product_id, used_at");

    const consumableCategories = ["interpretation", "report"];
    const ownedSet = new Set<string>();
    (purch || []).forEach((p: { product_id: string; used_at: string | null }) => {
      const prod = (prods || []).find((pr: { id: string }) => pr.id === p.product_id);
      if (prod && consumableCategories.includes(prod.category)) {
        if (!p.used_at) ownedSet.add(p.product_id);
      } else {
        ownedSet.add(p.product_id);
      }
    });

    setProducts(prods || []);
    setPurchased(ownedSet);
    setLoading(false);
  };

  const handlePurchase = async (productId: string) => {
    setBuying(productId);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("user_purchases")
      .insert({ user_id: user.id, product_id: productId });

    if (!error) {
      setPurchased((prev) => new Set([...prev, productId]));
    }
    setBuying(null);
  };

  const handleActivateTheme = async (productId: string, productName: string) => {
    if (activeThemeId === productId) {
      await resetTheme();
    } else {
      await switchTheme(productId, productName);
    }
  };

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat] || { en: cat, pl: cat },
    items: products.filter((p) => p.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div
      className="min-h-screen transition-colors duration-500"
      style={{ background: "var(--color-gradient)" }}
    >
      <header className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm tracking-wide transition-colors duration-500"
            style={{ color: "var(--color-mauve)", fontWeight: 500 }}
          >
            ← {t("back")}
          </button>
          <div className="w-12" />
        </div>
        <h1
          className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3 transition-colors duration-500"
          style={{
            color: "var(--color-plum)",
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 700,
          }}
        >
          {t("shop_title")}
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-6 pb-16">


        {loading ? (
          <p className="text-center text-sm pt-12" style={{ color: "var(--color-dusty-rose)" }}>
            {t("loading")}
          </p>
        ) : (
          <div className="space-y-10">
            {grouped.map((group) => (
              <section key={group.category}>
                <h2
                  className="uppercase mb-4 transition-colors duration-500"
                  style={{
                    color: "var(--color-mauve)",
                    fontWeight: 600,
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: "0.8rem",
                    letterSpacing: "0.15em",
                  }}
                >
                  {language === "pl" ? group.label.pl : group.label.en}
                </h2>

                {group.category === "theme" ? (
                  <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: "thin" }}>
                    {group.items.map((product) => {
                      const owned = purchased.has(product.id);
                      const isActive = activeThemeId === product.id;
                      const colors = product.preview_colors || ["#ccc", "#aaa", "#888"];
                      return (
                        <button
                          key={product.id}
                          onClick={() => {
                            if (owned) {
                              handleActivateTheme(product.id, product.name);
                            } else {
                              router.push(`/shop/${product.id}`);
                            }
                          }}
                          disabled={buying === product.id}
                          className="flex-shrink-0 flex flex-col items-center transition-all duration-300 hover:scale-[1.05] focus:outline-none disabled:opacity-50"
                          style={{ width: "90px" }}
                        >
                          <div
                            style={{
                              width: "64px",
                              height: "88px",
                              borderRadius: "14px",
                              border: isActive
                                ? "2.5px solid var(--color-plum)"
                                : "1.5px solid var(--color-dusty-rose)",
                              background: `linear-gradient(135deg, ${colors[0] || "#ccc"}, ${colors[1] || "#aaa"})`,
                              boxShadow: isActive
                                ? "0 4px 16px rgba(155,107,141,0.35)"
                                : "none",
                            }}
                          />
                          <p
                            className="text-xs mt-3 flex items-start justify-center text-center transition-colors duration-500"
                            style={{
                              height: "40px",
                              color: isActive ? "var(--color-plum)" : "var(--color-dark)",
                              fontWeight: isActive ? 600 : 500,
                              fontFamily: "'Cormorant Garamond', Georgia, serif",
                            }}
                          >
                            {language === "pl" ? (PRODUCT_NAME_PL[product.name] || product.name) : product.name}
                          </p>
                          <p
                            className="text-[10px] mt-1 text-center w-full"
                            style={{
                              color: isActive ? "var(--color-plum)" : "var(--color-mauve)",
                              fontWeight: isActive ? 600 : 400,
                            }}
                          >
                            {isActive
                              ? (language === "pl" ? "● Aktywny" : "● Active")
                              : owned
                              ? (language === "pl" ? "Kliknij aby aktywowac" : "Tap to activate")
                              : `£${product.price_gbp.toFixed(2)}`}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col gap-px rounded-2xl overflow-hidden border transition-all duration-500" style={{ borderColor: "color-mix(in srgb, var(--color-dusty-rose) 30%, transparent)" }}>
                    {group.items.map((product, idx) => {
                      const owned = purchased.has(product.id);
                      return (
                        <div key={product.id}>
                          <button
                            onClick={() => router.push(`/shop/${product.id}`)}
                            className="w-full flex justify-between items-center px-4 py-3.5 transition-all duration-500 hover:opacity-80"
                            style={{
                              background: "linear-gradient(135deg, color-mix(in srgb, var(--color-blush) 80%, transparent), color-mix(in srgb, var(--color-cream) 60%, transparent))",
                            }}
                          >
                            <span
                              className="text-base md:text-lg transition-colors duration-500"
                              style={{
                                color: "var(--color-dark)",
                                fontFamily: "'Cormorant Garamond', Georgia, serif",
                                fontWeight: 600,
                              }}
                            >
                              {language === "pl" ? (PRODUCT_NAME_PL[product.name] || product.name) : product.name}
                            </span>
                            <div className="flex items-center gap-2 shrink-0 ml-3">
                              <span className="text-sm transition-colors duration-500" style={{
                                color: owned ? "var(--color-mauve)" : "var(--color-plum)",
                                fontWeight: owned ? 500 : 600,
                              }}>
                                {owned ? (language === "pl" ? "Posiadane" : "Owned") : `£${product.price_gbp.toFixed(2)}`}
                              </span>
                              <span className="text-xs transition-colors duration-500" style={{ color: "var(--color-dusty-rose)" }}>›</span>
                            </div>
                          </button>
                          {idx < group.items.length - 1 && (
                            <div className="h-px transition-colors duration-500" style={{ background: "color-mix(in srgb, var(--color-dusty-rose) 20%, transparent)" }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}