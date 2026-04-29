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
  const [snapshots, setSnapshots] = useState<Array<{ id: string; snapshot_number: number; content: string; entry_count_in_period: number; cumulative_entry_count: number; key_patterns: unknown; created_at: string }>>([]);
  const [snapshotGenerating, setSnapshotGenerating] = useState(false);
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
  const [testMode, setTestMode] = useState<"admin" | "premium" | "free">("admin");
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => { load(); loadSnapshots(); }, []);

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
      .select("is_admin, is_premium, referral_code, admin_test_mode")
      .eq("id", user.id)
      .single();
    if (!profile?.is_admin) { router.push("/dashboard"); return; }
    setIsAdmin(true);
    setReferralCode(profile.referral_code || "");
    const savedMode = profile.admin_test_mode;
    if (savedMode === "free" || savedMode === "premium" || savedMode === "admin") {
      setTestMode(savedMode);
    }

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
      .select("id, reward_type, is_used, created_at")
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

  const changeTestMode = async (mode: "admin" | "premium" | "free") => {
    const supabase = createClient();
    await supabase.from("profiles").update({ admin_test_mode: mode }).eq("id", myId);
    setTestMode(mode);
    showMsg(`Test mode: ${mode}`);
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
      const { error } = await supabase.from("referrals").insert({
        referrer_id: myId,
        referred_id: null,
        referral_code: crypto.randomUUID().substring(0, 8).toUpperCase(),
        status: "completed",
        completed_at: new Date().toISOString(),
      });
      if (error) { showMsg(`Error: ${error.message}`); return; }
    }
    try { await fetch("/api/check-referral-rewards", { method: "POST" }); } catch {}
    showMsg(`+${count} referrals added`);
    load();
  };

  const clearTestReferrals = async () => {
    const supabase = createClient();
    await supabase
      .from("referrals")
      .delete()
      .eq("referrer_id", myId);
    await supabase
      .from("referral_rewards")
      .delete()
      .eq("user_id", myId);
    showMsg("All referrals + rewards cleared");
    load();
  };

  const loadSnapshots = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("ai_memory_snapshots")
      .select("id, snapshot_number, content, entry_count_in_period, cumulative_entry_count, key_patterns, created_at")
      .eq("user_id", user.id)
      .order("snapshot_number", { ascending: false });
    setSnapshots(data || []);
  };

  const generateSnapshot = async () => {
    setSnapshotGenerating(true);
    showMsg("Generating snapshot...");
    try {
      const res = await fetch("/api/create-snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        showMsg(`Snapshot #${data.snapshot?.snapshot_number} created`);
        await loadSnapshots();
      } else {
        showMsg(`Failed: ${data.message || data.error || "unknown"}`);
      }
    } catch (e) {
      showMsg("Error generating snapshot");
      console.error(e);
    }
    setSnapshotGenerating(false);
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
        {/* Test mode toggle (admin only) */}
        <div style={{ ...sectionStyle, background: "var(--color-blush)", borderColor: "var(--color-plum)" }}>
          <p style={labelStyle}>Test Mode</p>
          <p className="text-xs mt-1 mb-3" style={{ color: "var(--color-mauve)", opacity: 0.8 }}>
            View the app as a different user type. Saves to your profile.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => changeTestMode("admin")}
              className="flex-1 py-2 rounded-xl text-xs tracking-widest uppercase transition-all"
              style={{
                background: testMode === "admin" ? "var(--color-plum)" : "transparent",
                color: testMode === "admin" ? "var(--color-cream)" : "var(--color-mauve)",
                border: `1px solid ${testMode === "admin" ? "var(--color-plum)" : "var(--color-dusty-rose)"}`,
                fontWeight: testMode === "admin" ? 600 : 500,
              }}
            >
              Admin
            </button>
            <button
              onClick={() => changeTestMode("premium")}
              className="flex-1 py-2 rounded-xl text-xs tracking-widest uppercase transition-all"
              style={{
                background: testMode === "premium" ? "var(--color-plum)" : "transparent",
                color: testMode === "premium" ? "var(--color-cream)" : "var(--color-mauve)",
                border: `1px solid ${testMode === "premium" ? "var(--color-plum)" : "var(--color-dusty-rose)"}`,
                fontWeight: testMode === "premium" ? 600 : 500,
              }}
            >
              Premium
            </button>
            <button
              onClick={() => changeTestMode("free")}
              className="flex-1 py-2 rounded-xl text-xs tracking-widest uppercase transition-all"
              style={{
                background: testMode === "free" ? "var(--color-plum)" : "transparent",
                color: testMode === "free" ? "var(--color-cream)" : "var(--color-mauve)",
                border: `1px solid ${testMode === "free" ? "var(--color-plum)" : "var(--color-dusty-rose)"}`,
                fontWeight: testMode === "free" ? 600 : 500,
              }}
            >
              Free
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

        {/* Purchases */}
        <div style={sectionStyle}>
          <p style={labelStyle}>My Purchases ({purchases.length})</p>
          <div className="flex gap-2 mt-2 mb-3">
            <button onClick={unlockAllThemes} style={{ ...btnStyle, flex: 1, fontSize: "10px", padding: "6px" }}>Unlock all themes</button>
            <button onClick={unlockAllProducts} style={{ ...btnStyle, flex: 1, fontSize: "10px", padding: "6px" }}>Unlock all products</button>
          </div>
          {purchases.length === 0 ? (
            <p style={{ ...valueStyle, opacity: 0.5 }}>No purchases</p>
          ) : (
            <div className="space-y-2 mt-2">
              {purchases.map(p => (
                <div key={p.id} className="flex justify-between items-center py-1">
                  <div>
                    <p style={{ fontSize: "13px", color: "var(--color-dark)" }}>{(p.shop_products as any)?.name || p.product_id}</p>
                    <p style={{ fontSize: "10px", color: "var(--color-dusty-rose)" }}>{(p.shop_products as any)?.category} · {p.used_at ? "Used" : "Active"}</p>
                  </div>
                  <button onClick={async () => {
                    const supabase = createClient();
                    await supabase.from("user_purchases").delete().eq("id", p.id);
                    showMsg(`Removed: ${(p.shop_products as any)?.name}`);
                    load();
                  }} style={{ ...btnOutline, padding: "4px 10px", fontSize: "10px", color: "var(--color-dusty-rose)" }}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reflection */}
        <div style={sectionStyle}>
          <p style={labelStyle}>Latest Reflection</p>
          {weeklyInsight ? (
            <p style={{ ...valueStyle, lineHeight: "1.6", marginTop: "8px", textAlign: "justify" }}>{weeklyInsight}</p>
          ) : (
            <p style={{ ...valueStyle, opacity: 0.5 }}>None generated yet</p>
          )}
          <button onClick={generateWeeklyInsight} style={{ ...btnOutline, marginTop: "8px", width: "100%" }}>Generate weekly insight</button>
        </div>
        {/* Memory Snapshots */}
        <div style={sectionStyle}>
          <p style={labelStyle}>Memory Snapshots</p>
          <p style={{ ...valueStyle, opacity: 0.6, fontSize: "11px", marginTop: "4px" }}>
            Cumulative memory layers Noctua uses for continuity across readings.
          </p>
          <button
            onClick={generateSnapshot}
            disabled={snapshotGenerating}
            style={{ ...btnStyle, marginTop: "8px", width: "100%", opacity: snapshotGenerating ? 0.5 : 1 }}
          >
            {snapshotGenerating ? "Generating..." : `Generate snapshot #${(snapshots[0]?.snapshot_number || 0) + 1}`}
          </button>
          {snapshots.length > 0 && (
            <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {snapshots.map(s => (
                <details key={s.id} style={{ background: "var(--color-blush)", border: "1px solid var(--color-dusty-rose)", borderRadius: "12px", padding: "10px" }}>
                  <summary style={{ cursor: "pointer", fontWeight: 600, color: "var(--color-plum)" }}>
                    Snapshot #{s.snapshot_number} — {s.entry_count_in_period} entries in period, {s.cumulative_entry_count} cumulative
                  </summary>
                  <p style={{ fontSize: "10px", color: "var(--color-mauve)", marginTop: "4px" }}>
                    {new Date(s.created_at).toLocaleString(language === "pl" ? "pl-PL" : "en-GB")}
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--color-dark)", marginTop: "8px", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>
                    {s.content}
                  </p>
                  {Array.isArray(s.key_patterns) && s.key_patterns.length > 0 && (
                    <div style={{ marginTop: "8px", padding: "8px", background: "var(--color-cream)", borderRadius: "8px" }}>
                      <p style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-plum)", marginBottom: "4px" }}>Key patterns:</p>
                      <pre style={{ fontSize: "10px", color: "var(--color-dark)", overflow: "auto", whiteSpace: "pre-wrap" }}>
                        {JSON.stringify(s.key_patterns, null, 2)}
                      </pre>
                    </div>
                  )}
                </details>
              ))}
            </div>
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
            {Object.entries(THEME_MAP).map(([name, colors]) => {
              const owned = purchases.some(p => (p.shop_products as any)?.name === name);
              return (
                <div key={name} className="flex items-center gap-2">
                  <button onClick={async () => {
                    const supabase = createClient();
                    const { data: prod } = await supabase.from("shop_products").select("id").eq("name", name).single();
                    if (prod) {
                      await switchTheme(prod.id, name);
                    } else {
                      applyTheme(name);
                    }
                    showMsg(`Preview: ${name}`);
                  }}
                    className="flex-1 flex items-center justify-between py-2 px-3 rounded-xl transition-all"
                    style={{ background: "transparent", color: "var(--color-dark)", border: "1px solid var(--color-dusty-rose)" }}>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {[colors.plum, colors.mauve, colors["dusty-rose"], colors.gold, colors.cream].map((c, i) => (
                          <div key={i} style={{ width: "14px", height: "14px", borderRadius: "50%", background: c, border: "1px solid rgba(0,0,0,0.1)" }} />
                        ))}
                      </div>
                      <span style={{ fontSize: "13px" }}>{name}</span>
                    </div>
                    <span style={{ fontSize: "10px", color: owned ? "var(--color-plum)" : "var(--color-dusty-rose)" }}>
                      {owned ? "Owned" : "Preview"}
                    </span>
                  </button>
                  {!owned && (
                    <button onClick={async () => {
                      const supabase = createClient();
                      const { data: prod } = await supabase.from("shop_products").select("id").eq("name", name).single();
                      if (prod) {
                        await supabase.from("user_purchases").insert({ user_id: myId, product_id: prod.id });
                        showMsg(`Unlocked: ${name}`);
                        load();
                      }
                    }} style={{ ...btnOutline, padding: "6px 10px", fontSize: "10px", whiteSpace: "nowrap" as const }}>
                      Unlock
                    </button>
                  )}
                </div>
              );
            })}
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

        {/* Test Referral Rewards */}
        <div style={sectionStyle}>
          <p style={labelStyle}>Test Referral Rewards</p>
          <p style={{ ...valueStyle, marginTop: "4px", opacity: 0.6 }}>Simulate referral milestones and test what unlocks at each tier.</p>
          <div className="space-y-3 mt-3">
            {[
              { tier: 3, reward: "dream_analysis_1", label: "3 referrals — Free dream reading", desc: "1 free dream reading" },
              { tier: 5, reward: "theme_moonstone", label: "5 referrals — Moonstone theme", desc: "Exclusive animated theme (not in shop)" },
              { tier: 10, reward: "workbook_discount_30", label: "10 referrals — 30% off workbook + 2 readings", desc: "30% off any workbook + 2 dream readings" },
              { tier: 15, reward: "theme_velvet_night", label: "15 referrals — Velvet Night theme", desc: "Exclusive animated theme (not in shop)" },
              { tier: 20, reward: "premium_discount_30", label: "20 referrals — 30% off Premium + 3 readings", desc: "30% off Premium + 3 dream readings" },
              { tier: 30, reward: "theme_obsidian_rose", label: "30 referrals — Obsidian Rose + Ambassador", desc: "Exclusive theme + Ambassador status" },
              { tier: 50, reward: "unlimited_dreams", label: "50 referrals — Unlimited dream readings", desc: "Lifetime unlimited dream readings" },
            ].map(t => {
              const completed = referrals.filter(r => r.status === "completed").length;
              const unlocked = completed >= t.tier;
              const reward = rewards.find(r => r.reward_type === t.reward);
              return (
                <div key={t.tier} className="rounded-xl p-3" style={{ background: "var(--color-cream)", border: "1px solid color-mix(in srgb, var(--color-dusty-rose) 30%, transparent)" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p style={{ fontSize: "13px", color: unlocked ? "var(--color-plum)" : "var(--color-mauve)", fontWeight: 600 }}>{t.label}</p>
                      <p style={{ fontSize: "10px", color: "var(--color-dusty-rose)", marginTop: "2px" }}>{t.desc}</p>
                      <p style={{ fontSize: "10px", color: "var(--color-mauve)", marginTop: "2px" }}>
                        Status: {!unlocked ? `${completed}/${t.tier} referrals` : reward?.is_used ? "Claimed" : "Unlocked, not claimed"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {!unlocked && (
                        <button onClick={() => simulateReferrals(t.tier - completed)} style={{ ...btnOutline, padding: "4px 8px", fontSize: "10px" }}>
                          Simulate to {t.tier}
                        </button>
                      )}
                      {unlocked && !reward?.is_used && (
                        <button onClick={async () => {
                          const supabase = createClient();
                          if (reward) {
                            await supabase.from("referral_rewards").update({ is_used: true }).eq("id", reward.id);
                          } else {
                            await supabase.from("referral_rewards").insert({ user_id: myId, reward_type: t.reward, is_used: true });
                          }
                          showMsg(`Claimed: ${t.label}`);
                          load();
                        }} style={{ ...btnStyle, padding: "4px 8px", fontSize: "10px" }}>
                          Claim
                        </button>
                      )}
                      {reward?.is_used && (
                        <button onClick={async () => {
                          const supabase = createClient();
                          await supabase.from("referral_rewards").delete().eq("id", reward.id);
                          showMsg("Unclaimed");
                          load();
                        }} style={{ ...btnOutline, padding: "4px 8px", fontSize: "10px" }}>
                          Unclaim
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={clearTestReferrals} className="w-full mt-3 py-2 rounded-xl text-xs" style={{ border: "1px solid var(--color-dusty-rose)", color: "var(--color-dusty-rose)" }}>
            Clear all test referrals + rewards
          </button>
        </div>

        {/* Planetary Workbook Testing */}
        <div style={sectionStyle}>
          <p style={labelStyle}>Planetary Workbooks — Test & Reset</p>
          <div className="space-y-3 mt-3">
            {[
              { name: "Moon Workbook", path: "/workbooks/moon", planet: "moon", emoji: "🌙" },
              { name: "Saturn Workbook", path: "/workbooks/saturn", planet: "saturn", emoji: "🪐" },
              { name: "Pluto Workbook", path: "/workbooks/pluto", planet: "pluto", emoji: "💀" },
              { name: "Chiron Workbook", path: "/workbooks/chiron", planet: "chiron", emoji: "💫" },
              { name: "Lilith Workbook", path: "/workbooks/lilith", planet: "lilith", emoji: "🔥" },
              { name: "Lunar Nodes Workbook", path: "/workbooks/lunar-nodes", planet: "lunar-nodes", emoji: "☊" },
            ].map(wb => {
              const owned = purchases.some(p => (p.shop_products as any)?.name === wb.name);
              return (
                <div key={wb.planet} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ border: "1px solid var(--color-dusty-rose)" }}>
                  <div className="flex items-center gap-2">
                    <span>{wb.emoji}</span>
                    <div>
                      <p style={{ fontSize: "13px", color: "var(--color-dark)", fontWeight: 500 }}>{wb.name}</p>
                      <p style={{ fontSize: "10px", color: owned ? "var(--color-plum)" : "var(--color-dusty-rose)" }}>
                        {owned ? "Owned" : "Not purchased"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => router.push(wb.path)} style={{ ...btnOutline, padding: "4px 10px", fontSize: "10px" }}>
                      Open
                    </button>
                    <button onClick={async () => {
                      const supabase = createClient();
                      const { data: prod } = await supabase.from("shop_products").select("id").eq("name", wb.name).single();
                      if (prod) {
                        const alreadyOwned = purchases.some(p => p.product_id === prod.id);
                        if (!alreadyOwned) {
                          await supabase.from("user_purchases").insert({ user_id: myId, product_id: prod.id, stripe_session_id: "admin-test" });
                          showMsg(`Unlocked: ${wb.name}`);
                        } else {
                          await supabase.from("user_purchases").delete().eq("user_id", myId).eq("product_id", prod.id);
                          showMsg(`Removed: ${wb.name}`);
                        }
                        load();
                      }
                    }} style={{ ...btnOutline, padding: "4px 10px", fontSize: "10px", color: owned ? "var(--color-dusty-rose)" : "var(--color-plum)" }}>
                      {owned ? "Remove" : "Unlock"}
                    </button>
                    <button onClick={async () => {
                      const supabase = createClient();
                      await supabase.from("workbook_progress").delete().eq("user_id", myId).eq("workbook_type", wb.planet);
                      showMsg(`Reset progress: ${wb.name}`);
                    }} style={{ ...btnOutline, padding: "4px 10px", fontSize: "10px", color: "var(--color-dusty-rose)" }}>
                      Reset
                    </button>
                  </div>
                </div>
              );
            })}
            <button onClick={async () => {
              const supabase = createClient();
              await supabase.from("workbook_progress").delete().eq("user_id", myId);
              showMsg("All workbook progress reset");
            }} style={{ ...btnOutline, color: "var(--color-dusty-rose)", width: "100%", marginTop: "8px" }}>
              Reset ALL workbook progress
            </button>
          </div>
        </div>

        

      </main>
    </div>
  );
}