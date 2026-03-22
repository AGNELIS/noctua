"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/context/ThemeContext";

type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  price_gbp: number;
  preview_emoji: string;
  preview_colors: string[];
};

const CATEGORY_LABELS: Record<string, string> = {
  theme: "Themes",
  symbol_pack: "Symbol Packs",
};

const CATEGORY_ORDER = ["theme", "symbol_pack"];

export default function ShopPage() {
  const router = useRouter();
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
      .in("category", ["theme", "symbol_pack"])
      .order("sort_order");

    const { data: purch } = await supabase
      .from("user_purchases")
      .select("product_id");

    setProducts(prods || []);
    setPurchased(
      new Set((purch || []).map((p: { product_id: string }) => p.product_id))
    );
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

  const handleActivateTheme = async (
    productId: string,
    productName: string
  ) => {
    if (activeThemeId === productId) {
      await resetTheme();
    } else {
      await switchTheme(productId, productName);
    }
  };

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    items: products.filter((p) => p.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div
      className="min-h-screen transition-colors duration-500"
      style={{ backgroundColor: "var(--color-cream)" }}
    >
      <header className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-sm tracking-wide transition-colors duration-500"
            style={{ color: "var(--color-mauve)", fontWeight: 500 }}
          >
            ← Back
          </button>
          <div className="w-12" />
        </div>
        <h1
          className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3 transition-colors duration-500"
          style={{
            color: "var(--color-plum)",
            fontFamily: "'Antic Didone', Georgia, serif",
            fontWeight: 700,
          }}
        >
          Shop
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-6 pb-16">
        <p
          className="text-center text-base md:text-lg leading-relaxed mb-10 italic transition-colors duration-500"
          style={{
            color: "var(--color-mauve)",
            fontFamily: "'Antic Didone', Georgia, serif",
          }}
        >
          &ldquo;Adorn your sacred space.&rdquo;
        </p>

        {loading ? (
          <p className="text-center text-sm pt-12" style={{ color: "var(--color-dusty-rose)" }}>
            Loading...
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
                  {group.label}
                </h2>

                {group.category === "theme" ? (
                  <div className="grid grid-cols-2 gap-3">
                    {group.items.map((product) => {
                      const owned = purchased.has(product.id);
                      const isActive = activeThemeId === product.id;
                      return (
                        <div
                          key={product.id}
                          className="rounded-2xl border overflow-hidden transition-all duration-500"
                          style={{
                            borderColor: isActive
                              ? "var(--color-mauve)"
                              : "var(--color-dusty-rose)",
                            background: "var(--color-blush)",
                            boxShadow: isActive
                              ? "0 0 0 2px var(--color-mauve)"
                              : "none",
                          }}
                        >
                          <div className="h-16 flex">
                            {product.preview_colors.map((c, i) => (
                              <div
                                key={i}
                                className="flex-1"
                                style={{ background: c }}
                              />
                            ))}
                          </div>
                          <div className="p-4 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {product.preview_emoji}
                              </span>
                              <h3
                                className="text-base transition-colors duration-500"
                                style={{
                                  color: "var(--color-dark)",
                                  fontFamily:
                                    "'Cormorant Garamond', Georgia, serif",
                                  fontWeight: 600,
                                }}
                              >
                                {product.name}
                              </h3>
                            </div>
                            <p
                              className="text-sm leading-relaxed transition-colors duration-500"
                              style={{ color: "var(--color-mauve)" }}
                            >
                              {product.description}
                            </p>
                            {owned ? (
                              <button
                                onClick={() =>
                                  handleActivateTheme(product.id, product.name)
                                }
                                className="w-full py-2.5 rounded-lg text-sm tracking-wide border transition-all duration-500"
                                style={{
                                  borderColor: isActive
                                    ? "var(--color-mauve)"
                                    : "var(--color-dusty-rose)",
                                  color: isActive
                                    ? "var(--color-cream)"
                                    : "var(--color-plum)",
                                  background: isActive
                                    ? "var(--color-mauve)"
                                    : "transparent",
                                  fontWeight: 600,
                                }}
                              >
                                {isActive
                                  ? "✓ Active — tap to reset"
                                  : "Activate theme"}
                              </button>
                            ) : (
                              <button
                                onClick={() => handlePurchase(product.id)}
                                disabled={buying === product.id}
                                className="w-full py-2.5 rounded-lg text-sm tracking-wide transition-colors disabled:opacity-50"
                                style={{
                                  background: "var(--color-plum)",
                                  color: "var(--color-cream)",
                                  fontWeight: 600,
                                }}
                              >
                                {buying === product.id
                                  ? "Processing..."
                                  : `£${product.price_gbp.toFixed(2)}`}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {group.items.map((product) => {
                      const owned = purchased.has(product.id);
                      return (
                        <div
                          key={product.id}
                          className="flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500"
                          style={{
                            background: "var(--color-blush)",
                            borderColor: "var(--color-dusty-rose)",
                          }}
                        >
                          <span className="text-3xl shrink-0">
                            {product.preview_emoji}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h3
                              className="text-base transition-colors duration-500"
                              style={{
                                color: "var(--color-dark)",
                                fontFamily:
                                  "'Cormorant Garamond', Georgia, serif",
                                fontWeight: 600,
                              }}
                            >
                              {product.name}
                            </h3>
                            <p
                              className="text-sm leading-relaxed mt-0.5 transition-colors duration-500"
                              style={{ color: "var(--color-mauve)" }}
                            >
                              {product.description}
                            </p>
                          </div>
                          <div className="shrink-0">
                            {owned ? (
                              <span
                                className="text-sm tracking-wide transition-colors duration-500"
                                style={{ color: "var(--color-plum)", fontWeight: 500 }}
                              >
                                Owned ✓
                              </span>
                            ) : (
                              <button
                                onClick={() => handlePurchase(product.id)}
                                disabled={buying === product.id}
                                className="px-5 py-2.5 rounded-lg text-sm tracking-wide transition-colors disabled:opacity-50"
                                style={{
                                  background: "var(--color-plum)",
                                  color: "var(--color-cream)",
                                  fontWeight: 600,
                                }}
                              >
                                {buying === product.id
                                  ? "..."
                                  : `£${product.price_gbp.toFixed(2)}`}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
        {/* Dream Analysis Packs */}
        {!loading && (
          <section className="mt-24 space-y-4">
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
              Dream Analysis
            </h2>

            <div
              className="rounded-2xl p-5 flex items-center justify-between transition-all duration-500"
              style={{
                background: "var(--color-blush)",
                border: "1px solid var(--color-dusty-rose)",
              }}
            >
              <div>
                <h3
                  className="text-base transition-colors duration-500"
                  style={{
                    color: "var(--color-dark)",
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontWeight: 600,
                  }}
                >
                  5 dream analyses
                </h3>
                <p
                  className="text-2xl mt-1"
                  style={{
                    color: "var(--color-dark)",
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                  }}
                >
                  £2.99
                </p>
              </div>
              <button
                className="px-5 py-2.5 rounded-lg text-sm tracking-wide font-medium transition-all duration-300 hover:shadow-md"
                style={{
                  background: "linear-gradient(135deg, #D4AF37, #B8960B)",
                  color: "#fff",
                }}
                onClick={() => alert("Stripe integration coming soon!")}
              >
                Buy now
              </button>
            </div>

            <button
              onClick={() => router.push("/premium")}
              className="w-full text-center py-4 mt-2 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg, rgba(155,107,141,0.08), rgba(155,107,141,0.03))",
                border: "1px solid var(--color-dusty-rose)",
              }}
            >
              <p className="text-sm" style={{ color: "var(--color-mauve)" }}>
                Want unlimited dream analyses?
              </p>
              <p className="text-base mt-1" style={{ color: "var(--color-plum)", fontWeight: 600, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Explore Premium ✦
              </p>
            </button>
          </section>
        )}
      </main>
    </div>
  );
}