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
  entry_gate: number | null;
};

type ShopStatus = {
  entries_total: number;
  entries_required: number;
  blocked: boolean;
  has_unused_credit: boolean;
};

const PRODUCT_PL: Record<string, { name: string; desc: string }> = {
  "Extended Dream Symbols": { name: "Rozszerzone symbole snów", desc: "Sny pokazują często więcej niż jesteśmy w stanie odczytać tradycyjnym słownikiem symboli. W wersji bez zakupu masz dostęp do ośmiu podstawowych symboli. Extended Dream Symbols jest dla momentu w którym chcesz pójść głębiej. Rozszerza Twój słownik do pięćdziesięciu symboli z głębokimi interpretacjami w duchu psychologii Junga, znaczeniami archetypowymi i połączeniami z pracą z cieniem, pokazując nie tylko co dany symbol oznacza, ale w jaki sposób odnosi się do Twojej własnej drogi wewnętrznej. Słownik rozszerza się z każdą aktualizacją aplikacji." },
  "Shadow Work Workbook": { name: "Zeszyt pracy z cieniem", desc: "Praca z cieniem to nie ćwiczenie do zrobienia raz. Shadow Work Workbook jest dla momentu w którym chcesz wejść w nią głębiej i mieć kogoś kto Cię przez nią poprowadzi. Zawiera prowadzony proces oparty na pytaniach konfrontujących, ćwiczeniach rozpoznawania własnych wzorców i etapach integracji, dopasowanych do faz księżyca. Każde pytanie ma swoje miejsce w cyklu i wraca do Ciebie wtedy kiedy ma większe znaczenie. Dostępny po piętnastu wpisach łącznie w dzienniku i pracy z cieniem." },
  "Dream Reading": { name: "Odczyt snu", desc: "Niektóre sny zostają z Tobą długo po przebudzeniu i czujesz że chcą coś powiedzieć. Dream Reading jest dla takich snów. Pogłębiona interpretacja jednego konkretnego snu, czytanego nie w izolacji ale w kontekście Twoich ostatnich wpisów z dziennika, powtarzających się wzorców emocjonalnych i fazy w której teraz jesteś. Łączy symbolikę w duchu psychologii Junga, perspektywę pracy z cieniem, fazę księżyca i kończy refleksyjnym pytaniem na zatrzymanie się. Dostępny od razu, bez progu wpisów." },
  "Dream Integration Workbook": { name: "Zeszyt integracji snów", desc: "Sny mają swoje własne tempo i sposób w jaki wracają do tego co ważne. Dream Integration Workbook jest dla momentu w którym chcesz przestać czytać sny przez pryzmat ogólnych interpretacji i zacząć rozumieć je jako wiadomości od siebie do siebie. Prowadzi przez Twoje powtarzające się symbole, łącząc to co widzisz w snach z tym co czujesz na jawie i z osobistymi znaczeniami które tylko Ty znasz. Dostępny po pięciu wpisach łącznie w dzienniku i snach." },
  "Cycle Alignment Workbook": { name: "Zeszyt harmonii cyklu", desc: "Twoje ciało ma swój rytm i często działa dokładnie wbrew temu co świat zewnętrzny od Ciebie oczekuje. Cycle Alignment Workbook jest dla momentu w którym chcesz przestać się temu rytmowi opierać i zacząć z nim współpracować. Prowadzi przez wszystkie cztery odsłony cyklu, pokazując czego potrzebujesz w każdej z nich, gdzie najczęściej forsujesz zamiast podążać i jak czytać sygnały które Twoje ciało już Ci wysyła. Dostępny po piętnastu wpisach w dzienniku cyklu." },
  "Full Reading": { name: "Pełen odczyt", desc: "Bywa że chcesz dać sobie chwilę i zobaczyć siebie szerzej. Nie wzorce z całego życia, nie szybki wgląd, ale pełniejszy obraz tego co u Ciebie teraz, w tym okresie, się dzieje. Co przyszło, co zostało, co dopiero zaczyna się układać. Full Reading jest dla takiego momentu. Łączy wszystko co napisałaś: dziennik, sny, pracę z cieniem, fazę cyklu i Twoje ostatnie Reflections, w jeden spokojny obraz. Dostępny po piętnastu wpisach łącznie w dzienniku, snach i pracy z cieniem." },
  "Pattern Reading": { name: "Odczyt wzorców", desc: "Czasami wracasz do tej samej reakcji. Tego samego rodzaju snów. Tej samej historii w innym opakowaniu. I sama nie wiesz czy to przypadek, czy coś co się w Tobie powtarza. Pattern Reading jest dla momentu w którym chcesz już to zobaczyć wprost. Pokazuje trzy najsilniejsze wzorce które wracają w Twoich wpisach, z konkretnymi dowodami w Twoich własnych słowach. Czyta wszystko co napisałaś dotychczas: dziennik, sny, pracę z cieniem oraz dane cyklu. Dostępne po piętnastu wpisach łącznie w dzienniku, snach i pracy z cieniem." },
  "Reflection": { name: "Refleksja", desc: "Zdarza się że coś się w Tobie zaczyna dziać i chciałabyś już teraz zobaczyć co to jest, bez czekania aż uzbiera się materiał na pełny odczyt. Reflection jest właśnie do tego. Krótki wgląd w to co napisałaś niedawno, do którego możesz wracać wtedy kiedy chcesz złapać siebie w biegu, sprawdzić skąd ten nastrój, albo po prostu zobaczyć z czego coś u Ciebie wynika. Czyta Twoje wpisy z dziennika, snów i pracy z cieniem. Pierwsza Reflection jest dostępna po pięciu wpisach. Każda kolejna po pięciu nowych od poprzedniej." },
  "Moon Workbook": { name: "Zeszyt Księżyca", desc: "Jak reagujesz kiedy nikt nie patrzy. Czego naprawdę potrzebujesz żeby czuć się bezpiecznie. Co robisz z emocjami kiedy nie masz czasu ich przetwarzać. Cztery etapy prowadzonej pracy opartej na pozycji Twojego natalnego Księżyca. Noctua wraca do Twoich odpowiedzi, widzi co się zmienia i zadaje pytania których wcześniej nie byłaś gotowa usłyszeć. Jeden zakup. Praca bez końca." },
  "Saturn Workbook": { name: "Zeszyt Saturna", desc: "Gdzie stawiasz sobie wymagania których nikt nie postawił. Jakie struktury budujesz ze strachu a jakie z wyboru. Co by się stało gdybyś przestała dźwigać. Cztery etapy konfrontacji opartej na pozycji Twojego natalnego Saturna. Noctua prowadzi Cię przez to co trzymasz za mocno i pyta dlaczego. Jeden zakup. Co 30 dni nowy cykl. Pytania rosną razem z Tobą." },
  "Pluto Workbook": { name: "Zeszyt Plutona", desc: "Gdzie kontrolujesz bo boisz się straty. Co trzymasz przy życiu choć powinno umrzeć. Jaka wersja Ciebie musi odejść żeby mogła przyjść następna. Prowadzony proces oparty na Twoim natalnym Plutonie. Noctua widzi wzorce w tym co piszesz i nie pozwala Ci ich ominąć. Jeden zakup. Transformacja wraca co 30 dni z pytaniami na które jesteś gotowa dopiero teraz." },
  "Chiron Workbook": { name: "Zeszyt Chirona", desc: "Rana która wraca niezależnie od tego ile razy ją przepracujesz. Nie dlatego że robisz to źle. Dlatego że ta rana jest nauczycielem, nie problemem do rozwiązania. Prowadzony proces oparty na Twoim natalnym Chironie. Noctua pokazuje co omijasz, nie po to żeby bolało, ale żeby wreszcie mogło się goić. Jeden zakup. Co 30 dni nowa warstwa gotowości." },
  "Lilith Workbook": { name: "Zeszyt Lilith", desc: "To co w Tobie nauczono Cię ukrywać. Moc której się wstydzisz. Instynkt który tłumisz bo ktoś kiedyś powiedział że jest za dużo. Prowadzony proces oparty na Twojej natalnej Lilith. Noctua czyta między wierszami tego co piszesz i nazywa to co Ty jeszcze nie umiesz. Jeden zakup. Odzyskujesz siebie tyle razy ile potrzebujesz." },
  "Lunar Nodes Workbook": { name: "Zeszyt Węzłów Księżycowych", desc: "Twoja strefa komfortu i to co poza nią. Stare wzorce które powtarzasz bo są znane. Kierunek który czujesz ale boisz się w niego iść. Prowadzony proces oparty na Twoich natalnych Węzłach Księżycowych. Noctua pokazuje skąd przychodzisz i dokąd zmierzasz. Jeden zakup. Co 30 dni nowe pytania. Dostępny po ukończeniu dwóch innych zeszytów." },
  "Depth Work Bundle": { name: "Pakiet Go Deeper", desc: "Każdy z planetarnych workbooków dotyka innej warstwy tego kim jesteś pod powierzchnią: emocje, struktury, rany, moc, transformacja, kierunek. Depth Work Bundle jest dla momentu w którym chcesz mieć dostęp do całej tej mapy w jednym miejscu, zamiast podejmować sześć osobnych decyzji. Zawiera sześć zeszytów planetarnych w pakiecie: Księżyc, Saturn, Pluton, Chiron, Lilith, Węzły Księżycowe. Jeden zakup zamiast sześciu, oszczędność 36%." },
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
  const [gateStatus, setGateStatus] = useState<ShopStatus | null>(null);
  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: prod } = await supabase.from("shop_products").select("*").eq("id", id).single();
      if (!prod) { router.push("/shop"); return; }
      setProduct(prod);
      const { data: purch } = await supabase.from("user_purchases").select("product_id").eq("product_id", id);
      setOwned((purch || []).length > 0);

      // Fetch gate status from server (handles admin bypass, scope, type correctly)
      try {
        const res = await fetch("/api/shop-status");
        if (res.ok) {
          const allStatuses = await res.json();
          if (allStatuses[id]) {
            setGateStatus({
              entries_total: allStatuses[id].entries_total,
              entries_required: allStatuses[id].entries_required,
              blocked: allStatuses[id].blocked,
              has_unused_credit: allStatuses[id].has_unused_credit || false,
            });
          }
        }
      } catch {
        // Silent fail — if endpoint unavailable, gate UI just won't show
      }

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
          <span className="text-xs" style={{ color: "var(--color-gold)", opacity: 0.6 }}>♡</span>
          <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
        </div>

        {product.category === "theme" && THEME_MAP[product.name] ? (
          <section className="space-y-4">
            <ThemePreview name={product.name} colors={THEME_MAP[product.name]} />
            {product.description && (
              <p lang={language} className="text-sm text-justify leading-relaxed hyphens-auto" style={{ color: "var(--color-mauve)" }}>
                {language === "pl" ? (PRODUCT_PL[product.name]?.desc || product.description) : product.description}
              </p>
            )}
          </section>
        ) : (
          <section className="rounded-2xl border p-6 transition-colors duration-500" style={{ background: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
            <p lang={language} className="text-base text-justify leading-relaxed hyphens-auto" style={{ color: "var(--color-dark)" }}>
              {language === "pl" ? (PRODUCT_PL[product.name]?.desc || product.description) : product.description}
            </p>
          </section>
        )}

        <section className="text-center space-y-4">
          {!owned && gateStatus && (gateStatus.blocked || gateStatus.has_unused_credit) ? null : appliedPromo ? (
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
                  style={{ background: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}
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
                  "Reflection": "/reports?tab=weekly",
                  "Full Reading": "/reports?tab=monthly",
                  "Pattern Reading": "/reports?tab=pattern",
                  "Dream Reading": "/dreams",
                  "Moon Workbook": "/workbooks/moon",
                  "Saturn Workbook": "/workbooks/saturn",
                  "Pluto Workbook": "/workbooks/pluto",
                  "Chiron Workbook": "/workbooks/chiron",
                  "Lilith Workbook": "/workbooks/lilith",
                  "Lunar Nodes Workbook": "/workbooks/lunar-nodes",
                };
                const route = routes[product.name];
                if (route) {
                  const separator = route.includes("?") ? "&" : "?";
                  router.push(route + separator + "from=shop");
                }
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
          ) : gateStatus && gateStatus.has_unused_credit ? (
            <div className="w-full py-6 rounded-xl text-center space-y-3" style={{ background: "var(--color-blush)", border: "1.5px solid var(--color-dusty-rose)" }}>
              <p className="px-4" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.1rem", fontWeight: 500, opacity: 0.9 }}>
                {language === "pl" ? "Masz już ten produkt. Użyj go zanim kupisz kolejny. ♡" : "You already have this. Use it before buying another. ♡"}
              </p>
              <button
                onClick={() => {
                  const routes: Record<string, string> = {
                    "Reflection": "/reports?tab=weekly",
                    "Full Reading": "/reports?tab=monthly",
                    "Pattern Reading": "/reports?tab=pattern",
                    "Dream Reading": "/dreams",
                  };
                  const route = routes[product.name];
                  if (route) {
                    const separator = route.includes("?") ? "&" : "?";
                    router.push(route + separator + "from=shop");
                  }
                }}
                className="px-6 py-2 rounded-xl text-sm tracking-wide transition-all"
                style={{ background: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}
              >
                {language === "pl" ? "Otwórz" : "Open"}
              </button>
            </div>
          ) : gateStatus && gateStatus.blocked ? (
            <div className="w-full py-4 text-center">
              <div className="flex flex-wrap gap-2 justify-center items-center mb-4 px-4">
                {Array.from({ length: gateStatus.entries_required }).map((_, i) => (
                  <span
                    key={i}
                    className="rounded-full"
                    style={{
                      width: "10px",
                      height: "10px",
                      background: i < gateStatus.entries_total ? "var(--color-mauve)" : "rgba(160, 130, 160, 0.2)",
                    }}
                  />
                ))}
              </div>
              <p className="px-4" style={{ color: "var(--color-mauve)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.15rem", fontStyle: "italic", lineHeight: "1.5" }}>
                {language === "pl"
                  ? `Jeszcze ${gateStatus.entries_required - gateStatus.entries_total} ${gateStatus.entries_required - gateStatus.entries_total === 1 ? "wpis" : "wpisów"} do odblokowania`
                  : `${gateStatus.entries_required - gateStatus.entries_total} more ${gateStatus.entries_required - gateStatus.entries_total === 1 ? "entry" : "entries"} until unlock`}
              </p>
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