"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

type UserData = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
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

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "#2d8a4e" : score >= 40 ? "#b8860b" : score >= 15 ? "#9B6B8D" : "#a0a0a0";
  const label = score >= 70 ? "Soul match" : score >= 40 ? "Growing" : score >= 15 ? "Exploring" : "New";
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: color + "20", color, fontWeight: 600 }}>
      {score} {label}
    </span>
  );
}

function DaysAgo({ date }: { date: string | null }) {
  if (!date) return <span style={{ color: "var(--color-dusty-rose)" }}>never</span>;
  const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  const color = days <= 1 ? "#2d8a4e" : days <= 7 ? "#b8860b" : "#c45050";
  return <span style={{ color }}>{days === 0 ? "today" : days === 1 ? "yesterday" : `${days}d ago`}</span>;
}

export default function AdminPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const pl = language === "pl";

  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        setError(pl ? "Brak dostępu" : "Access denied");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setUsers(data.users);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-gradient)" }}>
        <p className="text-sm tracking-widest uppercase animate-pulse" style={{ color: "var(--color-mauve)" }}>
          {pl ? "Ładuję dane..." : "Loading data..."}
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
          <span className="text-xs" style={{ color: "var(--color-mauve)" }}>{users.length} {pl ? "użytkowników" : "users"}</span>
        </div>
        <h1 className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3"
          style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>
          {pl ? "Panel AGNÉLIS" : "AGNÉLIS Panel"}
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-16 space-y-3 mt-4">
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
                  {u.stats.totalEntries} {pl ? "wpisów" : "entries"} · <DaysAgo date={u.lastSignIn} />
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
                    { label: pl ? "Workbooki" : "Workbooks", value: u.stats.completedWorkbooks },
                    { label: pl ? "Analizy AI" : "AI analyses", value: u.stats.analysisCount },
                    { label: pl ? "Raporty" : "Reports", value: u.stats.reportCount },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg p-2" style={{ backgroundColor: "var(--color-cream)" }}>
                      <p className="text-base" style={{ color: "var(--color-dark)", fontWeight: 600 }}>{s.value}</p>
                      <p className="text-xs" style={{ color: "var(--color-mauve)" }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between text-xs" style={{ color: "var(--color-mauve)" }}>
                  <span>{pl ? "Zakupy" : "Purchases"}: {u.stats.purchaseCount}</span>
                  <span>{pl ? "Zaproszenia" : "Referrals"}: {u.stats.referralCount} ({u.stats.activeReferrals} {pl ? "aktywne" : "active"})</span>
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
      </main>
    </div>
  );
}