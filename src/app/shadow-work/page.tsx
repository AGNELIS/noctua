"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getMoonPhase } from "@/lib/moon";
import { getDailyInsight } from "@/lib/moon";
import { useLanguage } from "@/lib/i18n";

const EMOTIONS = [
  "anger", "fear", "sadness", "shame", "guilt",
  "confusion", "resistance", "grief", "anxiety", "numbness",
  "relief", "clarity", "discomfort", "longing", "frustration",
];

const EMOTIONS_PL: Record<string, string> = {
  anger: "złość", fear: "strach", sadness: "smutek", shame: "wstyd",
  guilt: "poczucie winy", confusion: "zagubienie", resistance: "opór",
  grief: "żal", anxiety: "niepokój", numbness: "odrętwienie",
  relief: "ulga", clarity: "jasność", discomfort: "dyskomfort",
  longing: "tęsknota", frustration: "frustracja",
};

type Entry = {
  id: string;
  prompt: string;
  response: string;
  moon_phase: string;
  emotions: string[];
  created_at: string;
};

export default function ShadowWorkPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const moon = getMoonPhase();
  const todayPrompt = getDailyInsight(moon.phase, language);

  const [response, setResponse] = useState("");
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data } = await supabase
      .from("shadow_work_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setEntries((data as Entry[]) || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!response.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("shadow_work_entries").insert({
      user_id: user.id,
      prompt: todayPrompt,
      response: response.trim(),
      moon_phase: moon.phase,
      emotions: selectedEmotions,
    });

    setResponse("");
    setSelectedEmotions([]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    loadEntries();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const supabase = createClient();
    await supabase.from("shadow_work_entries").delete().eq("id", id);
    setEntries(entries.filter((e) => e.id !== id));
    setDeletingId(null);
  };

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions((prev) =>
      prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion]
    );
  };

  const alreadyAnsweredToday = entries.some(
    (e) => new Date(e.created_at).toDateString() === new Date().toDateString()
  );

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ backgroundColor: "#1c1c1e" }}>
      <header className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/dashboard")} className="text-sm tracking-wide" style={{ color: "#b0a0a8", fontWeight: 500 }}>
            ← {t("back")}
          </button>
          <div className="w-12" />
        </div>
        <h1
          className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3"
          style={{ color: "#e0a8b8", fontFamily: "'Antic Didone', Georgia, serif", fontWeight: 700 }}
        >
          {language === "pl" ? "Praca z cieniem" : "Shadow Work"}
        </h1>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-16 space-y-8">

        {/* Today's prompt */}
        <section className="text-center space-y-4 pt-4">
          <p className="text-base uppercase tracking-widest" style={{ color: "#c8a0b0", fontWeight: 600 }}>
          </p>
          <p
            className="text-2xl md:text-3xl leading-relaxed"
            style={{ color: "#f0e8ec", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
          >
            {todayPrompt}
          </p>
        </section>

        {/* Response area */}
        {!alreadyAnsweredToday ? (
          <section className="space-y-4">
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={6}
              placeholder=""
              className="w-full rounded-2xl border p-4 text-lg resize-none transition-colors duration-500"
              style={{
                backgroundColor: "#2a2a2c",
                borderColor: "#3e3e40",
                color: "#e8e4e6",
                fontFamily: "Georgia, serif",
              }}
            />

            {/* Emotions */}
            <div>
              <p className="text-sm uppercase tracking-widest mb-3" style={{ color: "#c8a0b0", fontWeight: 600 }}>
                {language === "pl" ? "Co czujesz?" : "What do you feel?"}
              </p>
              <div className="flex flex-wrap gap-2">
                {EMOTIONS.map((emotion) => (
                  <button
                    key={emotion}
                    onClick={() => toggleEmotion(emotion)}
                    className="px-3 py-1.5 rounded-full text-sm tracking-wide transition-all duration-300"
                    style={{
                      backgroundColor: selectedEmotions.includes(emotion) ? "#c8a0b0" : "transparent",
                      color: selectedEmotions.includes(emotion) ? "#1c1c1e" : "#a0a0a2",
                      border: `1px solid ${selectedEmotions.includes(emotion) ? "#c8a0b0" : "#3e3e40"}`,
                      fontWeight: selectedEmotions.includes(emotion) ? 600 : 400,
                    }}
                  >
                    {language === "pl" ? EMOTIONS_PL[emotion] || emotion : emotion}
                  </button>
                ))}
              </div>
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving || !response.trim()}
              className="w-full py-3 rounded-xl text-sm tracking-widest uppercase transition-all"
              style={{
                backgroundColor: response.trim() ? "#c8a0b0" : "#3e3e40",
                color: response.trim() ? "#1c1c1e" : "#808082",
                fontWeight: 600,
                opacity: response.trim() ? 1 : 0.5,
              }}
            >
              {saving ? "..." : saved ? (language === "pl" ? "Zapisano" : "Saved") : (language === "pl" ? "Zapisz" : "Save")}
            </button>
          </section>
        ) : (
          <div className="text-center py-4">
            <p className="text-base" style={{ color: "#a0a0a2" }}>
              {language === "pl" ? "Dzisiaj juz odpowiedzialas. Wracaj jutro." : "You already answered today. Come back tomorrow."}
            </p>
          </div>
        )}

        {/* Divider */}
        {entries.length > 0 && (
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-16" style={{ background: "#3e3e40" }} />
            <span className="text-xs" style={{ color: "#808082", opacity: 0.6 }}>&#9671;</span>
            <div className="h-px w-16" style={{ background: "#3e3e40" }} />
          </div>
        )}

        {/* Past entries */}
        {entries.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-base uppercase tracking-wider" style={{ color: "#e0a8b8", fontWeight: 600 }}>
              {language === "pl" ? "Twoje wpisy" : "Your entries"}
            </h2>
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border p-4 transition-colors duration-500"
                style={{ backgroundColor: "#2a2a2c", borderColor: "#3e3e40" }}
              >
                <button
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  className="w-full text-left"
                >
                  <p className="text-sm mb-1" style={{ color: "#808082" }}>
                    {new Date(entry.created_at).toLocaleDateString(language === "pl" ? "pl-PL" : "en-GB", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                    {entry.moon_phase && ` \u00B7 ${entry.moon_phase}`}
                  </p>
                  <p className="text-base" style={{ color: "#f0e8ec", fontWeight: 500 }}>
                    {entry.prompt}
                  </p>
                </button>

                {expandedId === entry.id && (
                  <div className="mt-3 pt-3" style={{ borderTop: "1px solid #3e3e40" }}>
                    <p className="text-base leading-relaxed" style={{ color: "#d0d0d2" }}>
                      {entry.response}
                    </p>
                    {entry.emotions && entry.emotions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {entry.emotions.map((em) => (
                          <span key={em} className="px-2 py-0.5 rounded-full text-xs"
                            style={{ backgroundColor: "#3e3e40", color: "#d0d0d2" }}>
                            {language === "pl" ? EMOTIONS_PL[em] || em : em}
                          </span>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="mt-3 text-xs transition-opacity hover:opacity-70"
                      style={{ color: "#808082" }}
                    >
                      {deletingId === entry.id ? "..." : (language === "pl" ? "Usun" : "Delete")}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

      </main>
    </div>
  );
}