"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n";
import { useTheme } from "@/context/ThemeContext";

const REWARDS = [
  { threshold: 3, type: "dream_analysis_1", en: "1 free dream reading", pl: "1 darmowy odczyt snu" },
  { threshold: 5, type: "theme_moonstone", en: "Exclusive theme: Moonstone", pl: "Ekskluzywny motyw: Moonstone" },
  { threshold: 10, type: "workbook_discount_30", en: "30% off any workbook + 2 dream readings", pl: "30% zniżki na workbook + 2 odczyty snów" },
  { threshold: 15, type: "theme_velvet_night", en: "Exclusive theme: Velvet Night", pl: "Ekskluzywny motyw: Velvet Night" },
  { threshold: 20, type: "premium_discount_30", en: "30% off Premium + 3 dream readings", pl: "30% zniżki na Premium + 3 odczyty snów" },
  { threshold: 30, type: "theme_obsidian_rose", en: "Exclusive theme: Obsidian Rose + Ambassador", pl: "Ekskluzywny motyw: Obsidian Rose + Ambasadorka" },
  { threshold: 50, type: "unlimited_dreams", en: "Lifetime unlimited dream readings", pl: "Dożywotnie nieograniczone odczyty snów" },
];

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
  const [userId, setUserId] = useState<string>("");
  const [ownedThemes, setOwnedThemes] = useState<string[]>([]);
  const [promoCodes, setPromoCodes] = useState<Record<string, string>>({});
  const [usedCodes, setUsedCodes] = useState<Set<string>>(new Set());

  useEffect(() => { loadReferralData(); }, []);

  const loadReferralData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setUserId(user.id);

    const { data: profile } = await supabase.from("profiles").select("referral_code").eq("id", user.id).single();
    const { count: jCount } = await supabase.from("journal_entries").select("id", { count: "exact", head: true });
    setJournalCount(jCount || 0);

    if (profile?.referral_code) {
      setReferralCode(profile.referral_code);
    } else if ((jCount || 0) >= 3) {
      const code = user.id.slice(0, 8).toUpperCase();
      await supabase.from("profiles").update({ referral_code: code }).eq("id", user.id);
      setReferralCode(code);
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
    setUsedCodes(new Set((rews || []).filter((r: any) => r.stripe_promo_code && r.is_used).map((r: any) => r.reward_type)));

    const { data: purchases } = await supabase
      .from("user_purchases")
      .select("product_id, shop_products(name)")
      .eq("user_id", user.id);
    const themeNames = (purchases || []).map((p: any) => (p.shop_products as any)?.name).filter(Boolean);
    setOwnedThemes(themeNames);

    setLoading(false);
  };

  const copyLink = () => {
    if (!referralCode) return;
    const link = `https://noctua-one.vercel.app/register?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canRefer = journalCount >= 3;
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

        <p className="text-center leading-relaxed" style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.05rem" }}>
          {pl
            ? "Zaproś kogoś, kto potrzebuje tej pracy. A Noctua pokaże Ci więcej o Tobie samej."
            : "Invite someone who needs this work. And Noctua will show you more about yourself."}
        </p>

        {isAmbassador && (
          <div className="text-center py-3 rounded-2xl" style={{ background: "linear-gradient(135deg, var(--color-plum), var(--color-mauve))" }}>
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-cream)", fontWeight: 600 }}>
              {pl ? "Ambasadorka Noctua" : "Noctua Ambassador"}
            </p>
          </div>
        )}

        {!canRefer ? (
          <section className="rounded-2xl border p-6 text-center space-y-3" style={{ background: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
            <p className="text-base" style={{ color: "var(--color-dark)", fontWeight: 500 }}>
              {pl
                ? "Potrzebujesz min. 3 wpisy w dzienniku żeby zapraszać."
                : "You need at least 3 journal entries to start inviting."}
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
          <span className="text-xs" style={{ color: "var(--color-gold)", opacity: 0.6 }}>◇</span>
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
              <div key={r.type} className="flex items-center justify-between p-4 rounded-2xl border transition-all" style={{ background: "var(--color-blush)", borderColor: earned ? "var(--color-mauve)" : "var(--color-dusty-rose)", opacity: earned ? 1 : 0.6 }}>
                <div className="flex-1">
                  <p className="text-sm" style={{ color: "var(--color-dark)", fontWeight: 500 }}>
                    {pl ? r.pl : r.en}
                  </p>
                  <p className="text-sm mt-1" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
                    {pl ? `${r.threshold} zaproszeń` : `${r.threshold} invitations`}
                  </p>
                </div>
                <div className="shrink-0 ml-3">
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
                    }} className="text-xs px-3 py-1.5 rounded-full" style={{ background: "var(--color-gold)", color: "var(--color-dark)", fontWeight: 500 }}>
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
                      }} className="text-xs px-3 py-1.5 rounded-full" style={{ background: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 500 }}>
                        {pl ? "Użyj motywu" : "Use theme"}
                      </button>
                    );
                  })()
                  : earned && r.type === "dream_analysis_1" ? (
                    <button onClick={() => router.push("/dreams")} className="text-xs px-3 py-1.5 rounded-full" style={{ background: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 500 }}>
                      {pl ? "Przejdź do snów" : "Go to dreams"}
                    </button>
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
                          }} className="text-xs px-3 py-1.5 rounded-full" style={{ background: "var(--color-gold)", color: "var(--color-dark)", fontWeight: 600, letterSpacing: "0.05em" }}>
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
                        }} className="text-xs px-3 py-1.5 rounded-full" style={{ background: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 500 }}>
                          {pl ? "Pobierz kod" : "Get code"}
                        </button>
                      )}
                      <p className="text-xs" style={{ color: "var(--color-mauve)", opacity: 0.7 }}>
                        {pl
                          ? r.type === "workbook_discount_30" ? "Wklej kod przy zakupie w sklepie" : "Wklej kod przy subskrypcji Premium"
                          : r.type === "workbook_discount_30" ? "Paste code at shop checkout" : "Paste code at Premium checkout"}
                      </p>
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
          <section className="text-center py-3">
            <span className="inline-block px-4 py-2 rounded-full text-xs" style={{ background: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600, letterSpacing: "0.1em" }}>
              {pl ? "Ambasadorka Noctua" : "Noctua Ambassador"}
            </span>
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