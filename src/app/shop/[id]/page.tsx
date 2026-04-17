"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n";
import { THEME_MAP, type ThemeColors } from "@/lib/themes";

type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  price_gbp: number;
};

const PRODUCT_PL: Record<string, { name: string; desc: string }> = {
  "Extended Dream Symbols": { name: "Rozszerzone symbole snów", desc: "25+ dodatkowych symboli snów z głębokimi interpretacjami jungowskimi, znaczeniami archetypowymi i połączeniami z pracą z cieniem. Nowe symbole dodawane z każdą aktualizacją." },
  "Shadow Work Workbook": { name: "Zeszyt pracy z cieniem", desc: "Prowadzony interaktywny proces do głębokiej pracy wewnętrznej. Zawiera prompty konfrontacyjne, rozpoznawanie wzorców i ćwiczenia integracyjne dopasowane do faz księżyca." },
  "Dream AI Analysis": { name: "Analiza snu AI", desc: "Pojedyncza interpretacja snu z wykorzystaniem AI. Symbolika jungowska, kontekst emocjonalny i połączenia z pracą z cieniem." },
  "Dream Integration Workbook": { name: "Zeszyt integracji snów", desc: "Interaktywna podróż przez powtarzające się symbole snów. Zrozum co Twoje sny próbują Ci powiedzieć poprzez uczucia, symbolikę i osobiste znaczenie." },
  "Cycle Alignment Workbook": { name: "Zeszyt harmonii cyklu", desc: "Prowadzony proces przez wszystkie cztery fazy cyklu. Odkryj czego potrzebujesz w każdej fazie, gdzie forsуjesz zamiast podążać i jak zsynchronizować się ze swoim ciałem." },
  "Your Monthly Insight": { name: "Twój miesięczny wgląd", desc: "Głęboki osobisty raport analizujący wzorce z dziennika, symbole snów, dane cyklu i fazy księżyca. To nie jest raport. To jest czytanie Ciebie." },
  "Pattern Recognition Report": { name: "Raport rozpoznawania wzorców", desc: "Jednorazowa głęboka analiza ujawniająca Twoje powtarzające się wzorce emocjonalne, cykle behawioralne i martwe punkty na podstawie dziennika, snów i danych cyklu." },
  "Weekly Insight": { name: "Tygodniowy wgląd", desc: "Osobisty odczyt AI z Twojego tygodnia. Na podstawie dziennika, snów i pracy z cieniem z ostatnich 7 dni. Nie podsumowanie. Czytanie." },
  "Moon Workbook": { name: "Zeszyt Księżyca", desc: "Jak reagujesz kiedy nikt nie patrzy. Czego naprawdę potrzebujesz żeby czuć się bezpiecznie. Co robisz z emocjami kiedy nie masz czasu ich przetwarzać. Cztery etapy prowadzonej pracy opartej na pozycji Twojego natalnego Księżyca. Noctua wraca do Twoich odpowiedzi, widzi co się zmienia i zadaje pytania których wcześniej nie byłaś gotowa usłyszeć. Jeden zakup. Praca bez końca." },
  "Saturn Workbook": { name: "Zeszyt Saturna", desc: "Gdzie stawiasz sobie wymagania których nikt nie postawił. Jakie struktury budujesz ze strachu a jakie z wyboru. Co by się stało gdybyś przestała dźwigać. Cztery etapy konfrontacji opartej na pozycji Twojego natalnego Saturna. Noctua prowadzi Cię przez to co trzymasz za mocno i pyta dlaczego. Jeden zakup. Co 30 dni nowy cykl. Pytania rosną razem z Tobą." },
  "Pluto Workbook": { name: "Zeszyt Plutona", desc: "Gdzie kontrolujesz bo boisz się straty. Co trzymasz przy życiu choć powinno umrzeć. Jaka wersja Ciebie musi odejść żeby mogła przyjść następna. Prowadzony proces oparty na Twoim natalnym Plutonie. Noctua widzi wzorce w tym co piszesz i nie pozwala Ci ich ominąć. Jeden zakup. Transformacja wraca co 30 dni z pytaniami na które jesteś gotowa dopiero teraz." },
  "Chiron Workbook": { name: "Zeszyt Chirona", desc: "Rana która wraca niezależnie od tego ile razy ją przepracujesz. Nie dlatego że robisz to źle. Dlatego że ta rana jest nauczycielem, nie problemem do rozwiązania. Prowadzony proces oparty na Twoim natalnym Chironie. Noctua pokazuje co omijasz, nie po to żeby bolało, ale żeby wreszcie mogło się goić. Jeden zakup. Co 30 dni nowa warstwa gotowości." },
  "Lilith Workbook": { name: "Zeszyt Lilith", desc: "To co w Tobie nauczono Cię ukrywać. Moc której się wstydzisz. Instynkt który tłumisz bo ktoś kiedyś powiedział że jest za dużo. Prowadzony proces oparty na Twojej natalnej Lilith. Noctua czyta między wierszami tego co piszesz i nazywa to co Ty jeszcze nie umiesz. Jeden zakup. Odzyskujesz siebie tyle razy ile potrzebujesz." },
  "Lunar Nodes Workbook": { name: "Zeszyt Węzłów Księżycowych", desc: "Twoja strefa komfortu i to co poza nią. Stare wzorce które powtarzasz bo są znane. Kierunek który czujesz ale boisz się w niego iść. Prowadzony proces oparty na Twoich natalnych Węzłach Księżycowych. Noctua pokazuje skąd przychodzisz i dokąd zmierzasz. Jeden zakup. Co 30 dni nowe pytania. Dostępny po ukończeniu dwóch innych zeszytów." },
  "Depth Work Bundle": { name: "Pakiet Go Deeper", desc: "Sześć zeszytów planetarnych w jednym: Księżyc, Saturn, Pluton, Chiron, Lilith, Węzły Księżycowe. Pełna mapa tego kim jesteś pod powierzchnią. Każdy zeszyt odnawia się co 30 dni. Noctua prowadzi Cię przez emocje, struktury, rany, moc, transformację i kierunek. Jeden zakup zamiast sześciu. Oszczędzasz 36%." },
};

