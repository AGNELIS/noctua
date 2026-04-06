"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n";
import { THEME_MAP, applyTheme } from "@/lib/themes";
import { getMoonPhase, getDailyInsight, getSeasonalShadowPrompt, getSeason, type Season } from "@/lib/moon";
import { useTheme } from "@/context/ThemeContext";

type UserRow = {
  id: string;
  email: string;
  is_premium: boolean;
  is_admin: boolean;
  display_name: string | null;
};

export default function OwlPanelPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { switchTheme, activeThemeId, resetTheme } = useTheme();
  const [seasonPreview, setSeasonPreview] = useState<Season | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState("");

  // Stats
  const [dreamAnalysesUsed, setDreamAnalysesUsed] = useState(0);
  const [dreamAnalysesLimit] = useState(5);
  const [weeklyInsight, setWeeklyInsight] = useState<string | null>(null);
  const [journalCount, setJournalCount] = useState(0);
  const [dreamCount, setDreamCount] = useState(0);
  const [shadowCount, setShadowCount] = useState(0);

  // Referrals
  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);

  // Purchases
  const [purchases, setPurchases] = useState<any[]>([]);

  // Toggles
  const [premiumStatus, setPremiumStatus] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => { load(); }, []);

  const showMsg = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(""), 2500);
  };

  const load = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setMyId(user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, is_premium, referral_code")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) { router.push("/dashboard"); return; }
    setIsAdmin(true);
    setPremiumStatus(profile.is_premium || false);
    setReferralCode(profile.referral_code || "");

    // Dream analyses this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { count: analysisCount } = await supabase
      .from("dream_analyses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth);
    setDreamAnalysesUsed(analysisCount || 0);

    // Entry counts
    const { count: jc } = await supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    const { count: dc } = await supabase.from("dream_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    const { count: sc } = await supabase.from("shadow_work_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    setJournalCount(jc || 0);
    setDreamCount(dc || 0);
    setShadowCount(sc || 0);

    // Referrals
    const { data: refs } = await supabase
      .from("referrals")
      .select("id, status, created_at, completed_at, referred_id")
      .eq("referrer_id", user.id);
    setReferrals(refs || []);

    const { data: rews } = await supabase
      .from("referral_rewards")
      .select("id, reward_type, claimed, created_at")
      .eq("user_id", user.id);
    setRewards(rews || []);

    // Purchases
    const { data: purch } = await supabase
      .from("user_purchases")
      .select("id, product_id, purchased_at, used_at, shop_products(name, category)")
      .eq("user_id", user.id)
      .order("purchased_at", { ascending: false });
    setPurchases(purch || []);

    // Weekly insight
    const { data: insight } = await supabase
      .from("weekly_insights")
      .select("insight_text, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    setWeeklyInsight(insight?.insight_text || null);

    setLoading(false);
  };

  const togglePremium = async () => {
    const supabase = createClient();
    const newVal = !premiumStatus;
    await supabase.from("profiles").update({ is_premium: newVal }).eq("id", myId);
    setPremiumStatus(newVal);
    showMsg(newVal ? "Premium ON" : "Premium OFF");
  };

  const resetDreamAnalyses = async () => {
    const supabase = createClient();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    await supabase
      .from("dream_analyses")
      .delete()
      .eq("user_id", myId)
      .gte("created_at", startOfMonth);
    setDreamAnalysesUsed(0);
    showMsg("Dream analyses reset");
  };

  const unlockAllThemes = async () => {
    const supabase = createClient();
    const { data: themes } = await supabase
      .from("shop_products")
      .select("id")
      .eq("category", "theme");
    if (!themes) return;
    for (const theme of themes) {
      const { data: exists } = await supabase
        .from("user_purchases")
        .select("id")
        .eq("user_id", myId)
        .eq("product_id", theme.id)
        .limit(1);
      if (!exists || exists.length === 0) {
        await supabase.from("user_purchases").insert({ user_id: myId, product_id: theme.id });
      }
    }
    showMsg("All themes unlocked");
    load();
  };

  const unlockAllProducts = async () => {
    const supabase = createClient();
    const { data: products } = await supabase
      .from("shop_products")
      .select("id")
      .eq("is_active", true);
    if (!products) return;
    for (const prod of products) {
      const { data: exists } = await supabase
        .from("user_purchases")
        .select("id")
        .eq("user_id", myId)
        .eq("product_id", prod.id)
        .limit(1);
      if (!exists || exists.length === 0) {
        await supabase.from("user_purchases").insert({ user_id: myId, product_id: prod.id });
      }
    }
    showMsg("All products unlocked");
    load();
  };

  const simulateReferrals = async (count: number) => {
    const supabase = createClient();
    for (let i = 0; i < count; i++) {
      await supabase.from("referrals").insert({
        referrer_id: myId,
        referred_id: myId,
        status: "completed",
        completed_at: new Date().toISOString(),
      });
    }
    showMsg(`+${count} referrals added`);
    load();
  };

  const clearTestReferrals = async () => {
    const supabase = createClient();
    await supabase
      .from("referrals")
      .delete()
      .eq("referrer_id", myId)
      .eq("referred_id", myId);
    showMsg("Test referrals cleared");
    load();
  };

  const generateWeeklyInsight = async () => {
    showMsg("Generating...");
    try {
      const res = await fetch("/api/weekly-insight");
      if (res.ok) {
        const data = await res.json();
        setWeeklyInsight(data.insight);
        showMsg("Weekly insight generated");
      } else {
        showMsg("Failed");
      }
    } catch {
      showMsg("Error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-gradient)" }}>
        <p style={{ color: "var(--color-dusty-rose)" }}>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  const sectionStyle = {
    background: "var(--color-blush)",
    border: "1px solid var(--color-dusty-rose)",
    borderRadius: "16px",
    padding: "16px",
  };
  const labelStyle = { fontSize: "10px", color: "var(--color-mauve)", textTransform: "uppercase" as const, letterSpacing: "0.15em", fontWeight: 600 };
  const valueStyle = { fontSize: "14px", color: "var(--color-dark)", marginTop: "2px" };
  const btnStyle = {
    padding: "8px 16px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: 600,
    background: "var(--color-plum)",
    color: "var(--color-cream)",
    border: "none",
    cursor: "pointer",
  };
  const btnOutline = {
    ...btnStyle,
    background: "transparent",
    border: "1px solid var(--color-dusty-rose)",
    color: "var(--color-mauve)",
  };

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
      <header className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/profile")} className="text-sm" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>← Back</button>
          <div className="w-12" />
        </div>
        <h1 className="text-lg tracking-[0.25em] uppercase text-center mt-3" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>
          Owl Panel
        </h1>
        {actionMsg && (
          <p className="text-center text-xs mt-2 py-1 rounded-lg" style={{ background: "var(--color-plum)", color: "var(--color-cream)" }}>{actionMsg}</p>
        )}
      </header>

      <main className="max-w-xl mx-auto px-6 pb-16 space-y-5">

        {/* Premium toggle */}
        <div style={sectionStyle}>
          <div className="flex items-center justify-between">
            <div>
              <p style={labelStyle}>Premium Status</p>
              <p style={{ ...valueStyle, color: premiumStatus ? "var(--color-plum)" : "var(--color-dusty-rose)", fontWeight: 600 }}>
                {premiumStatus ? "ACTIVE" : "INACTIVE"}
              </p>
            </div>
            <button onClick={togglePremium} style={premiumStatus ? btnOutline : btnStyle}>
              {premiumStatus ? "Turn OFF" : "Turn ON"}
            </button>
          </div>
        </div>

        {/* Dream analyses */}
        <div style={sectionStyle}>
          <p style={labelStyle}>Dream Analyses This Month</p>
          <div className="flex items-center justify-between mt-2">
            <p style={valueStyle}>{dreamAnalysesUsed} / {dreamAnalysesLimit}</p>
            <button onClick={resetDreamAnalyses} style={btnOutline}>Reset</button>
          </div>
        </div>

        {/* Entry counts */}
        <div style={sectionStyle}>
          <p style={labelStyle}>My Entries</p>
          <div className="grid grid-cols-3 gap-3 mt-2">
            <div className="text-center">
              <p style={{ fontSize: "22px", color: "var(--color-plum)", fontWeight: 600 }}>{journalCount}</p>
              <p style={{ fontSize: "10px", color: "var(--color-mauve)" }}>Journal</p>
            </div>
            <div className="text-center">
              <p style={{ fontSize: "22px", color: "var(--color-plum)", fontWeight: 600 }}>{dreamCount}</p>
              <p style={{ fontSize: "10px", color: "var(--color-mauve)" }}>Dreams</p>
            </div>
            <div className="text-center">
              <p style={{ fontSize: "22px", color: "var(--color-plum)", fontWeight: 600 }}>{shadowCount}</p>
              <p style={{ fontSize: "10px", color: "var(--color-mauve)" }}>Shadow</p>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div style={sectionStyle}>
          <p style={labelStyle}>Quick Actions</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <button onClick={unlockAllThemes} style={btnStyle}>Unlock all themes</button>
            <button onClick={unlockAllProducts} style={btnStyle}>Unlock all products</button>
            <button onClick={generateWeeklyInsight} style={btnOutline}>Generate weekly insight</button>
          </div>
        </div>

        {/* Referrals */}
        <div style={sectionStyle}>
          <p style={labelStyle}>Referrals</p>
          <p style={{ ...valueStyle, marginTop: "4px" }}>Code: <span style={{ fontWeight: 600 }}>{referralCode || "none"}</span></p>
          <p style={{ ...valueStyle }}>Total: {referrals.length} — Completed: {referrals.filter(r => r.status === "completed").length}</p>

          <p style={{ ...labelStyle, marginTop: "12px" }}>Rewards</p>
          {rewards.length === 0 ? (
            <p style={{ ...valueStyle, opacity: 0.5 }}>No rewards yet</p>
          ) : (
            rewards.map(r => (
              <p key={r.id} style={valueStyle}>{r.reward_type} — {r.claimed ? "Claimed" : "Unclaimed"}</p>
            ))
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            <button onClick={() => simulateReferrals(3)} style={btnOutline}>+3 referrals (free analysis)</button>
            <button onClick={() => simulateReferrals(7)} style={btnOutline}>+7 more (=10, monthly report)</button>
            <button onClick={() => simulateReferrals(10)} style={btnOutline}>+10 more (=20, 30% discount)</button>
            <button onClick={clearTestReferrals} style={{ ...btnOutline, color: "var(--color-dusty-rose)" }}>Clear test referrals</button>
          </div>
        </div>

        {/* Purchases */}
        <div style={sectionStyle}>
          <p style={labelStyle}>My Purchases ({purchases.length})</p>
          {purchases.length === 0 ? (
            <p style={{ ...valueStyle, opacity: 0.5 }}>No purchases</p>
          ) : (
            <div className="space-y-2 mt-2">
              {purchases.map(p => (
                <div key={p.id} className="flex justify-between items-center">
                  <p style={{ fontSize: "13px", color: "var(--color-dark)" }}>{(p.shop_products as any)?.name || p.product_id}</p>
                  <p style={{ fontSize: "10px", color: p.used_at ? "var(--color-dusty-rose)" : "var(--color-plum)" }}>
                    {p.used_at ? "Used" : "Active"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly Insight */}
        <div style={sectionStyle}>
          <p style={labelStyle}>Latest Weekly Insight</p>
          {weeklyInsight ? (
            <p style={{ ...valueStyle, lineHeight: "1.6", marginTop: "8px" }}>{weeklyInsight}</p>
          ) : (
            <p style={{ ...valueStyle, opacity: 0.5 }}>None generated yet</p>
          )}
        </div>

        {/* Theme Preview + Activate */}
        <div style={sectionStyle}>
          <p style={labelStyle}>Themes — Preview & Activate</p>
          <div className="space-y-2 mt-3">
            <button onClick={async () => { await resetTheme(); showMsg("Reset to default"); }}
              className="w-full flex items-center justify-between py-2 px-3 rounded-xl transition-all"
              style={{ background: !activeThemeId ? "var(--color-plum)" : "transparent", color: !activeThemeId ? "var(--color-cream)" : "var(--color-dark)", border: "1px solid var(--color-dusty-rose)" }}>
              <span style={{ fontSize: "13px" }}>Default Noctua</span>
              {!activeThemeId && <span style={{ fontSize: "10px" }}>● Active</span>}
            </button>
            {Object.entries(THEME_MAP).map(([name, colors]) => (
              <button key={name} onClick={async () => {
                const supabase = createClient();
                const { data: prod } = await supabase.from("shop_products").select("id").eq("name", name).single();
                if (prod) {
                  await switchTheme(prod.id, name);
                  showMsg(`Theme: ${name}`);
                }
              }}
                className="w-full flex items-center justify-between py-2 px-3 rounded-xl transition-all"
                style={{ background: activeThemeId && activeThemeId === name ? "var(--color-plum)" : "transparent", color: "var(--color-dark)", border: "1px solid var(--color-dusty-rose)" }}>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[colors.plum, colors.mauve, colors["dusty-rose"], colors.gold].map((c, i) => (
                      <div key={i} style={{ width: "14px", height: "14px", borderRadius: "50%", background: c, border: "1px solid rgba(0,0,0,0.1)" }} />
                    ))}
                  </div>
                  <span style={{ fontSize: "13px" }}>{name}</span>
                </div>
                <span style={{ fontSize: "10px", color: "var(--color-mauve)" }}>
                  {purchases.some(p => (p.shop_products as any)?.name === name) ? "Owned" : "Not owned"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Seasonal Shadow Work Preview */}
        <div style={sectionStyle}>
          <p style={labelStyle}>Seasonal Shadow Work Preview</p>
          <p style={{ ...valueStyle, marginTop: "4px" }}>Current season: <span style={{ fontWeight: 600 }}>{getSeason()}</span> — Moon: <span style={{ fontWeight: 600 }}>{getMoonPhase().phase}</span></p>
          <div className="flex gap-2 mt-3 flex-wrap">
            {(["spring", "summer", "autumn", "winter"] as Season[]).map(s => (
              <button key={s} onClick={() => setSeasonPreview(seasonPreview === s ? null : s)}
                className="px-3 py-1.5 rounded-full text-xs transition-all"
                style={{
                  background: seasonPreview === s ? "var(--color-plum)" : "transparent",
                  color: seasonPreview === s ? "var(--color-cream)" : "var(--color-mauve)",
                  border: `1px solid ${seasonPreview === s ? "var(--color-plum)" : "var(--color-dusty-rose)"}`,
                  fontWeight: seasonPreview === s ? 600 : 400,
                }}>
                {s === "spring" ? "🌱 Spring" : s === "summer" ? "☀️ Summer" : s === "autumn" ? "🍂 Autumn" : "❄️ Winter"}
              </button>
            ))}
          </div>
          {seasonPreview && (
            <div className="mt-3 space-y-3">
              {["New Moon", "Full Moon", "First Quarter", "Waning Crescent"].map(phase => {
                const fakeDate = seasonPreview === "spring" ? new Date(2026, 3, 1) : seasonPreview === "summer" ? new Date(2026, 6, 1) : seasonPreview === "autumn" ? new Date(2026, 9, 1) : new Date(2026, 0, 1);
                return (
                  <div key={phase} className="rounded-xl p-3" style={{ background: "var(--color-cream)", border: "1px solid color-mix(in srgb, var(--color-dusty-rose) 30%, transparent)" }}>
                    <p style={{ fontSize: "10px", color: "var(--color-mauve)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>{phase}</p>
                    <p style={{ fontSize: "13px", color: "var(--color-dark)", marginTop: "4px", lineHeight: "1.5", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                      EN: {getSeasonalShadowPrompt(phase, "en", fakeDate)}
                    </p>
                    <p style={{ fontSize: "13px", color: "var(--color-dark)", marginTop: "4px", lineHeight: "1.5", fontFamily: "'Cormorant Garamond', Georgia, serif", opacity: 0.7 }}>
                      PL: {getSeasonalShadowPrompt(phase, "pl", fakeDate)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Nav — Test Features */}
        <div style={sectionStyle}>
          <p style={labelStyle}>Test Features</p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {[
              { label: "Journal", href: "/journal" },
              { label: "Dreams", href: "/dreams" },
              { label: "Shadow Work", href: "/shadow-work" },
              { label: "Symbols", href: "/symbols" },
              { label: "Cycle Tracker", href: "/cycle" },
              { label: "Grounding", href: "/grounding" },
              { label: "Reading", href: "/reports" },
              { label: "Shop", href: "/shop" },
              { label: "Premium Page", href: "/premium" },
              { label: "Referral", href: "/referral" },
              { label: "Letter", href: "/letter" },
              { label: "Profile", href: "/profile" },
            ].map(item => (
              <button key={item.href} onClick={() => router.push(item.href)}
                className="py-2.5 rounded-xl text-xs tracking-wide transition-all hover:opacity-80"
                style={{ background: "var(--color-cream)", color: "var(--color-dark)", border: "1px solid var(--color-dusty-rose)", fontWeight: 500 }}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Referral Reward Tiers Info */}
        <div style={sectionStyle}>
          <p style={labelStyle}>Referral Reward Tiers</p>
          <div className="space-y-2 mt-2">
            {[
              { tier: 3, reward: "Free dream analysis", icon: "🌙" },
              { tier: 10, reward: "Free monthly report", icon: "📊" },
              { tier: 20, reward: "30% discount code", icon: "💎" },
            ].map(t => {
              const completed = referrals.filter(r => r.status === "completed").length;
              const unlocked = completed >= t.tier;
              const claimed = rewards.some(r => r.reward_type === t.reward && r.claimed);
              return (
                <div key={t.tier} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span>{t.icon}</span>
                    <div>
                      <p style={{ fontSize: "13px", color: unlocked ? "var(--color-plum)" : "var(--color-mauve)", fontWeight: unlocked ? 600 : 400 }}>
                        {t.tier} referrals — {t.reward}
                      </p>
                      <p style={{ fontSize: "10px", color: "var(--color-dusty-rose)" }}>
                        {completed}/{t.tier} {claimed ? "· Claimed" : unlocked ? "· Ready to claim" : ""}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}