"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n";
import { SunIcon, CloudIcon, SphereIcon, BarbellIcon, StarIcon } from "@/components/NoctuaIcons";

const MOODS = [
  { value: "radiant", icon: <SunIcon size={20} />, label: "Radiant", pl: "Promiennie" },
  { value: "calm", icon: <CloudIcon size={20} />, label: "Calm", pl: "Spokojnie" },
  { value: "neutral", icon: <SphereIcon size={20} />, label: "Neutral", pl: "Neutralnie" },
  { value: "heavy", icon: <BarbellIcon size={20} />, label: "Heavy", pl: "Ciężko" },
  { value: "stormy", icon: <StarIcon size={20} />, label: "Stormy", pl: "Burzliwie" },
];

function NewJournalEntryContent() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [title, setTitle] = useState("");
  const searchParams = useSearchParams();
  const promptFromUrl = searchParams.get("prompt");
  const [content, setContent] = useState("");
  const [promptShown, setPromptShown] = useState(false);
  const [moods, setMoods] = useState<string[]>([]);
  const [patternTag, setPatternTag] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkToday = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase.from("journal_entries")
        .select("id").eq("user_id", user.id).eq("entry_date", today).limit(1);
      if (data && data.length > 0) {
        router.push(`/journal/${data[0].id}/edit`);
      }
    };
    checkToday();
  }, []);

  const toggleMood = (value: string) => {
    setMoods((prev) => prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value]);
  };

  const handleSave = async () => {
    if (!content.trim()) { setError("Please write something before saving."); return; }
    setSaving(true); setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { error: insertError } = await supabase.from("journal_entries").insert({
      user_id: user.id, title: title.trim() || null, content: content.trim(),
      mood: moods, pattern_tag: patternTag?.trim() || null, entry_date: new Date().toISOString().split("T")[0],
    });
    if (insertError) { setError(insertError.message); setSaving(false); }
    else {
      try { fetch("/api/check-entry-milestones", { method: "POST" }); } catch {}
      router.push("/journal?saved=true");
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
      <header className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/journal")} className="text-xs tracking-wide" style={{ color: "var(--color-mauve)" }}>← {t("cancel")}</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 rounded-lg text-sm tracking-wide transition-colors disabled:opacity-50"
            style={{ background: "var(--color-plum)", color: "var(--color-cream)" }}>
            {saving ? "..." : t("save")}
          </button>
        </div>
        <h1 className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3"
          style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>
          {t("journal_new")}
        </h1>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-12 space-y-6">
        {error && <p className="text-sm text-center" style={{ color: "#c45050" }}>{error}</p>}

        <p className="text-xs text-center tracking-wide" style={{ color: "var(--color-dusty-rose)" }}>
          {new Date().toLocaleDateString(language === "pl" ? "pl-PL" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div className="flex justify-center gap-2 flex-wrap">
          {MOODS.map((m) => (
            <button key={m.value} onClick={() => toggleMood(m.value)}
              className="px-3 py-1.5 rounded-full text-xs transition-all border"
              style={{
                background: moods.includes(m.value) ? "var(--color-blush)" : "transparent",
                borderColor: moods.includes(m.value) ? "var(--color-mauve)" : "var(--color-dusty-rose)",
                color: moods.includes(m.value) ? "var(--color-plum)" : "var(--color-mauve)",
              }}><span className="inline-flex items-center gap-1.5">{m.icon}{language === "pl" ? m.pl : m.label}</span></button>
          ))}
        </div>

        <div className="flex flex-col items-center gap-2">
          <button onClick={() => setPatternTag(patternTag === null ? "" : null)}
            className="px-3 py-1.5 rounded-full text-xs transition-all border"
            style={{
              background: patternTag !== null ? "var(--color-blush)" : "transparent",
              borderColor: patternTag !== null ? "var(--color-mauve)" : "var(--color-dusty-rose)",
              color: patternTag !== null ? "var(--color-plum)" : "var(--color-mauve)",
            }}>
            <span className="inline-flex items-center gap-1.5">◎ {language === "pl" ? "Wzorzec / nawyk" : "Pattern / habit"}</span>
          </button>
          {patternTag !== null && (
            <>
              <p className="text-xs leading-relaxed max-w-xs" style={{ color: "var(--color-mauve)", textAlign: "center" }}>
                {language === "pl"
                  ? "Nazwij nawyk lub wzorzec, który obserwujesz. Noctua będzie szukać powiązań z Twoimi emocjami i snami."
                  : "Name a habit or pattern you're tracking. Noctua will look for connections with your emotions and dreams."}
              </p>
              <input type="text" value={patternTag} onChange={(e) => setPatternTag(e.target.value)}
                placeholder={language === "pl" ? "np. kawa, doomscrolling..." : "e.g. coffee, doomscrolling..."}
                className="text-xs text-center outline-none transition-colors duration-500 w-48"
                style={{ color: "var(--color-dark)", backgroundColor: "var(--color-blush)", borderRadius: "8px", padding: "6px 10px", borderBottom: "1px solid var(--color-dusty-rose)" }} />
            </>
          )}
        </div>

        <input type="text" placeholder={language === "pl" ? "Tytuł (opcjonalnie)" : "Title (optional)"} value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full text-lg font-light text-center outline-none transition-colors duration-500"
          style={{ color: "var(--color-dark)", backgroundColor: "var(--color-blush)", borderRadius: "12px", padding: "12px", fontFamily: "Georgia, 'Times New Roman', serif" }} />

        {promptFromUrl && !promptShown && (
          <div className="p-4 rounded-xl" style={{ background: "var(--color-blush)", borderLeft: "3px solid var(--color-gold)" }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--color-gold)", fontWeight: 600 }}>
              {language === "pl" ? "Noctua pyta" : "Noctua asks"}
            </p>
            <p style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1rem", lineHeight: 1.7 }}>
              {decodeURIComponent(promptFromUrl)}
            </p>
          </div>
        )}
        <textarea placeholder={promptFromUrl ? (language === "pl" ? "Twoja odpowiedź..." : "Your response...") : (language === "pl" ? "Pisz tutaj..." : "What's alive in you today?")} value={content} onChange={(e) => { setContent(e.target.value); if (promptFromUrl) setPromptShown(false); }} rows={12}
          className="w-full text-sm leading-relaxed outline-none resize-none transition-colors duration-500"
          style={{ color: "var(--color-dark)", backgroundColor: "var(--color-blush)", borderRadius: "12px", padding: "16px" }} />
      </main>
    </div>
  );
}

export default function NewJournalEntry() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: "var(--color-cream)" }} />}>
      <NewJournalEntryContent />
    </Suspense>
  );
}