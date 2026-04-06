"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

type UserData = {
  id: string;
  email: string;
  displayName: string | null;
  isPremium: boolean;
  createdAt: string;
  lastSignIn: string | null;
  daysSinceCreation: number;
  stats: {
    journalCount: number;
    dreamCount: number;
    shadowCount: number;
    cycleCount: number;
    totalEntries: number;
    completedWorkbooks: number;
    analysisCount: number;
    reportCount: number;
    purchaseCount: number;
    referralCount: number;
    activeReferrals: number;
  };
  engagementScore: number;
};

type Stats = {
  users: { total: number; newToday: number; newThisWeek: number; activeThisWeek: number; premium: number };
  entries: { journal: number; journalToday: number; dreams: number; dreamsToday: number; shadow: number; cycle: number };
  ai: { analyses: number; reports: number; workbooks: number };
  commerce: { purchases: number; referrals: number; activeReferrals: number };
  activity: { type: string; user: string; at: string }[];
};

type Tab = "overview" | "users" | "activity";

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "#2d8a4e" : score >= 40 ? "#b8860b" : score >= 15 ? "#9B6B8D" : "#a0a0a0";
  const label = score >= 70 ? "Soul match" : score >= 40 ? "Growing" : score >= 15 ? "Exploring" : "New";
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: color + "20", color, fontWeight: 600 }}>
      {score} {label}
    </span>
  );
}

function TimeAgo({ date }: { date: string }) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 60) return <span>{mins}m ago</span>;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return <span>{hours}h ago</span>;
  return <span>{Math.floor(hours / 24)}d ago</span>;
}

const activityLabels: Record<string, { en: string; pl: string; color: string }> = {
  journal: { en: "Journal entry", pl: "Wpis dziennika", color: "#9B6B8D" },
  dream: { en: "Dream entry", pl: "Wpis snu", color: "#6a7aad" },
  shadow: { en: "Shadow work", pl: "Praca z cieniem", color: "#4a5568" },
  workbook_start: { en: "Started workbook", pl: "Rozpoczęła workbook", color: "#b8860b" },
  workbook_done: { en: "Completed workbook", pl: "Ukończyła workbook", color: "#2d8a4e" },
  analysis: { en: "Dream analysis", pl: "Analiza snu", color: "#c45050" },
};

