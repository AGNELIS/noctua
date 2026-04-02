"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n";

const REWARDS = [
  { threshold: 3, type: "dream_analysis", en: "1 free AI dream analysis", pl: "1 darmowa analiza snu AI" },
  { threshold: 10, type: "monthly_report", en: "1 free monthly report", pl: "1 darmowy raport miesięczny" },
  { threshold: 20, type: "subscription_discount", en: "30% off subscription", pl: "30% zniżki na subskrypcję" },
];

export default function ReferralPage() {
  const router = useRouter();
  const { language } = useLanguage();
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-gradient)" }}>
        <p className="text-sm" style={{ color: "var(--color-dusty-rose)" }}>{language === "pl" ? "Ładowanie..." : "Loading..."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
      <header className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/profile")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
            {language === "pl" ? "← Wróć" : "← Back"}
          </button>
          <div className="w-12" />
        </div>
        <h1 className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
          {language === "pl" ? "Zaproś i odblokuj" : "Invite & Unlock"}
        </h1>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-16 space-y-8 pt-4">

        <p className="text-center leading-relaxed" style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.05rem" }}>
          {language === "pl"
            ? "Zaproś osoby, którym zależy na pracy wewnętrznej. Za każde zaproszenie, które się spełni, manifestujesz nagrody."
            : "Invite people who care about inner work. For every invitation that completes, you unlock rewards."}
        </p>

        {!canRefer ? (
          <section className="rounded-2xl border p-6 text-center space-y-3" style={{ background: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
            <p className="text-base" style={{ color: "var(--color-dark)", fontWeight: 500 }}>
              {language === "pl"
                ? `Potrzebujesz min. 3 wpisy w dzienniku żeby zapraszać. Masz: ${journalCount}/3`
                : `You need at least 3 journal entries to start inviting. You have: ${journalCount}/3`}
            </p>
           
          </section>
        ) : (
          <section className="rounded-2xl border p-6 text-center space-y-4" style={{ background: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
              {language === "pl" ? "Twój link zaproszenia" : "Your invitation link"}
            </p>
            <div className="flex items-center justify-center gap-2">
              <code className="text-sm px-3 py-2 rounded-lg" style={{ background: "var(--color-cream)", color: "var(--color-plum)", fontWeight: 600 }}>
                {referralCode}
              </code>
              <button onClick={copyLink} className="px-4 py-2 rounded-lg text-sm" style={{ background: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 500 }}>
                {copied ? (language === "pl" ? "Skopiowano!" : "Copied!") : (language === "pl" ? "Kopiuj link" : "Copy link")}
              </button>
            </div>
            <p className="text-xs" style={{ color: "var(--color-mauve)" }}>
              {language === "pl"
                ? "Zaproszona osoba musi założyć konto i zrobić min. 3 wpisy żeby zaproszenie się zaliczyło."
                : "The invited person must create an account and make at least 3 entries for the invitation to count."}
            </p>
          </section>
        )}

        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
          <span className="text-xs" style={{ color: "var(--color-gold)", opacity: 0.6 }}>◇</span>
          <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
        </div>

        <section className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-center" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
            {language === "pl" ? "Nagrody" : "Rewards"}
          </p>
          {REWARDS.map((r) => {
            const earned = completedCount >= r.threshold;
            const claimed = rewards.includes(r.type);
            return (
              <div key={r.type} className="flex items-center justify-between p-4 rounded-2xl border transition-all" style={{ background: "var(--color-blush)", borderColor: earned ? "var(--color-mauve)" : "var(--color-dusty-rose)", opacity: earned ? 1 : 0.6 }}>
                <div className="flex-1">
                  <p className="text-sm" style={{ color: "var(--color-dark)", fontWeight: 500 }}>
                    {language === "pl" ? r.pl : r.en}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--color-mauve)" }}>
                    {language === "pl" ? `${r.threshold} zaproszeń` : `${r.threshold} invitations`}
                  </p>
                </div>
                <div className="shrink-0 ml-3">
                  {claimed ? (
                    <span className="text-xs" style={{ color: "var(--color-mauve)" }}>{language === "pl" ? "Wykorzystane" : "Used"}</span>
                  ) : earned ? (
                    <span className="text-xs px-3 py-1 rounded-full" style={{ background: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 500 }}>{language === "pl" ? "Odblokowane!" : "Unlocked!"}</span>
                  ) : (
                    <span className="text-xs" style={{ color: "var(--color-dusty-rose)" }}>{completedCount}/{r.threshold}</span>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        <section className="text-center pt-2">
          <p className="text-2xl" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 700 }}>
            {completedCount}
          </p>
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--color-mauve)" }}>
            {language === "pl" ? "zaliczonych zaproszeń" : "completed invitations"}
          </p>
        </section>

      </main>
    </div>
  );
}