"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n";
import { SunIcon, GreenSphereIcon, SphereIcon, SpikyIcon, MaskIcon, DropIcon, StarIcon } from "@/components/NoctuaIcons";

const TONES = [
  { value: "joyful", icon: <SunIcon size={20} />, label: "Joyful", pl: "Radośnie" },
  { value: "peaceful", icon: <GreenSphereIcon size={20} />, label: "Peaceful", pl: "Spokojnie" },
  { value: "neutral", icon: <SphereIcon size={20} />, label: "Neutral", pl: "Neutralnie" },
  { value: "anxious", icon: <SpikyIcon size={20} />, label: "Anxious", pl: "Niespokojnie" },
  { value: "fearful", icon: <MaskIcon size={20} />, label: "Fearful", pl: "Strasznie" },
  { value: "sad", icon: <DropIcon size={20} />, label: "Sad", pl: "Smutno" },
  { value: "angry", icon: <StarIcon size={20} />, label: "Angry", pl: "Ze złością" },
];

export default function EditDreamEntry() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const params = useParams();
  const id = params.id as string;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tones, setTones] = useState<string[]>([]);
  const [lucidity, setLucidity] = useState(0);
  const [isRecurring, setIsRecurring] = useState(false);
  const [symbolInput, setSymbolInput] = useState("");
  const [symbols, setSymbols] = useState<string[]>([]);
  const [dreamDate, setDreamDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    const loadEntry = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("dream_entries").select("*").eq("id", id).single();
      if (data) {
        setTitle(data.title || ""); setContent(data.content || "");
        setTones(data.emotional_tone || []); setLucidity(data.lucidity || 0);
        setIsRecurring(data.is_recurring || false); setSymbols(data.symbols || []);
        setDreamDate(data.dream_date || "");
      }
      setLoading(false);
    };
    loadEntry();
  }, [id]);

  // Load existing analysis
  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        const res = await fetch("/api/analyse-dream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dreamId: id }),
        });
        const data = await res.json();
        if (res.ok && data.analysis) {
          setAnalysis(data.analysis);
        }
      } catch {}
    };
    if (id) loadAnalysis();
  }, [id]);

  const toggleTone = (value: string) => {
    setTones((prev) => prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]);
  };

  const addSymbol = () => {
    const s = symbolInput.trim().toLowerCase();
    if (s && !symbols.includes(s)) setSymbols([...symbols, s]);
    setSymbolInput("");
  };

  const removeSymbol = (s: string) => setSymbols(symbols.filter((x) => x !== s));

  const handleAnalyse = async () => {
    setAnalysing(true);
    setAnalysisError(null);
    try {
      const res = await fetch("/api/analyse-dream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dreamId: id, language }),
      });
      const data = await res.json();
      if (res.ok) {
        setAnalysis(data.analysis);
      } else if (data.error === "limit_reached") {
        setAnalysisError(language === "pl"
          ? "Wykorzystano limit 5 analiz w tym miesiącu. Możesz dokupić analizę w sklepie za £1.49."
          : "You've used all 5 analyses this month. You can buy additional analyses in the shop for £1.49.");
      } else if (data.error === "no_access") {
        setAnalysisError(language === "pl"
          ? "Analiza snów jest dostępna dla subskrybentów premium lub jako zakup w sklepie za £2.99."
          : "Dream analysis is available for premium subscribers or as a single purchase in the shop for £2.99.");
      } else {
        setAnalysisError(language === "pl" ? "Analiza nie powiodła się. Spróbuj ponownie." : "Analysis failed. Please try again.");
      }
    } catch {
      setAnalysisError(language === "pl" ? "Coś poszło nie tak." : "Something went wrong.");
    }
    setAnalysing(false);
  };

  const handleSave = async () => {
    if (!content.trim()) { setError("Please describe your dream before saving."); return; }
    setSaving(true); setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase.from("dream_entries")
      .update({ title: title.trim() || null, content: content.trim(), emotional_tone: tones,
        lucidity: lucidity || null, is_recurring: isRecurring, symbols }).eq("id", id);
    if (updateError) { setError(updateError.message); setSaving(false); }
    else { router.push("/dreams"); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
        <p className="text-sm" style={{ color: "var(--color-dusty-rose)" }}>{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
      <header className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/dreams")} className="text-xs tracking-wide" style={{ color: "var(--color-mauve)" }}>← {t("back")}</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 rounded-lg text-sm tracking-wide transition-colors disabled:opacity-50"
            style={{ background: "var(--color-plum)", color: "var(--color-cream)" }}>
            {saving ? "..." : t("save")}
          </button>
        </div>
        <h1 className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>{t("dreams_edit")}</h1>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-12 space-y-6">
        {error && <p className="text-sm text-center" style={{ color: "#c45050" }}>{error}</p>}

        <p className="text-xs text-center tracking-wide" style={{ color: "var(--color-dusty-rose)" }}>
          {dreamDate && new Date(dreamDate).toLocaleDateString(language === "pl" ? "pl-PL" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div className="flex justify-center gap-2 flex-wrap">
          {TONES.map((t) => (
            <button key={t.value} onClick={() => toggleTone(t.value)}
              className="px-3 py-1.5 rounded-full text-xs transition-all border"
              style={{
                background: tones.includes(t.value) ? "var(--color-blush)" : "transparent",
                borderColor: tones.includes(t.value) ? "var(--color-mauve)" : "var(--color-dusty-rose)",
                color: tones.includes(t.value) ? "var(--color-plum)" : "var(--color-mauve)",
              }}><span className="inline-flex items-center gap-1.5">{t.icon}{language === "pl" ? t.pl : t.label}</span></button>
          ))}
        </div>

        <div className="text-center space-y-1">
          <p className="text-xs" style={{ color: "var(--color-dusty-rose)" }}>{language === "pl" ? "Świadomość" : "Lucidity"}</p>
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setLucidity(lucidity === n ? 0 : n)} className="text-lg transition-all"
                style={{ color: n <= lucidity ? "var(--color-plum)" : "var(--color-dusty-rose)" }}>◆</button>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <button onClick={() => setIsRecurring(!isRecurring)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-all"
            style={{
              background: isRecurring ? "var(--color-blush)" : "transparent",
              borderColor: isRecurring ? "var(--color-mauve)" : "var(--color-dusty-rose)",
              color: isRecurring ? "var(--color-plum)" : "var(--color-mauve)",
            }}>{isRecurring ? (language === "pl" ? "↻ Sen powtarzający" : "↻ Recurring dream") : (language === "pl" ? "↻ Oznacz jako powtarzający" : "↻ Mark as recurring")}</button>
        </div>

        <input type="text" placeholder={language === "pl" ? "Tytul snu (opcjonalnie)" : "Dream title (optional)"} value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full text-lg font-light text-center outline-none transition-colors duration-500"
          style={{ color: "var(--color-dark)", backgroundColor: "var(--color-blush)", borderRadius: "12px", padding: "12px", fontFamily: "Georgia, 'Times New Roman', serif" }} />

        <textarea placeholder={language === "pl" ? "Opisz swoj sen..." : "Describe your dream..."} value={content} onChange={(e) => setContent(e.target.value)} rows={10}
          className="w-full text-sm leading-relaxed outline-none resize-none transition-colors duration-500"
          style={{ color: "var(--color-dark)", backgroundColor: "var(--color-blush)", borderRadius: "12px", padding: "16px" }} />

        <div className="space-y-2">
          <p className="text-xs text-center" style={{ color: "var(--color-dusty-rose)" }}>{language === "pl" ? "Symbole snu" : "Dream symbols"}</p>
          <div className="flex justify-center gap-2">
            <input type="text" placeholder={language === "pl" ? "np. woda, waz, latanie" : "e.g. water, snake, flying"} value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSymbol(); } }}
              className="text-sm text-center outline-none border-b w-48 transition-colors duration-500"
              style={{ color: "var(--color-dark)", backgroundColor: "transparent", borderColor: "var(--color-dusty-rose)" }} />
            <button onClick={addSymbol} className="text-xs px-2 py-1 rounded-lg"
              style={{ background: "var(--color-blush)", color: "var(--color-plum)" }}>{language === "pl" ? "Dodaj" : "Add"}</button>
          </div>
          {symbols.length > 0 && (
            <div className="flex justify-center gap-1.5 flex-wrap">
              {symbols.map((s) => (
                <span key={s} className="text-xs px-2 py-1 rounded-full flex items-center gap-1"
                  style={{ background: "var(--color-blush)", color: "var(--color-plum)" }}>
                  {s}<button onClick={() => removeSymbol(s)} className="opacity-60">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 mt-2">
          <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
          <span className="text-xs" style={{ color: "var(--color-gold)", opacity: 0.6 }}>◇</span>
          <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
        </div>

        <div className="space-y-4">
          {analysis ? (
            <div className="rounded-2xl border p-5 transition-colors duration-500" style={{ background: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
              <p className="text-xs uppercase tracking-[0.3em] text-center mb-4" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
                {language === "pl" ? "Wgląd" : "Insight"}
              </p>
              <div className="space-y-1">
                {analysis.split("\n").map((line: string, i: number) => {
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
            </div>
          ) : (
            <div className="text-center space-y-3">
              <button onClick={handleAnalyse} disabled={analysing}
                className="px-6 py-2.5 rounded-xl text-sm tracking-wide transition-all disabled:opacity-50"
                style={{ background: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 500 }}>
                {analysing ? (language === "pl" ? "Analizowanie..." : "Analysing...") : (language === "pl" ? "Analizuj ten sen" : "Analyse this dream")}
              </button>
              {analysisError && (
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-dusty-rose)" }}>{analysisError}</p>
              )}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}