export default function OwlPanel() {
  const router = useRouter();
  const { language } = useLanguage();
  const pl = language === "pl";

  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [statsRes, usersRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users"),
      ]);
      if (!statsRes.ok || !usersRes.ok) {
        setError(pl ? "Brak dostępu" : "Access denied");
        setLoading(false);
        return;
      }
      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      setStats(statsData);
      setUsers(usersData.users);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-gradient)" }}>
        <p className="text-sm tracking-widest uppercase animate-pulse" style={{ color: "var(--color-mauve)" }}>
          {pl ? "Ładuję panel..." : "Loading panel..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-gradient)" }}>
        <p className="text-sm" style={{ color: "#c45050" }}>{error}</p>
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
        </div>
        <h1 className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3"
          style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>
          {pl ? "Panel AGNÉLIS" : "AGNÉLIS Panel"}
        </h1>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mt-4">
          {(["overview", "users", "activity"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-full text-xs tracking-wide transition-all"
              style={{
                background: tab === t ? "var(--color-plum)" : "transparent",
                color: tab === t ? "var(--color-cream)" : "var(--color-mauve)",
                border: tab === t ? "none" : "1px solid var(--color-dusty-rose)",
                fontWeight: 600,
              }}>
              {t === "overview" ? (pl ? "Przegląd" : "Overview") :
               t === "users" ? (pl ? "Użytkownicy" : "Users") :
               (pl ? "Aktywność" : "Activity")}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-16 mt-4">

        {/* OVERVIEW TAB */}
        {tab === "overview" && stats && (
          <div className="space-y-4">
            {/* User metrics */}
            <div className="rounded-2xl border p-4" style={{ backgroundColor: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "var(--color-mauve)", fontWeight: 600 }}>
                {pl ? "Użytkownicy" : "Users"}
              </p>
              <div className="grid grid-cols-5 gap-2 text-center">
                {[
                  { label: pl ? "Łącznie" : "Total", value: stats.users.total },
                  { label: pl ? "Dziś" : "Today", value: stats.users.newToday },
                  { label: pl ? "Tydzień" : "Week", value: stats.users.newThisWeek },
                  { label: pl ? "Aktywni" : "Active", value: stats.users.activeThisWeek },
                  { label: "Premium", value: stats.users.premium },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-lg" style={{ color: "var(--color-dark)", fontWeight: 600 }}>{s.value}</p>
                    <p className="text-xs" style={{ color: "var(--color-mauve)" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Entries */}
            <div className="rounded-2xl border p-4" style={{ backgroundColor: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "var(--color-mauve)", fontWeight: 600 }}>
                {pl ? "Wpisy" : "Entries"}
              </p>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: pl ? "Dziennik" : "Journal", value: stats.entries.journal, today: stats.entries.journalToday },
                  { label: pl ? "Sny" : "Dreams", value: stats.entries.dreams, today: stats.entries.dreamsToday },
                  { label: pl ? "Cień" : "Shadow", value: stats.entries.shadow },
                  { label: pl ? "Cykl" : "Cycle", value: stats.entries.cycle },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-lg" style={{ color: "var(--color-dark)", fontWeight: 600 }}>{s.value}</p>
                    <p className="text-xs" style={{ color: "var(--color-mauve)" }}>{s.label}</p>
                    {"today" in s && s.today ? <p className="text-xs" style={{ color: "#2d8a4e" }}>+{s.today}</p> : null}
                  </div>
                ))}
              </div>
            </div>

            {/* AI & Commerce */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border p-4" style={{ backgroundColor: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
                <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "var(--color-mauve)", fontWeight: 600 }}>AI</p>
                <div className="space-y-2">
                  {[
                    { label: pl ? "Analizy" : "Analyses", value: stats.ai.analyses },
                    { label: pl ? "Raporty" : "Reports", value: stats.ai.reports },
                    { label: "Workbooks", value: stats.ai.workbooks },
                  ].map((s) => (
                    <div key={s.label} className="flex justify-between">
                      <span className="text-xs" style={{ color: "var(--color-mauve)" }}>{s.label}</span>
                      <span className="text-sm" style={{ color: "var(--color-dark)", fontWeight: 600 }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border p-4" style={{ backgroundColor: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
                <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "var(--color-mauve)", fontWeight: 600 }}>
                  {pl ? "Sprzedaż" : "Commerce"}
                </p>
                <div className="space-y-2">
                  {[
                    { label: pl ? "Zakupy" : "Purchases", value: stats.commerce.purchases },
                    { label: pl ? "Zaproszenia" : "Referrals", value: stats.commerce.referrals },
                    { label: pl ? "Aktywne" : "Active", value: stats.commerce.activeReferrals },
                  ].map((s) => (
                    <div key={s.label} className="flex justify-between">
                      <span className="text-xs" style={{ color: "var(--color-mauve)" }}>{s.label}</span>
                      <span className="text-sm" style={{ color: "var(--color-dark)", fontWeight: 600 }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick activity */}
            <div className="rounded-2xl border p-4" style={{ backgroundColor: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "var(--color-mauve)", fontWeight: 600 }}>
                {pl ? "Ostatnia aktywność" : "Recent activity"}
              </p>
              <div className="space-y-2">
                {stats.activity.slice(0, 8).map((a, i) => {
                  const info = activityLabels[a.type] || { en: a.type, pl: a.type, color: "#9B6B8D" };
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: info.color }} />
                        <span className="text-xs truncate" style={{ color: "var(--color-dark)" }}>{a.user.split("@")[0]}</span>
                        <span className="text-xs" style={{ color: "var(--color-mauve)" }}>{pl ? info.pl : info.en}</span>
                      </div>
                      <span className="text-xs flex-shrink-0" style={{ color: "var(--color-dusty-rose)" }}>
                        <TimeAgo date={a.at} />
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {tab === "users" && (
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="rounded-2xl border p-4 transition-all cursor-pointer"
                style={{ backgroundColor: "var(--color-blush)", borderColor: expanded === u.id ? "var(--color-plum)" : "var(--color-dusty-rose)" }}
                onClick={() => setExpanded(expanded === u.id ? null : u.id)}>

                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm truncate" style={{ color: "var(--color-dark)", fontWeight: 600 }}>
                        {u.displayName || u.email}
                      </p>
                      {u.isPremium && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "var(--color-plum)", color: "var(--color-cream)" }}>P</span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-mauve)" }}>
                      {u.stats.totalEntries} {pl ? "wpisów" : "entries"} · {u.lastSignIn ? <TimeAgo date={u.lastSignIn} /> : "never"}
                    </p>
                  </div>
                  <ScoreBadge score={u.engagementScore} />
                </div>

                {expanded === u.id && (
                  <div className="mt-4 pt-4 space-y-3" style={{ borderTop: "1px solid var(--color-dusty-rose)" }}>
                    <p className="text-xs" style={{ color: "var(--color-mauve)" }}>{u.email}</p>
                    <p className="text-xs" style={{ color: "var(--color-mauve)" }}>
                      {pl ? "Dołączyła" : "Joined"}: {new Date(u.createdAt).toLocaleDateString(pl ? "pl-PL" : "en-GB")} ({u.daysSinceCreation} {pl ? "dni temu" : "days ago"})
                    </p>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { label: pl ? "Dz" : "Jn", value: u.stats.journalCount },
                        { label: pl ? "Sn" : "Dr", value: u.stats.dreamCount },
                        { label: pl ? "Ci" : "Sh", value: u.stats.shadowCount },
                        { label: pl ? "Cy" : "Cy", value: u.stats.cycleCount },
                      ].map((s) => (
                        <div key={s.label} className="rounded-lg p-2" style={{ backgroundColor: "var(--color-cream)" }}>
                          <p className="text-lg" style={{ color: "var(--color-dark)", fontWeight: 600 }}>{s.value}</p>
                          <p className="text-xs" style={{ color: "var(--color-mauve)" }}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: "Workbooks", value: u.stats.completedWorkbooks },
                        { label: pl ? "Analizy" : "Analyses", value: u.stats.analysisCount },
                        { label: pl ? "Raporty" : "Reports", value: u.stats.reportCount },
                      ].map((s) => (
                        <div key={s.label} className="rounded-lg p-2" style={{ backgroundColor: "var(--color-cream)" }}>
                          <p className="text-base" style={{ color: "var(--color-dark)", fontWeight: 600 }}>{s.value}</p>
                          <p className="text-xs" style={{ color: "var(--color-mauve)" }}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2">
                      <p className="text-xs" style={{ color: "var(--color-dark)" }}>
                        <span style={{ fontWeight: 600 }}>Engagement: </span>
                        {u.engagementScore >= 70 ? (pl ? "♡ Wysoki rezonans. Ta osoba pracuje nad sobą regularnie i głęboko." : "♡ High resonance. This person works on themselves regularly and deeply.") :
                         u.engagementScore >= 40 ? (pl ? "Rośnie. Wraca, pisze, eksploruje." : "Growing. Returns, writes, explores.") :
                         u.engagementScore >= 15 ? (pl ? "Eksploruje. Zaczyna się otwierać." : "Exploring. Starting to open up.") :
                         (pl ? "Nowa. Za wcześnie na ocenę." : "New. Too early to assess.")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ACTIVITY TAB */}
        {tab === "activity" && stats && (
          <div className="rounded-2xl border p-4" style={{ backgroundColor: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
            <div className="space-y-3">
              {stats.activity.map((a, i) => {
                const info = activityLabels[a.type] || { en: a.type, pl: a.type, color: "#9B6B8D" };
                return (
                  <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < stats.activity.length - 1 ? "1px solid var(--color-dusty-rose)" : "none" }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: info.color }} />
                      <div className="min-w-0">
                        <p className="text-sm truncate" style={{ color: "var(--color-dark)", fontWeight: 500 }}>{a.user.split("@")[0]}</p>
                        <p className="text-xs" style={{ color: "var(--color-mauve)" }}>{pl ? info.pl : info.en}</p>
                      </div>
                    </div>
                    <span className="text-xs flex-shrink-0 ml-2" style={{ color: "var(--color-dusty-rose)" }}>
                      <TimeAgo date={a.at} />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
