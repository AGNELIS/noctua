"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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

export default function EditJournalEntry() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const params = useParams();
  const id = params.id as string;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [moods, setMoods] = useState<string[]>([]);
  const [entryDate, setEntryDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEntry = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("journal_entries").select("*").eq("id", id).single();
      if (data) {
        setTitle(data.title || ""); setContent(data.content || "");
        setMoods(data.mood || []); setEntryDate(data.entry_date || "");
      }
      setLoading(false);
    };
    loadEntry();
  }, [id]);

  const toggleMood = (value: string) => {
    setMoods((prev) => prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value]);
  };

  const handleSave = async () => {
    if (!content.trim()) { setError("Please write something before saving."); return; }
    setSaving(true); setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase.from("journal_entries")
      .update({ title: title.trim() || null, content: content.trim(), mood: moods }).eq("id", id);
    if (updateError) { setError(updateError.message); setSaving(false); }
    else { router.push("/journal"); }
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
      <header className="flex items-center justify-between px-6 py-5">
        <button onClick={() => router.push("/journal")} className="text-xs tracking-wide" style={{ color: "var(--color-mauve)" }}>← {t("back")}</button>
        <div />
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 rounded-lg text-sm tracking-wide transition-colors disabled:opacity-50"
          style={{ background: "var(--color-plum)", color: "var(--color-cream)" }}>
          {saving ? "..." : t("save")}
        </button>
      </header>
      <h1 className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3 mb-2" style={{ color: "var(--color-plum)", fontFamily: "'Antic Didone', Georgia, serif", fontWeight: 700 }}>{t("journal_edit")}</h1>
      <main className="max-w-xl mx-auto px-6 pb-12 space-y-6">
        {error && <p className="text-sm text-center" style={{ color: "#c45050" }}>{error}</p>}

        <p className="text-xs text-center tracking-wide" style={{ color: "var(--color-dusty-rose)" }}>
          {entryDate && new Date(entryDate).toLocaleDateString(language === "pl" ? "pl-PL" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
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

        <input type="text" placeholder={language === "pl" ? "Tytul (opcjonalnie)" : "Title (optional)"} value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full text-lg font-light text-center outline-none transition-colors duration-500"
          style={{ color: "var(--color-dark)", backgroundColor: "var(--color-blush)", borderRadius: "12px", padding: "12px", fontFamily: "Georgia, 'Times New Roman', serif" }} />

        <textarea placeholder={language === "pl" ? "Pisz tutaj..." : "What's alive in you today?"} value={content} onChange={(e) => setContent(e.target.value)} rows={12}
          className="w-full text-sm leading-relaxed outline-none resize-none transition-colors duration-500"
          style={{ color: "var(--color-dark)", backgroundColor: "var(--color-blush)", borderRadius: "12px", padding: "16px" }} />
      </main>
    </div>
  );
}