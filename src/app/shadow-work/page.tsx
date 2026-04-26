"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getMoonPhase, getDailyInsight, getSeasonalShadowPrompt, getSeason } from "@/lib/moon";
import { useLanguage } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import { getEffectivePerms } from "@/lib/effective-perms";

const EMOTIONS = [
  "anger", "fear", "sadness", "shame", "guilt",
  "confusion", "resistance", "grief", "anxiety", "numbness",
  "relief", "clarity", "discomfort", "longing", "frustration", "disappointment",
];

const EMOTIONS_PL: Record<string, string> = {
  anger: "złość", fear: "strach", sadness: "smutek", shame: "wstyd",
  guilt: "poczucie winy", confusion: "zagubienie", resistance: "opór",
  grief: "żal", anxiety: "niepokój", numbness: "odrętwienie",
  relief: "ulga", clarity: "jasność", discomfort: "dyskomfort",
  longing: "tęsknota", frustration: "frustracja", disappointment: "rozczarowanie",
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

  const moonPhaseKey: Record<string, string> = {
    "New Moon": "moon_new",
    "Waxing Crescent": "moon_waxing_crescent",
    "First Quarter": "moon_first_quarter",
    "Waxing Gibbous": "moon_waxing_gibbous",
    "Full Moon": "moon_full",
    "Waning Gibbous": "moon_waning_gibbous",
    "Last Quarter": "moon_last_quarter",
    "Waning Crescent": "moon_waning_crescent",
  };
  const moon = getMoonPhase();

  const [response, setResponse] = useState("");
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editEmotions, setEditEmotions] = useState<string[]>([]);
  const [isPremium, setIsPremium] = useState(false);

  const todayPrompt = isPremium
    ? getSeasonalShadowPrompt(moon.phase, language)
    : getDailyInsight(moon.phase, language);
  const season = getSeason();
  const seasonLabel: Record<string, { en: string; pl: string }> = {
    spring: { en: "Spring", pl: "Wiosna" },
    summer: { en: "Summer", pl: "Lato" },
    autumn: { en: "Autumn", pl: "Jesień" },
    winter: { en: "Winter", pl: "Zima" },
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium, is_admin, admin_test_mode")
      .eq("id", user.id)
      .single();
    const { isPremium } = getEffectivePerms(profile);
    setIsPremium(isPremium);

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
    try { fetch("/api/check-entry-milestones", { method: "POST" }); } catch {}
    setTimeout(() => setSaved(false), 2000);
    loadEntries();
  };

  const handleEditSave = async (id: string) => {
    if (!editText.trim()) return;
    const supabase = createClient();
    await supabase.from("shadow_work_entries").update({
      response: editText.trim(),
      emotions: editEmotions,
    }).eq("id", id);
    setEditingId(null);
    loadEntries();
  };

  const toggleEditEmotion = (emotion: string) => {
    setEditEmotions((prev) =>
      prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion]
    );
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
    <div className="min-h-screen transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
      <header className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/dashboard")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
            ← {t("back")}
          </button>
          <div className="w-12" />
        </div>
        <h1
          className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3"
          style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
        >
          {language === "pl" ? "Praca z cieniem" : "Shadow Work"}
        </h1>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-16 space-y-8">

        {/* Workbook CTA */}
        <section className="text-center pt-2 pb-2">
          <button
            onClick={() => router.push("/shadow-work/workbook")}
            className="px-6 py-2.5 rounded-xl text-xs tracking-[0.2em] uppercase transition-all hover:opacity-80"
            style={{
              background: "linear-gradient(135deg, var(--color-plum), var(--color-mauve))",
              color: "var(--color-cream)",
              fontWeight: 600,
            }}
          >
            {language === "pl" ? "Workbook" : "Workbook"}
          </button>
          <p className="text-xs mt-2" style={{ color: "var(--color-mauve)", opacity: 0.6 }}>
            {language === "pl" ? "Twoja sesja jest zapisana. Możesz wrócić w dowolnym momencie." : "Your session is saved. Come back whenever you're ready."}
          </p>
        </section>

        {/* Today's prompt */}
        <section className="text-center space-y-4 pt-4">
          <p className="text-base uppercase tracking-widest" style={{ color: "var(--color-mauve)", fontWeight: 600 }}>
            {t((moonPhaseKey[moon.phase] || "moon_new") as TranslationKey)}
            {isPremium && (
              <span className="ml-2 text-xs tracking-wider" style={{ color: "var(--color-gold)" }}>
                · {seasonLabel[season]?.[language] || seasonLabel[season]?.en}
              </span>
            )}
          </p>
          <p
            className="text-2xl md:text-3xl leading-relaxed"
            style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
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
                backgroundColor: "var(--color-blush)",
                borderColor: "var(--color-dusty-rose)",
                color: "var(--color-dark)",
                fontFamily: "Georgia, serif",
              }}
            />

            {/* Emotions */}
            <div>
              <p className="text-sm uppercase tracking-widest mb-3" style={{ color: "var(--color-plum)", fontWeight: 600 }}>
                {language === "pl" ? "Co czujesz?" : "What do you feel?"}
              </p>
              <div className="flex flex-wrap gap-2">
                {EMOTIONS.map((emotion) => (
                  <button
                    key={emotion}
                    onClick={() => toggleEmotion(emotion)}
                    className="px-3 py-1.5 rounded-full text-sm tracking-wide transition-all duration-300"
                    style={{
                      backgroundColor: selectedEmotions.includes(emotion) ? "var(--color-plum)" : "transparent",
                      color: selectedEmotions.includes(emotion) ? "var(--color-cream)" : "var(--color-mauve)",
                      border: `1px solid ${selectedEmotions.includes(emotion) ? "var(--color-plum)" : "var(--color-dusty-rose)"}`,
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
                backgroundColor: response.trim() ? "var(--color-plum)" : "var(--color-dusty-rose)",
                color: response.trim() ? "var(--color-cream)" : "var(--color-mauve)",
                fontWeight: 600,
                opacity: response.trim() ? 1 : 0.5,
              }}
            >
              {saving ? "..." : saved ? (language === "pl" ? "Zapisano" : "Saved") : (language === "pl" ? "Zapisz" : "Save")}
            </button>
          </section>
        ) : (
          <div className="text-center py-4">
            <p className="text-base" style={{ color: "var(--color-mauve)" }}>
              {language === "pl" ? "Dzisiaj juz odpowiedzialas. Wracaj jutro." : "You already answered today. Come back tomorrow."}
            </p>
          </div>
        )}

        {/* Divider */}
        {entries.length > 0 && (
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
            <span className="text-xs" style={{ color: "var(--color-dusty-rose)", opacity: 0.6 }}>&#9671;</span>
            <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
          </div>
        )}

        {/* Past entries */}
        {entries.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-base uppercase tracking-wider" style={{ color: "var(--color-plum)", fontWeight: 600 }}>
              {language === "pl" ? "Twoje wpisy" : "Your entries"}
            </h2>
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border p-4 transition-colors duration-500"
                style={{ backgroundColor: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}
              >
                <button
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  className="w-full text-left"
                >
                  <p className="text-sm mb-1" style={{ color: "var(--color-mauve)" }}>
                    {new Date(entry.created_at).toLocaleDateString(language === "pl" ? "pl-PL" : "en-GB", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                    {entry.moon_phase && ` \u00B7 ${entry.moon_phase}`}
                  </p>
                  <p className="text-base" style={{ color: "var(--color-dark)", fontWeight: 500 }}>
                    {entry.prompt}
                  </p>
                </button>

                {expandedId === entry.id && (
                  <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--color-dusty-rose)" }}>
                    {editingId === entry.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={4}
                          className="w-full rounded-xl border p-3 text-base resize-none"
                          style={{ backgroundColor: "var(--color-blush)", borderColor: "var(--color-dusty-rose)", color: "var(--color-dark)", fontFamily: "Georgia, serif" }}
                        />
                        <div className="flex flex-wrap gap-1.5">
                          {EMOTIONS.map((em) => (
                            <button key={em} onClick={() => toggleEditEmotion(em)}
                              className="px-2 py-0.5 rounded-full text-xs transition-all"
                              style={{
                                backgroundColor: editEmotions.includes(em) ? "var(--color-plum)" : "transparent",
                                color: editEmotions.includes(em) ? "var(--color-cream)" : "var(--color-mauve)",
                                border: `1px solid ${editEmotions.includes(em) ? "var(--color-plum)" : "var(--color-dusty-rose)"}`,
                              }}>
                              {language === "pl" ? EMOTIONS_PL[em] || em : em}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleEditSave(entry.id)}
                            className="px-4 py-1.5 rounded-lg text-xs"
                            style={{ backgroundColor: "var(--color-plum)", color: "var(--color-cream)" }}>
                            {language === "pl" ? "Zapisz" : "Save"}
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="px-4 py-1.5 rounded-lg text-xs"
                            style={{ color: "var(--color-mauve)" }}>
                            {language === "pl" ? "Anuluj" : "Cancel"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-base leading-relaxed" style={{ color: "var(--color-dark)" }}>
                          {entry.response}
                        </p>
                        {entry.emotions && entry.emotions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {entry.emotions.map((em) => (
                              <span key={em} className="px-2 py-0.5 rounded-full text-xs"
                                style={{ backgroundColor: "var(--color-plum)", color: "var(--color-cream)" }}>
                                {language === "pl" ? EMOTIONS_PL[em] || em : em}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-3 mt-3">
                          <button
                            onClick={() => { setEditingId(entry.id); setEditText(entry.response); setEditEmotions(entry.emotions || []); }}
                            className="text-xs transition-opacity hover:opacity-70"
                            style={{ color: "var(--color-mauve)" }}>
                            {language === "pl" ? "Edytuj" : "Edit"}
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="text-xs transition-opacity hover:opacity-70"
                            style={{ color: "var(--color-dusty-rose)" }}>
                            {deletingId === entry.id ? "..." : (language === "pl" ? "Usun" : "Delete")}
                          </button>
                        </div>
                      </>
                    )}
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