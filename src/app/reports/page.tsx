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
  reflection_response: string | null;
  created_at: string;
  reading_type: "weekly" | "monthly" | "pattern";
};

type TabType = "weekly" | "monthly" | "pattern";

type ProductStatus = {
  status: "ready_to_generate" | "ready_to_buy" | "blocked_no_new_snapshot" | "blocked_not_enough_entries";
  entries_total: number;
  entries_required: number;
  current_snapshot_number: number;
  last_report_snapshot_number: number | null;
};

type ReportsStatusResponse = {
  full_reading: ProductStatus;
  pattern_reading: ProductStatus;
  reflection: ProductStatus;
  is_premium: boolean;
  is_admin: boolean;
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
  const [fromShop, setFromShop] = useState(false);
  const { language } = useLanguage();
  const pl = language === "pl";

  const [reports, setReports] = useState<SavedReport[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<ReportsStatusResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("monthly");

  useEffect(() => {
    loadReports();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("from") === "shop") setFromShop(true);
      const tabParam = params.get("tab");
      if (tabParam === "weekly" || tabParam === "monthly" || tabParam === "pattern") {
        setActiveTab(tabParam);
      }
    }
  }, []);

  const loadReports = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Fetch the full status for all three products from the backend
    // This replaces manual credit checks and gives us snapshot-gate awareness
    try {
      const statusRes = await fetch("/api/reports-status");
      if (statusRes.ok) {
        const data: ReportsStatusResponse = await statusRes.json();
        setStatusData(data);
      }
    } catch (err) {
      console.error("Failed to fetch reports status:", err);
    }

    // Load monthly + pattern reports from smart_reports
    const { data: smartRows } = await supabase
      .from("smart_reports")
      .select("*")
      .eq("user_id", user.id)
      .eq("language", language)
      .order("created_at", { ascending: false });

    const monthlyReports: SavedReport[] = (smartRows || []).map((r: SavedReport & { reading_type?: string }) => ({
      ...r,
      reading_type: (r.reading_type === "pattern" ? "pattern" : "monthly") as TabType,
    }));

    // Load weekly insights from weekly_insights
    const { data: weeklyRows } = await supabase
      .from("weekly_insights")
      .select("id, insight_text, week_start, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const weeklyReports: SavedReport[] = (weeklyRows || []).map((w: { id: string; insight_text: string; week_start: string; created_at: string }) => ({
      id: w.id,
      report_month: w.week_start,
      report_text: w.insight_text,
      report_data: null,
      reflection_response: null,
      created_at: w.created_at,
      reading_type: "weekly" as TabType,
    }));

    // Merge and sort by created_at
    const allReports = [...monthlyReports, ...weeklyReports].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setReports(allReports);
    setLoading(false);
  };

  const generateReport = async () => {
    setGenerating(true);
    setError(null);
    try {
      let endpoint = "/api/generate-report";
      let method = "POST";
      if (activeTab === "weekly") {
        endpoint = "/api/weekly-insight";
        method = "GET";
      } else if (activeTab === "pattern") {
        endpoint = "/api/generate-report";
        method = "POST";
      }
      const res = await fetch(endpoint, {
        method,
        headers: method === "POST" ? { "Content-Type": "application/json" } : undefined,
        body: method === "POST" ? JSON.stringify({ language, reading_type: activeTab }) : undefined,
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
        ? `<h3 style="font-size:15px;color:#50403C;margin:24px 0 6px;font-weight:600;letter-spacing:0.5px">${line.trim()}</h3>`
        : `<p style="font-size:12px;color:#3C3228;line-height:1.8;margin:0 0 6px;text-align:justify">${line.trim()}</p>`;
    }).join("");
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Noctua Reading</title><style>@page{margin:20mm 25mm}body{font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px}@media print{body{padding:0}}</style></head><body>
      <h1 style="text-align:center;font-size:24px;color:#50403C;font-weight:400;margin:30px 0 4px">${label.type}</h1>
      <p style="text-align:center;font-size:12px;color:#A08C78;margin:0 0 20px">${label.month}</p>
      ${counts}
      <hr style="border:none;border-top:1px solid #D4C4B4;margin:20px 60px"/>
      <div style="margin-top:24px">${formattedReport}</div>
      <div style="text-align:center;margin-top:40px">
        <div style="font-size:10px;color:#B4A494;letter-spacing:4px">N O C T U A</div>
        <div style="font-size:7px;color:#C4B4A4;margin-top:3px;letter-spacing:2px">by AGNÉLIS</div>
      </div>
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
          {fromShop && (
            <button onClick={() => router.push("/shop")} className="text-sm tracking-wide" style={{ color: "var(--color-gold)", fontWeight: 500 }}>
              {pl ? "Wróć do sklepu" : "Back to shop"}
            </button>
          )}
        </div>
        <h1 className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3"
          style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>
          {pl ? "Odczyty" : "Readings"}
        </h1>
        <div className="flex justify-center gap-6 mt-6">
          {([
            { key: "weekly", labelPl: "Refleksja", labelEn: "Reflection", color: "var(--color-gold)" },
            { key: "monthly", labelPl: "Pełen odczyt", labelEn: "Full Reading", color: "var(--color-plum)" },
            { key: "pattern", labelPl: "Wzorce", labelEn: "Patterns", color: "var(--color-mauve)" },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="text-xs uppercase tracking-[0.2em] pb-1 transition-all"
              style={{
                color: activeTab === tab.key ? tab.color : "var(--color-mauve)",
                fontWeight: activeTab === tab.key ? 700 : 400,
                borderBottom: activeTab === tab.key ? `1.5px solid ${tab.color}` : "1.5px solid transparent",
                opacity: activeTab === tab.key ? 1 : 0.6,
              }}
            >
              {pl ? tab.labelPl : tab.labelEn}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-16">
        {/* Generate button */}
        <div className="text-center pt-4 pb-6">
          {(() => {
            if (!statusData) return null;

            // Determine the active product status based on tab
            const activeStatus =
              activeTab === "monthly" ? statusData.full_reading :
              activeTab === "pattern" ? statusData.pattern_reading :
              statusData.reflection;

            const canGenerate = activeStatus.status === "ready_to_generate";
            const needsPurchase = activeStatus.status === "ready_to_buy";
            const notEnoughEntries = activeStatus.status === "blocked_not_enough_entries";
            const noNewSnapshot = activeStatus.status === "blocked_no_new_snapshot";

            const statusMessage = pl
              ? notEnoughEntries
                ? `Nie masz jeszcze wystarczająco wpisów. ${activeStatus.entries_total} z ${activeStatus.entries_required}.`
                : noNewSnapshot
                ? "Noctua czeka na wystarczającą ilość wpisów. Kontynuuj pisanie, a kolejny odczyt będzie głębszy. ♡"
                : needsPurchase
                ? "Możesz otworzyć ten odczyt kupując go w sklepie."
                : ""
              : notEnoughEntries
                ? `You don't have enough entries yet. ${activeStatus.entries_total} of ${activeStatus.entries_required}.`
                : noNewSnapshot
                ? "Noctua is waiting for enough entries. Keep writing, and the next reading will be deeper. ♡"
                : needsPurchase
                ? "You can open this reading by purchasing it in the shop."
                : "";

            return (
              <>
                {statusMessage && (
                  <div className="rounded-2xl border p-5 mb-4" style={{ background: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
                    <p className="text-sm leading-relaxed text-center" style={{ color: "var(--color-dark)" }}>
                      {notEnoughEntries ? (
                        <>
                          {pl ? "Nie masz jeszcze wystarczająco wpisów." : "You don't have enough entries yet."}
                          <br />
                          <span className="text-base" style={{ color: "var(--color-plum)", fontWeight: 500 }}>
                            {activeStatus.entries_total} / {activeStatus.entries_required}
                          </span>
                        </>
                      ) : (
                        statusMessage
                      )}
                    </p>
                    {needsPurchase && (
                      <div className="flex gap-2 justify-center mt-3">
                        <button onClick={() => router.push("/shop")} className="px-4 py-2 rounded-xl text-xs tracking-wide" style={{ background: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}>
                          {pl ? "Kup odczyt" : "Buy reading"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={generateReport}
                  disabled={generating || !canGenerate}
                  className="px-8 py-3 rounded-xl text-sm tracking-widest uppercase transition-all disabled:opacity-50"
                  style={{ backgroundColor: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}
                >
                  {generating
                    ? (pl ? "Czytam Twoje wzorce..." : "Reading your patterns...")
                    : (pl ? "Nowy odczyt" : "New reading")}
                </button>
              </>
            );
          })()}
          {error && (
            <p className="text-sm leading-relaxed mt-3" style={{ color: "var(--color-dusty-rose)" }}>{error}</p>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <p className="text-center text-sm pt-8" style={{ color: "var(--color-dusty-rose)" }}>
            {pl ? "Ładowanie..." : "Loading..."}
          </p>
        )}

        {(() => { const filteredReports = reports.filter(r => r.reading_type === activeTab); return (<>
        {/* Empty state */}
        {!loading && filteredReports.length === 0 && (
          <div className="text-center pt-12 space-y-4">
            <div className="text-4xl" style={{ color: "var(--color-plum)", opacity: 0.3 }}>◈</div>
            <p className="text-base" style={{ color: "var(--color-dark)" }}>
              {pl ? "Brak odczytów. Wygeneruj swój pierwszy." : "No readings yet. Generate your first one."}
            </p>
          </div>
        )}

        {/* Reports list */}
        {!loading && filteredReports.length > 0 && (
          <div className="space-y-3">
            {filteredReports.map((r) => {
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
                     <div className="pt-4 space-y-1">
                        {r.report_text.split("\n").map((line: string, i: number) => {
                          if (!line.trim()) return <div key={i} className="h-2" />;
                          const isHeading = /^[A-ZŻŹĆĄŚĘŁÓŃ]/.test(line.trim()) && line.trim().length < 40 && !line.trim().includes(".");
                          return isHeading ? (
                            <p key={i} className="text-base mt-5 mb-1" style={{ color: "var(--color-plum)", fontWeight: 600, fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.1rem" }}>
                              {line.trim()}
                            </p>
                          ) : (
                            <p key={i} className="text-sm leading-relaxed" style={{ color: "var(--color-dark)", textAlign: "justify" }}>
                              {line.trim()}
                            </p>
                          );
                        })}
                      </div>

                      {/* Reflection */}
                      <div className="rounded-xl border p-4 mt-4 transition-colors duration-500" style={{ background: "var(--color-cream)", borderColor: "var(--color-dusty-rose)" }}>
                        <p className="text-base mb-3" style={{ color: "var(--color-plum)", fontWeight: 600, fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.05rem" }}>
                          {pl ? "Zapisz swoją refleksję..." : "Write your reflection..."}
                        </p>
                        {r.reflection_response ? (
                          <div>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--color-dark)", textAlign: "justify" }}>
                              {r.reflection_response}
                            </p>
                            <button
                              onClick={() => {
                                const updated = reports.map(rep => rep.id === r.id ? { ...rep, reflection_response: null } : rep);
                                setReports(updated);
                              }}
                              className="text-xs mt-3 transition-opacity hover:opacity-70"
                              style={{ color: "var(--color-mauve)" }}
                            >
                              {pl ? "Edytuj" : "Edit"}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <textarea
                              defaultValue=""
                              id={`reflection-${r.id}`}
                              rows={4}
                              placeholder={pl ? "Pisz tutaj..." : "Write here..."}
                              className="w-full rounded-xl border p-3 text-sm resize-none transition-colors duration-500"
                              style={{ backgroundColor: "var(--color-blush)", borderColor: "var(--color-dusty-rose)", color: "var(--color-dark)", fontFamily: "Georgia, serif" }}
                            />
                            <button
                              onClick={async () => {
                                const textarea = document.getElementById(`reflection-${r.id}`) as HTMLTextAreaElement;
                                const value = textarea?.value?.trim();
                                if (!value) return;
                                const supabase = createClient();
                                await supabase.from("smart_reports")
                                  .update({ reflection_response: value })
                                  .eq("id", r.id);
                                const updated = reports.map(rep => rep.id === r.id ? { ...rep, reflection_response: value } : rep);
                                setReports(updated);
                              }}
                              className="px-5 py-2 rounded-xl text-xs tracking-widest uppercase transition-all"
                              style={{
                                backgroundColor: "var(--color-plum)",
                                color: "var(--color-cream)",
                                fontWeight: 600,
                              }}
                            >
                              {pl ? "Zapisz" : "Save"}
                            </button>
                          </div>
                        )}
                      </div>

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
        </>); })()}
      </main>
    </div>
  );
}