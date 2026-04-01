"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n";

type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  price_gbp: number;
};

export default function ProductPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [owned, setOwned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: prod } = await supabase.from("shop_products").select("*").eq("id", id).single();
      if (!prod) { router.push("/shop"); return; }
      setProduct(prod);

      const { data: purch } = await supabase.from("user_purchases").select("product_id").eq("product_id", id);
      setOwned((purch || []).length > 0);
      setLoading(false);
    };
    load();
  }, [id]);

  const handlePurchase = async () => {
    setBuying(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { error } = await supabase.from("user_purchases").insert({ user_id: user.id, product_id: id });
    if (!error) setOwned(true);
    setBuying(false);
  };

  if (loading || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-gradient)" }}>
        <p className="text-sm" style={{ color: "var(--color-dusty-rose)" }}>{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
      <header className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/shop")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>← {t("back")}</button>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-16 space-y-8">
        <section className="text-center space-y-4 pt-4">
          <h1 className="text-2xl md:text-3xl" style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
            {product.name}
          </h1>
          <p className="text-sm uppercase tracking-widest" style={{ color: "var(--color-mauve)" }}>
            {language === "pl"
              ? product.category === "theme" ? "Motyw" : product.category === "symbol_pack" ? "Paczka wiedzy" : product.category === "report" ? "Raport" : product.category === "interpretation" ? "Interpretacja" : product.category === "workbook" ? "Zeszyt pracy" : product.category
              : product.category === "theme" ? "Theme" : product.category === "symbol_pack" ? "Knowledge pack" : product.category === "report" ? "Report" : product.category === "interpretation" ? "Interpretation" : product.category === "workbook" ? "Workbook" : product.category
            }
          </p>
        </section>

        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
          <span className="text-xs" style={{ color: "var(--color-gold)", opacity: 0.6 }}>◇</span>
          <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
        </div>

        <section className="rounded-2xl border p-6 transition-colors duration-500" style={{ background: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
          <p className="text-base leading-relaxed" style={{ color: "var(--color-dark)" }}>
            {product.description}
          </p>
        </section>

        <section className="text-center space-y-4">
          <p className="text-3xl" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 700 }}>
            £{product.price_gbp.toFixed(2)}
          </p>

          {owned ? (
            <div className="py-3 rounded-xl text-sm tracking-wide" style={{ background: "var(--color-blush)", color: "var(--color-plum)", fontWeight: 500 }}>
              {language === "pl" ? "Posiadane" : "Owned"}
            </div>
          ) : (
            <button onClick={handlePurchase} disabled={buying}
              className="w-full py-3 rounded-xl text-sm tracking-wide transition-all disabled:opacity-50"
              style={{ background: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}>
              {buying ? "..." : (language === "pl" ? "Kup teraz" : "Buy now")}
            </button>
          )}
        </section>
      </main>
    </div>
  );
}