const ANIMATED_THEMES = ["Moonstone", "Velvet Night", "Obsidian Rose", "Falling Stars", "Cherry Rain", "Ocean Drift"];

const ANIM_STYLES = `
@keyframes prevAurora { 0%,100% { transform: translateX(-10%) scaleY(1); } 50% { transform: translateX(15%) scaleY(1.3); } }
@keyframes prevTwinkle { 0%,100% { opacity: 0.1; transform: scale(0.8); } 50% { opacity: 0.85; transform: scale(1.2); } }
@keyframes prevNebula { 0%,100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.2) rotate(10deg); opacity: 1; } }
@keyframes prevPetal { 0% { transform: translateY(0) rotate(25deg); opacity: 0; } 10% { opacity: 0.5; } 90% { opacity: 0.2; } 100% { transform: translateY(-200px) rotate(205deg) scale(0.6); opacity: 0; } }
@keyframes prevVolcanic { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
@keyframes prevFall { 0% { transform: translateY(0) translateX(0); opacity: 0; } 5% { opacity: 0.9; } 70% { opacity: 0.4; } 100% { transform: translateY(200px) translateX(30px); opacity: 0; } }
@keyframes prevCherryFall { 0% { transform: translateY(0) rotate(0deg); opacity: 0; } 8% { opacity: 0.6; } 50% { opacity: 0.4; } 100% { transform: translateY(200px) rotate(180deg); opacity: 0; } }
@keyframes prevRipple { 0% { transform: scale(0); opacity: 0.7; border-width: 3px; } 40% { opacity: 0.4; } 100% { transform: scale(1); opacity: 0; border-width: 0.5px; } }
`;

