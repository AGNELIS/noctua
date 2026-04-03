"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n";

type ReportData = {
  month: string;
  counts: { journal: number; dreams: number; shadow: number; cycle: number };
  topMoods: [string, number][];
  topEmotions: [string, number][];
  topSymbols: [string, number][];
};

export default function ReportsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const pl = language === "pl";

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push("/login");
  };

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language }),
      });
      const data = await res.json();
      if (res.ok) {
        setReport(data.report);
        setReportData(data.data);
        setGenerated(true);
      } else {
        setError(data.message || (pl ? "Generowanie nie powiodło się." : "Report generation failed."));
      }
    } catch {
      setError(pl ? "Wystąpił błąd. Spróbuj ponownie." : "Something went wrong. Try again.");
    }
    setLoading(false);
  };

  const monthLabel = () => {
    const now = new Date();
    return now.toLocaleDateString(pl ? "pl-PL" : "en-GB", { month: "long", year: "numeric" });
  };

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
      <header className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/dashboard")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
            ← {pl ? "Wróć" : "Back"}
          </button>
        </div>
        <h1 className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3"
          style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>
          {pl ? "Odczyt" : "Reading"}
        </h1>
        <p className="text-center text-sm mt-1" style={{ color: "var(--color-mauve)" }}>
          {monthLabel()}
        </p>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-16">
        {!generated && !loading && (
          <div className="text-center pt-16 space-y-6">
            <div className="text-5xl mb-2" style={{ color: "var(--color-plum)", opacity: 0.3 }}>◈</div>
            <p className="text-base leading-relaxed" style={{ color: "var(--color-dark)" }}>
              {pl
                ? "Odczyt twojego miesiąca. Dziennik, sny, praca z cieniem, cykl. Wszystko, co zostawiłaś w Noctui, przeczytane z powrotem do ciebie."
                : "A reading of your month. Journal, dreams, shadow work, cycle. Everything you've left in Noctua, read back to you."}
            </p>
            <button
              onClick={generateReport}
              className="px-8 py-3 rounded-xl text-sm tracking-widest uppercase"
              style={{ backgroundColor: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}
            >
              {pl ? "Wygeneruj odczyt" : "Generate reading"}
            </button>
            {error && (
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-dusty-rose)" }}>{error}</p>
            )}
          </div>
        )}

        {loading && (
          <div className="text-center pt-20">
            <p className="text-sm tracking-widest uppercase animate-pulse" style={{ color: "var(--color-mauve)" }}>
              {pl ? "Czytam twoje wzorce..." : "Reading your patterns..."}
            </p>
          </div>
        )}

        {generated && report && (
          <div className="space-y-6 pt-6">
            {/* Data summary */}
            {reportData && (
              <div className="flex justify-center gap-6 text-center">
                {[
                  { label: pl ? "Dziennik" : "Journal", count: reportData.counts.journal },
                  { label: pl ? "Sny" : "Dreams", count: reportData.counts.dreams },
                  { label: pl ? "Cień" : "Shadow", count: reportData.counts.shadow },
                  { label: pl ? "Cykl" : "Cycle", count: reportData.counts.cycle },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-lg" style={{ color: "var(--color-plum)", fontWeight: 600 }}>{item.count}</p>
                    <p className="text-xs uppercase tracking-wider" style={{ color: "var(--color-mauve)" }}>{item.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
              <span className="text-xs" style={{ color: "var(--color-dusty-rose)", opacity: 0.6 }}>&#9671;</span>
              <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
            </div>

            {/* Report text */}
            <div className="rounded-2xl border p-5 transition-colors duration-500"
              style={{ background: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--color-dark)" }}>
                {report}
              </p>
            </div>

            {/* Top patterns */}
            {reportData && (reportData.topSymbols.length > 0 || reportData.topEmotions.length > 0) && (
              <div className="space-y-3">
                {reportData.topSymbols.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--color-mauve)", fontWeight: 600 }}>
                      {pl ? "Symbole snów" : "Dream symbols"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {reportData.topSymbols.map(([symbol, count]) => (
                        <span key={symbol} className="px-3 py-1 rounded-full text-xs"
                          style={{ backgroundColor: "var(--color-plum)", color: "var(--color-cream)" }}>
                          {symbol} ({count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {reportData.topEmotions.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--color-mauve)", fontWeight: 600 }}>
                      {pl ? "Emocje cienia" : "Shadow emotions"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {reportData.topEmotions.map(([emotion, count]) => (
                        <span key={emotion} className="px-3 py-1 rounded-full text-xs"
                          style={{ backgroundColor: "var(--color-mauve)", color: "var(--color-cream)" }}>
                          {emotion} ({count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Generate new */}
            <div className="text-center pt-4">
              <button
                onClick={() => { setGenerated(false); setReport(null); setReportData(null); }}
                className="text-sm tracking-wide"
                style={{ color: "var(--color-mauve)" }}
              >
                {pl ? "Wygeneruj ponownie" : "Generate again"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}