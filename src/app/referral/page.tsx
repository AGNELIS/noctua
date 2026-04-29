"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n";
import { useTheme } from "@/context/ThemeContext";
import { getEffectivePerms } from "@/lib/effective-perms";

const REWARDS = [
  { threshold: 3, type: "dream_analysis_1", en: "1 free dream reading", pl: "1 darmowy odczyt snu" },
  { threshold: 5, type: "theme_moonstone", en: "Exclusive theme: Moonstone", pl: "Ekskluzywny motyw: Moonstone" },
  { threshold: 10, type: "workbook_discount_30", en: "30% off any workbook + 2 dream readings", pl: "30% zniżki na workbook + 2 odczyty snów" },
  { threshold: 15, type: "theme_velvet_night", en: "Exclusive theme: Velvet Night", pl: "Ekskluzywny motyw: Velvet Night" },
  { threshold: 20, type: "premium_discount_30", en: "30% off Premium + 3 dream readings", pl: "30% zniżki na Premium + 3 odczyty snów" },
  { threshold: 30, type: "theme_obsidian_rose", en: "Exclusive theme: Obsidian Rose + Ambassador", pl: "Ekskluzywny motyw: Obsidian Rose + Ambasadorka" },
  { threshold: 50, type: "unlimited_dreams", en: "Lifetime unlimited dream readings", pl: "Dożywotnie nieograniczone odczyty snów" },
];

function availableReadingsPl(available: number, total: number): string {
  if (available === 1) return `Dostępny odczyt: ${available}/${total}`;
  const mod10 = available % 10;
  const mod100 = available % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `Dostępne odczyty: ${available}/${total}`;
  }
  return `Dostępnych odczytów: ${available}/${total}`;
}