function ThemePreview({ name, colors }: { name: string; colors: ThemeColors }) {
  const isAnimated = ANIMATED_THEMES.includes(name);

  return (
    <>
      {isAnimated && <style dangerouslySetInnerHTML={{ __html: ANIM_STYLES }} />}
      <div className="rounded-2xl overflow-hidden relative" style={{ height: "280px", background: colors.gradient, border: "1px solid " + colors["dusty-rose"] + "40" }}>
        
        {/* Animation layer */}
        {name === "Moonstone" && (
          <>
            <div style={{ position: "absolute", width: "200%", height: "60px", opacity: 0.15, borderRadius: "50%", filter: "blur(20px)", background: "#9B6BCD", top: "15%", left: "-50%", animation: "prevAurora 8s ease-in-out infinite" }} />
            <div style={{ position: "absolute", width: "200%", height: "50px", opacity: 0.1, borderRadius: "50%", filter: "blur(20px)", background: "#b498c8", top: "55%", left: "-30%", animation: "prevAurora 10s ease-in-out infinite reverse" }} />
          </>
        )}
        {name === "Velvet Night" && (
          <>
            <div style={{ position: "absolute", width: "100px", height: "100px", borderRadius: "50%", filter: "blur(30px)", background: "rgba(152,88,160,0.2)", top: "10%", right: "10%", animation: "prevNebula 12s ease-in-out infinite" }} />
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} style={{ position: "absolute", width: (1 + Math.random() * 2) + "px", height: (1 + Math.random() * 2) + "px", background: "#fff", borderRadius: "50%", left: (5 + i * 3.8) + "%", top: (5 + ((i * 17) % 90)) + "%", opacity: 0.2 + (i % 4) * 0.15, animation: `prevTwinkle ${2 + (i % 3) * 1.5}s ease-in-out infinite ${i * 0.3}s` }} />
            ))}
          </>
        )}
        {name === "Obsidian Rose" && (
          <>
            <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "40%", background: "radial-gradient(ellipse at bottom center, rgba(180,60,80,0.15) 0%, transparent 70%)", animation: "prevVolcanic 6s ease-in-out infinite" }} />
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ position: "absolute", width: (5 + i % 3 * 3) + "px", height: (6 + i % 3 * 3) + "px", background: "rgba(192,88,120,0.2)", borderRadius: "50% 50% 50% 0", bottom: "-10px", left: (10 + i * 11) + "%", animation: `prevPetal ${7 + i * 1.2}s linear infinite ${i * 1.5}s` }} />
            ))}
          </>
        )}
        {name === "Falling Stars" && (
          <>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ position: "absolute", width: "2px", height: "2px", background: "#ffe8a0", borderRadius: "50%", left: (5 + i * 12) + "%", top: (5 + (i * 7) % 25) + "%", opacity: 0, animation: `prevFall ${3 + i * 0.5}s linear infinite ${i * 1.2}s` }} />
            ))}
          </>
        )}
        {name === "Cherry Rain" && (
          <>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{ position: "absolute", width: (5 + i % 3 * 3) + "px", height: (6 + i % 3 * 3) + "px", background: `rgba(${210 + i * 4},${80 + i * 5},${100 + i * 5},0.25)`, borderRadius: "50% 50% 50% 0", top: "-10px", left: (5 + i * 9.5) + "%", animation: `prevCherryFall ${5 + i * 0.8}s ease-in-out infinite ${i * 1}s` }} />
            ))}
          </>
        )}
        {name === "Ocean Drift" && (
          <>
            {[
              { x: "30%", y: "35%", size: 120, dur: 4, delay: 0 },
              { x: "65%", y: "55%", size: 100, dur: 5, delay: 1.5 },
              { x: "45%", y: "45%", size: 140, dur: 6, delay: 3 },
            ].map((r, i) => (
              <div key={i} style={{ position: "absolute", left: r.x, top: r.y, width: r.size + "px", height: r.size + "px", marginLeft: -(r.size/2) + "px", marginTop: -(r.size/2) + "px", borderRadius: "50%", border: "2px solid rgba(30,80,140,0.3)", animation: `prevRipple ${r.dur}s ease-out infinite ${r.delay}s`, opacity: 0 }} />
            ))}
          </>
        )}

        {/* Mini dashboard mockup */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "24px", textAlign: "center" }}>
          <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: colors.plum, fontWeight: 700, marginBottom: "8px", fontFamily: "'Cinzel Decorative', serif" }}>Noctua</p>
          <p style={{ fontSize: "20px", color: colors.dark, fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, marginBottom: "4px" }}>Full Moon</p>
          <p style={{ fontSize: "11px", color: colors.mauve, marginBottom: "16px" }}>98% illuminated</p>
          <p style={{ fontSize: "13px", color: colors.dark, fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", lineHeight: 1.5, maxWidth: "220px", opacity: 0.8 }}>
            "What can you see now that you were not ready to see before?"
          </p>
          <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
            <div style={{ padding: "4px 12px", borderRadius: "12px", fontSize: "9px", background: colors.blush, color: colors.plum, border: "1px solid " + colors["dusty-rose"] + "60" }}>Journal</div>
            <div style={{ padding: "4px 12px", borderRadius: "12px", fontSize: "9px", background: colors.blush, color: colors.plum, border: "1px solid " + colors["dusty-rose"] + "60" }}>Dreams</div>
            <div style={{ padding: "4px 12px", borderRadius: "12px", fontSize: "9px", background: colors.blush, color: colors.plum, border: "1px solid " + colors["dusty-rose"] + "60" }}>Shadow</div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ProductPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [owned, setOwned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPercent: number } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

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

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const res = await fetch("/api/validate-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promoCode: promoInput.trim(),
          context: "shop",
          productId: id,
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedPromo({ code: data.code, discountPercent: data.discount_percent });
        setPromoError("");
      } else {
        setPromoError(data.error || (language === "pl" ? "Nieprawidłowy kod" : "Invalid code"));
        setAppliedPromo(null);
      }
    } catch {
      setPromoError(language === "pl" ? "Błąd walidacji" : "Validation error");
    } finally {
      setPromoLoading(false);
    }
  };

  const handlePurchase = async () => {
    setBuying(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: id,
          productName: product?.name,
          priceGbp: product?.price_gbp,
          promoCode: appliedPromo?.code || null,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setBuying(false);
      }
    } catch {
      setBuying(false);
    }
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
          <button onClick={() => router.back()} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>← {t("back")}</button>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-16 space-y-8">
        <section className="text-center space-y-2 pt-4">

          <h1 className="text-2xl md:text-3xl" style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
            {language === "pl" ? (PRODUCT_PL[product.name]?.name || product.name) : product.name}
          </h1>
        </section>

        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
          <span className="text-xs" style={{ color: "var(--color-gold)", opacity: 0.6 }}>◇</span>
          <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
        </div>

        {product.category === "theme" && THEME_MAP[product.name] ? (
          <section className="space-y-4">
            <ThemePreview name={product.name} colors={THEME_MAP[product.name]} />
            {product.description && (
              <p className="text-sm text-center leading-relaxed" style={{ color: "var(--color-mauve)" }}>
                {language === "pl" ? (PRODUCT_PL[product.name]?.desc || product.description) : product.description}
              </p>
            )}
          </section>
        ) : (
          <section className="rounded-2xl border p-6 transition-colors duration-500" style={{ background: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
            <p className="text-base leading-relaxed" style={{ color: "var(--color-dark)" }}>
              {language === "pl" ? (PRODUCT_PL[product.name]?.desc || product.description) : product.description}
            </p>
          </section>
        )}

        <section className="text-center space-y-4">
          {appliedPromo ? (
            <div className="space-y-1">
              <p className="text-sm line-through" style={{ color: "var(--color-mauve)", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                £{product.price_gbp.toFixed(2)}
              </p>
              <p className="text-3xl" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 700 }}>
                £{(product.price_gbp * (1 - appliedPromo.discountPercent / 100)).toFixed(2)}
              </p>
              <p className="text-xs tracking-wide" style={{ color: "var(--color-gold)", fontWeight: 600 }}>
                {language === "pl" ? "Kod zastosowany" : "Code applied"}: {appliedPromo.code} (-{appliedPromo.discountPercent}%)
              </p>
            </div>
          ) : (
            <p className="text-3xl" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 700 }}>
              £{product.price_gbp.toFixed(2)}
            </p>
          )}

          {!owned && product.category === "self_work" && !appliedPromo && (
            <div className="space-y-2 pt-2">
              <p className="text-xs tracking-wide" style={{ color: "var(--color-mauve)" }}>
                {language === "pl" ? "Masz kod promocyjny?" : "Have a promo code?"}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  placeholder={language === "pl" ? "Wpisz kod" : "Enter code"}
                  className="flex-1 px-3 py-2 rounded-lg text-sm text-center tracking-wider"
                  style={{ background: "var(--color-cream)", color: "var(--color-dark)", border: "1px solid var(--color-mauve)" }}
                />
                <button
                  onClick={handleApplyPromo}
                  disabled={promoLoading || !promoInput.trim()}
                  className="px-4 py-2 rounded-lg text-xs tracking-wide transition-all disabled:opacity-50"
                  style={{ background: "var(--color-gold)", color: "var(--color-dark)", fontWeight: 600 }}
                >
                  {promoLoading ? "..." : (language === "pl" ? "Zastosuj" : "Apply")}
                </button>
              </div>
              {promoError && (
                <p className="text-xs" style={{ color: "#c04040" }}>{promoError}</p>
              )}
            </div>
          )}

          {owned ? (
            <button
              onClick={() => {
                const routes: Record<string, string> = {
                  "Shadow Work Workbook": "/shadow-work/workbook",
                  "Dream Integration Workbook": "/dreams/workbook",
                  "Cycle Alignment Workbook": "/cycle/workbook",
                  "Monthly Reading": "/reports",
                  "Pattern Reading": "/reports",
                  "Dream AI Analysis": "/dreams",
                  "Moon Workbook": "/workbooks/moon",
                  "Saturn Workbook": "/workbooks/saturn",
                  "Pluto Workbook": "/workbooks/pluto",
                  "Chiron Workbook": "/workbooks/chiron",
                  "Lilith Workbook": "/workbooks/lilith",
                  "Lunar Nodes Workbook": "/workbooks/lunar-nodes",
                };
                const route = routes[product.name];
                if (route) router.push(route + "?from=shop");
              }}
              className="w-full py-3 rounded-xl text-sm tracking-wide transition-all"
              style={{
                background: "linear-gradient(135deg, var(--color-plum), var(--color-mauve))",
                color: "var(--color-cream)",
                fontWeight: 600,
              }}
            >
              {language === "pl" ? "Otwórz" : "Open"}
            </button>
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