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

type SavedReport = {
  id: string;
  report_month: string;
  report_text: string;
  report_data: ReportData | null;
  created_at: string;
};

function getReportLabel(reportMonth: string, pl: boolean): { month: string; type: string } {
  const parts = reportMonth.split("-");
  const year = parts[0];
  const monthNum = parseInt(parts[1]);
  const type = parts[2] || "mid";
  const date = new Date(parseInt(year), monthNum - 1);
  const monthName = date.toLocaleDateString(pl ? "pl-PL" : "en-GB", { month: "long", year: "numeric" });
  const typeLabel = type === "full"
    ? (pl ? "Pełny odczyt" : "Full reading")
    : (pl ? "Odczyt połowy miesiąca" : "Mid-month reading");
  return { month: monthName, type: typeLabel };
}

export default function ReportsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const pl = language === "pl";

  const [reports, setReports] = useState<SavedReport[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data } = await supabase
      .from("smart_reports")
      .select("*")
      .eq("user_id", user.id)
      .eq("language", language)
      .order("created_at", { ascending: false });

    setReports((data as SavedReport[]) || []);
    setLoading(false);
  };

  const generateReport = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language }),
      });
      const data = await res.json();
      if (res.ok) {
        await loadReports();
      } else {
        setError(data.message || (pl ? "Generowanie nie powiodło się." : "Report generation failed."));
      }
    } catch {
      setError(pl ? "Wystąpił błąd. Spróbuj ponownie." : "Something went wrong. Try again.");
    }
    setGenerating(false);
  };

  const handlePDF = (report: SavedReport) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const rd = report.report_data;
    const label = getReportLabel(report.report_month, pl);
    const counts = rd ? `
      <div style="display:flex;justify-content:center;gap:32px;margin:20px 0;">
        ${[
          { l: pl ? "Dziennik" : "Journal", c: rd.counts.journal },
          { l: pl ? "Sny" : "Dreams", c: rd.counts.dreams },
          { l: pl ? "Cień" : "Shadow", c: rd.counts.shadow },
          { l: pl ? "Cykl" : "Cycle", c: rd.counts.cycle },
        ].map(i => `<div style="text-align:center"><div style="font-size:18px;color:#50403C;font-weight:600">${i.c}</div><div style="font-size:10px;color:#A08C78;text-transform:uppercase;letter-spacing:2px">${i.l}</div></div>`).join("")}
      </div>` : "";
    const formattedReport = (report.report_text || "").split("\n").map(line => {
      if (!line.trim()) return "<br/>";
      const isHeading = /^[A-ZŻŹĆĄŚĘŁÓŃ]/.test(line.trim()) && line.trim().length < 40 && !line.trim().includes(".");
      return isHeading
        ? `<h3 style="font-size:14px;color:#50403C;margin:20px 0 8px;font-weight:600">${line.trim()}</h3>`
        : `<p style="font-size:12px;color:#3C3228;line-height:1.7;margin:0 0 6px">${line.trim()}</p>`;
    }).join("");
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Noctua Reading</title><style>@page{margin:20mm 25mm}body{font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px}@media print{body{padding:0}}</style></head><body>
      <div style="text-align:center;margin-bottom:10px">
        <div style="font-size:10px;color:#A08C78;letter-spacing:6px">N O C T U A</div>
        <div style="font-size:8px;color:#A08C78;margin-top:4px">by AGNÉLIS</div>
      </div>
      <h1 style="text-align:center;font-size:24px;color:#50403C;font-weight:400;margin:16px 0 4px">${label.type}</h1>
      <p style="text-align:center;font-size:12px;color:#A08C78;margin:0 0 20px">${label.month}</p>
      ${counts}
      <hr style="border:none;border-top:1px solid #D4C4B4;margin:20px 60px"/>
      <div style="margin-top:24px">${formattedReport}</div>
      <div style="text-align:center;margin-top:40px;font-size:8px;color:#B4A494">Noctua by AGNÉLIS</div>
    </body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
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
          {pl ? "Odczyty" : "Readings"}
        </h1>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-16">
        {/* Generate button */}
        <div className="text-center pt-4 pb-6">
          <button
            onClick={generateReport}
            disabled={generating}
            className="px-8 py-3 rounded-xl text-sm tracking-widest uppercase transition-all disabled:opacity-50"
            style={{ backgroundColor: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}
          >
            {generating
              ? (pl ? "Czytam twoje wzorce..." : "Reading your patterns...")
              : (pl ? "Nowy odczyt" : "New reading")}
          </button>
          {error && (
            <p className="text-sm leading-relaxed mt-3" style={{ color: "var(--color-dusty-rose)" }}>{error}</p>
          )}
          <p className="text-xs mt-3" style={{ color: "var(--color-mauve)", opacity: 0.6 }}>
            {pl
              ? "Dostępny od 15. dnia miesiąca (min. 8 wpisów). Pełny odczyt od 25. dnia (min. 15 wpisów)."
              : "Available from the 15th (min. 8 entries). Full reading from the 25th (min. 15 entries)."}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <p className="text-center text-sm pt-8" style={{ color: "var(--color-dusty-rose)" }}>
            {pl ? "Ładowanie..." : "Loading..."}
          </p>
        )}

        {/* Empty state */}
        {!loading && reports.length === 0 && (
          <div className="text-center pt-12 space-y-4">
            <div className="text-4xl" style={{ color: "var(--color-plum)", opacity: 0.3 }}>◈</div>
            <p className="text-base" style={{ color: "var(--color-dark)" }}>
              {pl ? "Brak odczytów. Wygeneruj swój pierwszy." : "No readings yet. Generate your first one."}
            </p>
          </div>
        )}

        {/* Reports list */}
        {!loading && reports.length > 0 && (
          <div className="space-y-3">
            {reports.map((r) => {
              const label = getReportLabel(r.report_month, pl);
              const isExpanded = expandedId === r.id;
              const createdDate = new Date(r.created_at).toLocaleDateString(pl ? "pl-PL" : "en-GB", {
                day: "numeric", month: "long", year: "numeric",
              });

              return (
                <div key={r.id} className="rounded-2xl border transition-colors duration-500"
                  style={{ backgroundColor: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>

                  {/* Collapsed header */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    className="w-full text-left p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base" style={{ color: "var(--color-dark)", fontWeight: 500, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                          {label.month}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-mauve)" }}>
                          {label.type} · {createdDate}
                        </p>
                      </div>
                      <span className="text-sm" style={{ color: "var(--color-mauve)", transition: "transform 0.3s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                        ▾
                      </span>
                    </div>
                    {/* Mini counts */}
                    {r.report_data && (
                      <div className="flex gap-4 mt-2">
                        {[
                          { l: pl ? "Dz" : "J", c: r.report_data.counts.journal },
                          { l: pl ? "Sn" : "D", c: r.report_data.counts.dreams },
                          { l: pl ? "Ci" : "S", c: r.report_data.counts.shadow },
                          { l: pl ? "Cy" : "C", c: r.report_data.counts.cycle },
                        ].map((item) => (
                          <span key={item.l} className="text-xs" style={{ color: "var(--color-mauve)" }}>
                            {item.l}: {item.c}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-4 pb-4" style={{ borderTop: "1px solid var(--color-dusty-rose)" }}>
                      <p className="text-sm leading-relaxed whitespace-pre-line pt-4" style={{ color: "var(--color-dark)" }}>
                        {r.report_text}
                      </p>

                      {/* Patterns */}
                      {r.report_data && (r.report_data.topSymbols?.length > 0 || r.report_data.topEmotions?.length > 0) && (
                        <div className="space-y-3 mt-4">
                          {r.report_data.topSymbols?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {r.report_data.topSymbols.map(([symbol, count]) => (
                                <span key={symbol} className="px-2 py-0.5 rounded-full text-xs"
                                  style={{ backgroundColor: "var(--color-plum)", color: "var(--color-cream)" }}>
                                  {symbol} ({count})
                                </span>
                              ))}
                            </div>
                          )}
                          {r.report_data.topEmotions?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {r.report_data.topEmotions.map(([emotion, count]) => (
                                <span key={emotion} className="px-2 py-0.5 rounded-full text-xs"
                                  style={{ backgroundColor: "var(--color-mauve)", color: "var(--color-cream)" }}>
                                  {emotion} ({count})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* PDF button */}
                      <div className="text-center mt-4">
                        <button
                          onClick={() => handlePDF(r)}
                          className="px-5 py-2 rounded-xl text-xs tracking-widest uppercase"
                          style={{
                            background: "linear-gradient(135deg, var(--color-plum), var(--color-mauve))",
                            color: "var(--color-cream)",
                            fontWeight: 600,
                          }}
                        >
                          {pl ? "Pobierz PDF" : "Download PDF"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}