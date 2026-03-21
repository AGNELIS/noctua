"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  workbook: "Workbooks",
  meditation: "Meditations",
  planner: "Planners",
};

const CATEGORY_ORDER = ["theme", "symbol_pack", "workbook", "meditation", "planner"];

export default function ShopPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [purchased, setPurchased] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    loadShop();
  }, []);

  const loadShop = async () => {
    const supabase = createClient();

    const { data: prods } = await supabase
      .from("shop_products")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    const { data: purch } = await supabase
      .from("user_purchases")
      .select("product_id");

    setProducts(prods || []);
    setPurchased(new Set((purch || []).map((p: { product_id: string }) => p.product_id)));
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

    // For now — direct "purchase" (free or mock)
    // Later: integrate Stripe checkout here
    const { error } = await supabase
      .from("user_purchases")
      .insert({ user_id: user.id, product_id: productId });

    if (!error) {
      setPurchased((prev) => new Set([...prev, productId]));
    }
    setBuying(null);
  };

  const handleActivateTheme = async (productId: string) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({ active_theme: productId })
      .eq("id", user.id);

    alert("Theme activated! (Visual switching coming soon)");
  };

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    items: products.filter((p) => p.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(to bottom, #faf5f0, #f5ede6, #f0e6de)",
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
          style={{ color: "#6b5270" }}
        >
          Shop
        </h1>
        <div className="w-12" />
      </header>

      <main className="max-w-2xl mx-auto px-6 pb-16">
        <p
          className="text-center text-sm leading-relaxed mb-8 italic"
          style={{ color: "#7a6580" }}
        >
          &ldquo;Adorn your sacred space.&rdquo;
        </p>

        {loading ? (
          <p className="text-center text-sm pt-12" style={{ color: "#9b8a7a" }}>
            Loading...
          </p>
        ) : (
          <div className="space-y-10">
            {grouped.map((group) => (
              <section key={group.category}>
                <h2
                  className="text-xs tracking-[0.3em] uppercase mb-4"
                  style={{ color: "#9b8a7a" }}
                >
                  {group.label}
                </h2>

                {group.category === "theme" ? (
                  // Themes — visual card grid
                  <div className="grid grid-cols-2 gap-3">
                    {group.items.map((product) => {
                      const owned = purchased.has(product.id);
                      return (
                        <div
                          key={product.id}
                          className="rounded-2xl border overflow-hidden transition-all"
                          style={{
                            borderColor: "rgba(212,181,199,0.3)",
                            background: "rgba(255,255,255,0.5)",
                          }}
                        >
                          {/* Color preview strip */}
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
                              <span className="text-lg">{product.preview_emoji}</span>
                              <h3
                                className="text-sm font-medium"
                                style={{ color: "#3d2e4a" }}
                              >
                                {product.name}
                              </h3>
                            </div>
                            <p
                              className="text-xs leading-relaxed"
                              style={{ color: "#8a7a6a" }}
                            >
                              {product.description}
                            </p>
                            {owned ? (
                              <button
                                onClick={() => handleActivateTheme(product.id)}
                                className="w-full py-2 rounded-lg text-xs tracking-wide border transition-colors"
                                style={{
                                  borderColor: "rgba(107,82,112,0.3)",
                                  color: "#6b5270",
                                  background: "rgba(107,82,112,0.05)",
                                }}
                              >
                                Activate theme
                              </button>
                            ) : (
                              <button
                                onClick={() => handlePurchase(product.id)}
                                disabled={buying === product.id}
                                className="w-full py-2 rounded-lg text-xs tracking-wide transition-colors disabled:opacity-50"
                                style={{ background: "#6b5270", color: "#ffffff" }}
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
                  // Other products — list
                  <div className="space-y-3">
                    {group.items.map((product) => {
                      const owned = purchased.has(product.id);
                      return (
                        <div
                          key={product.id}
                          className="flex items-center gap-4 p-4 rounded-2xl border transition-all"
                          style={{
                            background: "rgba(255,255,255,0.5)",
                            borderColor: "rgba(212,181,199,0.3)",
                          }}
                        >
                          <span className="text-3xl shrink-0">
                            {product.preview_emoji}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h3
                              className="text-sm font-medium"
                              style={{ color: "#3d2e4a" }}
                            >
                              {product.name}
                            </h3>
                            <p
                              className="text-xs leading-relaxed mt-0.5"
                              style={{ color: "#8a7a6a" }}
                            >
                              {product.description}
                            </p>
                          </div>
                          <div className="shrink-0">
                            {owned ? (
                              <span
                                className="text-xs tracking-wide"
                                style={{ color: "#6b5270" }}
                              >
                                Owned ✓
                              </span>
                            ) : (
                              <button
                                onClick={() => handlePurchase(product.id)}
                                disabled={buying === product.id}
                                className="px-4 py-2 rounded-lg text-xs tracking-wide transition-colors disabled:opacity-50"
                                style={{ background: "#6b5270", color: "#ffffff" }}
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
      </main>
    </div>
  );
}