export default function ReferralPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const pl = language === "pl";
  const { switchTheme, activeThemeId } = useTheme();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [journalCount, setJournalCount] = useState(0);
  const [rewards, setRewards] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [tierCredits, setTierCredits] = useState<Record<number, { available: number; total: number }>>({});
  const [userId, setUserId] = useState<string>("");
  const [ownedThemes, setOwnedThemes] = useState<string[]>([]);
  const [promoCodes, setPromoCodes] = useState<Record<string, string>>({});
  const [usedCodes, setUsedCodes] = useState<Set<string>>(new Set());
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => { loadReferralData(); }, []);

  const loadReferralData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setUserId(user.id);

    const { data: profile } = await supabase.from("profiles").select("referral_code, is_admin, is_premium, admin_test_mode").eq("id", user.id).single();
    const { isAdmin } = getEffectivePerms(profile);
    setIsAdmin(isAdmin);
    const [{ count: jCount }, { count: dCount }, { count: sCount }] = await Promise.all([
      supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("dream_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("shadow_work_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]);
    const totalEntries = (jCount || 0) + (dCount || 0) + (sCount || 0);
    setJournalCount(totalEntries);
    if (profile?.referral_code) {
      setReferralCode(profile.referral_code);
    } else if (totalEntries >= 3) {
      let code = "";
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = Array.from({ length: 8 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
        const { data: existing } = await supabase.from("profiles").select("id").eq("referral_code", candidate).maybeSingle();
        if (!existing) { code = candidate; break; }
      }
      if (code) {
        await supabase.from("profiles").update({ referral_code: code }).eq("id", user.id);
        setReferralCode(code);
      }
    }

    const { data: refs } = await supabase.from("referrals").select("status").eq("referrer_id", user.id);
    const completed = (refs || []).filter((r) => r.status === "completed").length;
    setCompletedCount(completed);

    // Auto-create rewards at thresholds
    try { await fetch("/api/check-referral-rewards", { method: "POST" }); } catch {}

    const { data: rews } = await supabase.from("referral_rewards").select("reward_type, stripe_promo_code, is_used").eq("user_id", user.id);
    setRewards((rews || []).map((r) => r.reward_type));
    const codes: Record<string, string> = {};
    (rews || []).forEach((r: any) => {
      if (r.stripe_promo_code) codes[r.reward_type] = r.stripe_promo_code;
    });
    setPromoCodes(codes);
    try {
      const statusRes = await fetch("/api/promo-codes-status");
      if (statusRes.ok) {
        const status = await statusRes.json();
        const used = new Set<string>();
        Object.entries(status).forEach(([rewardType, info]: [string, any]) => {
          if (info?.redeemed) used.add(rewardType);
        });
        setUsedCodes(used);
      } else {
        setUsedCodes(new Set());
      }
    } catch {
      setUsedCodes(new Set());
    }
    const { data: purchases } = await supabase
      .from("user_purchases")
      .select("product_id, shop_products(name)")
      .eq("user_id", user.id);
    const themeNames = (purchases || []).map((p: any) => (p.shop_products as any)?.name).filter(Boolean);
    setOwnedThemes(themeNames);

    // Count dream reading credits per tier
    const { data: dreamProduct } = await supabase
      .from("shop_products")
      .select("id")
      .eq("name", "Dream Reading")
      .single();
    if (dreamProduct) {
      const { data: tierPurchases } = await supabase
        .from("user_purchases")
        .select("stripe_session_id, used_at")
        .eq("user_id", user.id)
        .eq("product_id", dreamProduct.id)
        .in("stripe_session_id", ["referral_tier_3", "referral_tier_10", "referral_tier_20"]);
      const creditsByTier: Record<number, { available: number; total: number }> = {
        3: { available: 0, total: 0 },
        10: { available: 0, total: 0 },
        20: { available: 0, total: 0 },
      };
      (tierPurchases || []).forEach((p: any) => {
        const match = p.stripe_session_id?.match(/^referral_tier_(\d+)$/);
        if (match) {
          const tier = parseInt(match[1]);
          if (creditsByTier[tier]) {
            creditsByTier[tier].total++;
            if (!p.used_at) creditsByTier[tier].available++;
          }
        }
      });
      setTierCredits(creditsByTier);
    }

    setLoading(false);
  };

  const copyLink = () => {
    if (!referralCode) return;
    const link = `https://noctua-one.vercel.app/register?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canRefer = isAdmin || journalCount >= 3;
  const currentRewards = REWARDS;
  const isAmbassador = completedCount >= 30;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-gradient)" }}>
        <p className="text-sm" style={{ color: "var(--color-dusty-rose)" }}>{pl ? "Ładowanie..." : "Loading..."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
      <header className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/dashboard")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
            {pl ? "← Wróć" : "← Back"}
          </button>
          <div className="w-12" />
        </div>
        <h1 className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
          {pl ? "Zaproś i odblokuj" : "Invite & Unlock"}
        </h1>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-16 space-y-8 pt-4">

        <p className="text-center leading-relaxed" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.125rem", fontWeight: 500, opacity: 0.85 }}>
          {pl
            ? "Zaproś kogoś, kto potrzebuje tej pracy. A Noctua pokaże Ci więcej o Tobie samej."
            : "Invite someone who needs this work. And Noctua will show you more about yourself."}
        </p>

        {isAmbassador && (
          <div className="relative mx-auto my-6 px-8 py-8 text-center" style={{ maxWidth: "380px", border: "1.5px solid var(--color-plum)", borderRadius: "14px" }}>
            <div className="absolute left-1/2 flex items-center gap-3" style={{ top: "-14px", transform: "translateX(-50%)", background: "var(--color-gradient)", padding: "2px 14px", color: "var(--color-gold)", fontSize: "1.125rem", letterSpacing: "0.1em" }}>
              <span>♥</span>
              <span>♥</span>
              <span>♥</span>
            </div>
            <p style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "2rem", fontWeight: 700, letterSpacing: "0.04em", textShadow: "0 0 24px color-mix(in srgb, var(--color-gold) 55%, transparent)" }}>
              {pl ? "Ambasadorka Noctua" : "Noctua Ambassador"}
            </p>
          </div>
        )}

        {!canRefer ? (
          <section className="rounded-2xl border p-6 text-center space-y-3" style={{ background: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
            <p className="text-base" style={{ color: "var(--color-dark)", fontWeight: 500 }}>
              {pl
                ? "Potrzebujesz 3 wpisów w aplikacji żeby zapraszać."
                : "You need 3 entries in the app to start inviting."}
            </p>
            <p className="text-lg mt-2" style={{ color: "var(--color-plum)", fontWeight: 700, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              {pl ? `Masz: ${journalCount}/3` : `You have: ${journalCount}/3`}
            </p>
          </section>
        ) : (
          <section className="rounded-2xl border p-6 text-center space-y-4" style={{ background: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
              {pl ? "Twój link zaproszenia" : "Your invitation link"}
            </p>
            <div className="flex items-center justify-center gap-2">
              <code className="text-sm px-3 py-2 rounded-lg" style={{ background: "var(--color-cream)", color: "var(--color-plum)", fontWeight: 600 }}>
                {referralCode}
              </code>
              <button onClick={copyLink} className="px-4 py-2 rounded-lg text-sm" style={{ background: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 500 }}>
                {copied ? (pl ? "Skopiowano!" : "Copied!") : (pl ? "Kopiuj link" : "Copy link")}
              </button>
            </div>
            <p className="text-xs" style={{ color: "var(--color-mauve)" }}>
              {pl
                ? "Zaproszona osoba musi założyć konto i zrobić min. 3 wpisy żeby zaproszenie się zaliczyło."
                : "The invited person must create an account and make at least 3 entries for the invitation to count."}
            </p>
            <a href="/terms" className="text-xs underline mt-1 inline-block" style={{ color: "var(--color-mauve)", opacity: 0.7 }}>
              {pl ? "Jak działa program poleceń?" : "How does the referral programme work?"}
            </a>
          </section>
        )}

        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
          <span className="text-xs" style={{ color: "var(--color-gold)", opacity: 0.6 }}>♡</span>
          <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
        </div>

        <section className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-center" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
            {pl ? "Nagrody" : "Rewards"}
          </p>

          {currentRewards.map((r: { threshold: number; type: string; en: string; pl: string }) => {
            const earned = completedCount >= r.threshold;
            const isTheme = r.type.startsWith("theme_");
            return (
              <div key={r.type} className="flex items-start justify-between gap-6 py-6 border-b transition-all" style={{ borderBottomWidth: "1px", borderColor: "rgba(101, 74, 112, 0.35)", opacity: earned ? 1 : 0.55 }}>
                <div className="flex-1">
                  <p className="text-xs uppercase mb-2.5" style={{ color: "var(--color-mauve)", fontWeight: 500, letterSpacing: "0.2em" }}>
                    {pl ? `${r.threshold} zaproszeń` : `${r.threshold} invitations`}
                  </p>
                  <p style={{ color: "var(--color-dark)", fontWeight: 400, fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.375rem", lineHeight: 1.3 }}>
                    {pl ? r.pl : r.en}
                  </p>
                </div>
                <div className="shrink-0 text-right" style={{ paddingTop: "4px" }}>
                  {earned && isTheme && !ownedThemes.includes(r.type === "theme_moonstone" ? "Moonstone" : r.type === "theme_velvet_night" ? "Velvet Night" : "Obsidian Rose") ? (
                    <button onClick={async () => {
                      const supabase = createClient();
                      const themeName = r.type === "theme_moonstone" ? "Moonstone" : r.type === "theme_velvet_night" ? "Velvet Night" : "Obsidian Rose";
                      const { data: prod } = await supabase.from("shop_products").select("id").eq("name", themeName).single();
                      if (prod) {
                        await supabase.from("user_purchases").insert({ user_id: userId, product_id: prod.id });
                        await supabase.from("referral_rewards").update({ is_used: true }).eq("reward_type", r.type);
                        loadReferralData();
                      }
                    }} className="transition-all" style={{ color: "var(--color-gold)", fontWeight: 500, letterSpacing: "0.1em", fontSize: "0.875rem", borderBottom: "0.5px solid var(--color-gold)", paddingBottom: "3px" }}>
                      {pl ? "Aktywuj motyw" : "Activate theme"}
                    </button>
                  ) : earned && isTheme && ownedThemes.includes(r.type === "theme_moonstone" ? "Moonstone" : r.type === "theme_velvet_night" ? "Velvet Night" : "Obsidian Rose") ? (() => {
                    const themeName = r.type === "theme_moonstone" ? "Moonstone" : r.type === "theme_velvet_night" ? "Velvet Night" : "Obsidian Rose";
                    const prod = ownedThemes.includes(themeName);
                    return (
                      <button onClick={async () => {
                        const supabase = createClient();
                        const { data: product } = await supabase.from("shop_products").select("id").eq("name", themeName).single();
                        if (product) {
                          await switchTheme(product.id, themeName);
                        }
                      }} className="transition-all" style={{ color: "var(--color-gold)", fontWeight: 500, letterSpacing: "0.1em", fontSize: "0.875rem", borderBottom: "0.5px solid var(--color-gold)", paddingBottom: "3px" }}>
                        {pl ? "Użyj motywu" : "Use theme"}
                      </button>
                    );
                  })()
                  : earned && r.type === "dream_analysis_1" ? (
                    <div className="flex flex-col items-end gap-1">
                      <button onClick={() => router.push("/dreams")} className="transition-all" style={{ color: "var(--color-gold)", fontWeight: 500, letterSpacing: "0.1em", fontSize: "0.875rem", borderBottom: "0.5px solid var(--color-gold)", paddingBottom: "3px" }}>
                        {pl ? "Przejdź do snów" : "Go to dreams"}
                      </button>
                      {tierCredits[3] && tierCredits[3].total > 0 && (
                        <p className="text-xs" style={{ color: tierCredits[3].available > 0 ? "var(--color-plum)" : "var(--color-dusty-rose)", opacity: tierCredits[3].available > 0 ? 1 : 0.7, fontWeight: 600 }}>
                          {pl
                            ? availableReadingsPl(tierCredits[3].available, tierCredits[3].total)
                            : `Available readings: ${tierCredits[3].available}/${tierCredits[3].total}`}
                        </p>
                      )}
                    </div>
                  ) : earned && (r.type === "workbook_discount_30" || r.type === "premium_discount_30") ? (
                    <div className="flex flex-col items-end gap-1">
                      {usedCodes.has(r.type) ? (
                        <span className="text-xs px-3 py-1 rounded-full" style={{ background: "var(--color-dusty-rose)", color: "var(--color-cream)", fontWeight: 500, opacity: 0.7 }}>
                          {pl ? "Wykorzystany" : "Used"}
                        </span>
                      ) : promoCodes[r.type] ? (
                        <>
                          <button onClick={() => {
                            navigator.clipboard.writeText(promoCodes[r.type]);
                            setCopiedCode(r.type);
                            setTimeout(() => setCopiedCode(null), 1500);
                          }} className="rounded-full transition-all" style={{ background: "rgba(212, 165, 116, 0.12)", border: "0.5px solid var(--color-gold)", color: "var(--color-gold)", fontWeight: 600, letterSpacing: "0.25em", fontFamily: "'Courier New', monospace", fontSize: "0.875rem", padding: "8px 16px" }}>
                            {promoCodes[r.type]}
                          </button>
                          <p className="text-xs" style={{ color: copiedCode === r.type ? "var(--color-plum)" : "var(--color-mauve)", opacity: copiedCode === r.type ? 1 : 0.7, fontWeight: copiedCode === r.type ? 700 : 400 }}>
                            {copiedCode === r.type
                              ? (pl ? "Skopiowano ✓" : "Copied ✓")
                              : (pl ? "Kliknij żeby skopiować" : "Click to copy")}
                          </p>
                        </>
                      ) : (
                        <button onClick={async () => {
                          const res = await fetch("/api/referral-discount", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ reward_type: r.type }),
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setPromoCodes(prev => ({ ...prev, [r.type]: data.code }));
                            navigator.clipboard.writeText(data.code);
                            setCopiedCode(r.type);
                            setTimeout(() => setCopiedCode(null), 1500);
                          }
                        }} className="transition-all" style={{ color: "var(--color-gold)", fontWeight: 500, letterSpacing: "0.1em", fontSize: "0.875rem", borderBottom: "0.5px solid var(--color-gold)", paddingBottom: "3px" }}>
                          {pl ? "Pobierz kod" : "Get code"}
                        </button>
                      )}
                      <p className="text-xs" style={{ color: "var(--color-mauve)", opacity: 0.7 }}>
                        {pl
                          ? r.type === "workbook_discount_30" ? "Wklej kod przy zakupie w sklepie" : "Wklej kod przy subskrypcji Premium"
                          : r.type === "workbook_discount_30" ? "Paste code at shop checkout" : "Paste code at Premium checkout"}
                      </p>
                      {(() => {
                        const tier = r.type === "workbook_discount_30" ? 10 : 20;
                        const credits = tierCredits[tier];
                        if (!credits || credits.total === 0) return null;
                        return (
                          <p className="text-xs" style={{ color: credits.available > 0 ? "var(--color-plum)" : "var(--color-dusty-rose)", opacity: credits.available > 0 ? 1 : 0.7, fontWeight: 600 }}>
                            {pl
                              ? availableReadingsPl(credits.available, credits.total)
                              : `Available readings: ${credits.available}/${credits.total}`}
                          </p>
                        );
                      })()}
                    </div>
                  ) : earned && r.type === "unlimited_dreams" ? (
                    <span className="text-xs px-3 py-1 rounded-full" style={{ background: "linear-gradient(135deg, var(--color-plum), var(--color-gold))", color: "var(--color-cream)", fontWeight: 500 }}>
                      {pl ? "Aktywne na zawsze" : "Active forever"}
                    </span>
                  ) : earned ? (
                    <span className="text-xs px-3 py-1 rounded-full" style={{ background: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 500 }}>
                      {pl ? "Odblokowane" : "Unlocked"}
                    </span>
                  ) : (
                    <span className="text-base" style={{ color: "var(--color-plum)", fontWeight: 600 }}>
                      {completedCount}/{r.threshold}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {/* All badges progress */}
        {isAmbassador && (
          <section className="relative mx-auto my-6 px-8 py-8 text-center" style={{ maxWidth: "380px", border: "1.5px solid var(--color-plum)", borderRadius: "14px" }}>
            <div className="absolute left-1/2 flex items-center gap-3" style={{ top: "-14px", transform: "translateX(-50%)", background: "var(--color-gradient)", padding: "2px 14px", color: "var(--color-gold)", fontSize: "1.125rem", letterSpacing: "0.1em" }}>
              <span>♥</span>
              <span>♥</span>
              <span>♥</span>
            </div>
            <p style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "2rem", fontWeight: 700, letterSpacing: "0.04em", textShadow: "0 0 24px color-mix(in srgb, var(--color-gold) 55%, transparent)" }}>
              {pl ? "Ambasadorka Noctua" : "Noctua Ambassador"}
            </p>
          </section>
        )}

        <section className="text-center pt-2">
          <p className="text-2xl" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 700 }}>
            {completedCount}
          </p>
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--color-mauve)" }}>
            {pl ? "zaliczonych zaproszeń łącznie" : "total completed invitations"}
          </p>
        </section>

      </main>
    </div>
  );
}