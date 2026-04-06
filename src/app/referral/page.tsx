"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n";

const CYCLE_1_REWARDS = [
  { threshold: 3, type: "dream_analysis", en: "1 free AI dream analysis", pl: "1 darmowa analiza snu AI" },
  { threshold: 10, type: "monthly_report", en: "1 free monthly reading", pl: "1 darmowy odczyt miesięczny" },
  { threshold: 20, type: "badge", en: "Ambassador badge", pl: "Odznaka Ambasadorki" },
];

const CYCLE_2_REWARDS = [
  { threshold: 5, type: "personal_letter", en: "Personal Letter from AGNÉLIS", pl: "Osobisty list od AGNÉLIS" },
  { threshold: 10, type: "exclusive_theme", en: "Exclusive theme (referral only)", pl: "Ekskluzywny motyw (tylko przez zaproszenia)" },
  { threshold: 15, type: "deep_reading", en: "Deep Reading (multi-month panorama)", pl: "Głęboki odczyt (panorama wielu miesięcy)" },
  { threshold: 20, type: "shadow_mirror", en: "Shadow Mirror (your full journey)", pl: "Lustro cienia (cała Twoja podróż)" },
];

const BADGES = [
  { threshold: 20, en: "Ambassador", pl: "Ambasadorka" },
  { threshold: 40, en: "Guardian", pl: "Strażniczka" },
  { threshold: 60, en: "Guide", pl: "Przewodniczka" },
  { threshold: 80, en: "Mirror Bearer", pl: "Lustrzana" },
  { threshold: 100, en: "The Owl", pl: "Sowa" },
];

export default function ReferralPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const pl = language === "pl";
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [journalCount, setJournalCount] = useState(0);
  const [rewards, setRewards] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => { loadReferralData(); }, []);

  const loadReferralData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

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

    const { data: rews } = await supabase.from("referral_rewards").select("reward_type").eq("user_id", user.id);
    setRewards((rews || []).map((r) => r.reward_type));

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
  const cycleNumber = Math.floor(completedCount / 20);
  const cycleCount = completedCount % 20;
  const isFirstCycle = cycleNumber === 0;
  const currentRewards = isFirstCycle ? CYCLE_1_REWARDS : CYCLE_2_REWARDS;
  const currentBadge = [...BADGES].reverse().find(b => completedCount >= b.threshold);

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
          <button onClick={() => router.push("/profile")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
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

        {/* Badge */}
        {currentBadge && (
          <div className="text-center py-3 rounded-2xl" style={{ background: "linear-gradient(135deg, var(--color-plum), var(--color-mauve))" }}>
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--color-cream)", fontWeight: 600 }}>
              {pl ? currentBadge.pl : currentBadge.en}
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
            {!isFirstCycle && (
              <span style={{ opacity: 0.6 }}> ({pl ? `cykl ${cycleNumber + 1}` : `cycle ${cycleNumber + 1}`})</span>
            )}
          </p>

          {currentRewards.map((r) => {
            const earned = isFirstCycle ? completedCount >= r.threshold : cycleCount >= r.threshold;
            const isGenerable = ["personal_letter", "deep_reading", "shadow_mirror"].includes(r.type);
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
                  {earned && isGenerable ? (
                    <button
                      onClick={() => router.push(`/referral/reward?type=${r.type}`)}
                      className="text-xs px-3 py-1.5 rounded-full transition-all"
                      style={{ background: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 500 }}
                    >
                      {pl ? "Otwórz" : "Open"}
                    </button>
                  ) : earned && r.type === "exclusive_theme" ? (
                    <button
                      onClick={() => router.push("/referral/themes")}
                      className="text-xs px-3 py-1.5 rounded-full transition-all"
                      style={{ background: "var(--color-gold)", color: "var(--color-dark)", fontWeight: 500 }}
                    >
                      {pl ? "Wybierz" : "Choose"}
                    </button>
                  ) : earned ? (
                    <span className="text-xs px-3 py-1 rounded-full" style={{ background: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 500 }}>
                      {pl ? "Odblokowane" : "Unlocked"}
                    </span>
                  ) : (
                    <span className="text-base" style={{ color: "var(--color-plum)", fontWeight: 600 }}>
                      {isFirstCycle ? completedCount : cycleCount}/{r.threshold}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {/* All badges progress */}
        {completedCount >= 20 && (
          <section className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-center" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
              {pl ? "Odznaki" : "Badges"}
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              {BADGES.map((b) => {
                const earned = completedCount >= b.threshold;
                return (
                  <div key={b.threshold} className="text-center px-3 py-2 rounded-xl" style={{ background: earned ? "var(--color-plum)" : "var(--color-blush)", opacity: earned ? 1 : 0.4 }}>
                    <p className="text-xs" style={{ color: earned ? "var(--color-cream)" : "var(--color-mauve)", fontWeight: 500 }}>
                      {pl ? b.pl : b.en}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: earned ? "var(--color-cream)" : "var(--color-mauve)", opacity: 0.6 }}>
                      {b.threshold}
                    </p>
                  </div>
                );
              })}
            </div>
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