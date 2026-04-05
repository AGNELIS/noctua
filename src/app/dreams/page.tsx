"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n";
import { SunIcon, GreenSphereIcon, SphereIcon, SpikyIcon, MaskIcon, DropIcon, StarIcon } from "@/components/NoctuaIcons";

type DreamEntry = {
  id: string;
  title: string | null;
  content: string;
  lucidity: number | null;
  emotional_tone: string[];
  symbols: string[];
  is_recurring: boolean;
  is_favorite: boolean;
  dream_date: string;
};

const TONE_ICONS: Record<string, { icon: React.ReactNode; label: string }> = {
  joyful: { icon: <SunIcon size={18} />, label: "Joyful" },
  peaceful: { icon: <GreenSphereIcon size={18} />, label: "Peaceful" },
  neutral: { icon: <SphereIcon size={18} />, label: "Neutral" },
  anxious: { icon: <SpikyIcon size={18} />, label: "Anxious" },
  fearful: { icon: <MaskIcon size={18} />, label: "Fearful" },
  sad: { icon: <DropIcon size={18} />, label: "Sad" },
  angry: { icon: <StarIcon size={18} />, label: "Angry" },
};

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: "rgba(42, 26, 40, 0.4)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm p-6 rounded-2xl space-y-5" style={{ backgroundColor: "var(--color-cream)", border: "1px solid var(--color-dusty-rose)", boxShadow: "0 8px 32px rgba(42, 26, 40, 0.15)" }}>
        <p className="text-center text-base leading-relaxed" style={{ color: "var(--color-dark)" }}>{message}</p>
        <div className="flex justify-center gap-3">
          <button onClick={onCancel} className="px-6 py-2.5 rounded-xl text-sm transition-all border" style={{ borderColor: "var(--color-dusty-rose)", color: "var(--color-mauve)", background: "var(--color-blush)", fontWeight: 500 }}>Cancel</button>
          <button onClick={onConfirm} className="px-6 py-2.5 rounded-xl text-sm transition-all" style={{ background: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function DreamsPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [entries, setEntries] = useState<DreamEntry[]>([]);
  const [analysedIds, setAnalysedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [fromShop, setFromShop] = useState(false);
  useEffect(() => {
    loadEntries();
    if (typeof window !== "undefined" && window.location.search.includes("from=shop")) setFromShop(true);
  }, []);

  const loadEntries = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("dream_entries").select("*").order("dream_date", { ascending: false });
    const { data: analyses } = await supabase.from("dream_analyses").select("dream_entry_id");
    setAnalysedIds(new Set((analyses || []).map((a: { dream_entry_id: string }) => a.dream_entry_id)));
    setEntries(data || []);
    setLoading(false);
  };

  const toggleFavorite = async (id: string, current: boolean) => {
    const supabase = createClient();
    await supabase.from("dream_entries").update({ is_favorite: !current }).eq("id", id);
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, is_favorite: !current } : e)));
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const supabase = createClient();
    await supabase.from("dream_entries").delete().eq("id", deleteId);
    setEntries((prev) => prev.filter((e) => e.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <div className="min-h-screen relative transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
      {deleteId && <ConfirmModal message={language === "pl" ? "Na pewno chcesz usunac ten sen?" : "Are you sure you want to delete this dream?"} onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />}

      <header className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>← {t("back")}</button>
            {fromShop && (
              <button onClick={() => router.push("/shop")} className="text-sm tracking-wide" style={{ color: "var(--color-gold)", fontWeight: 500 }}>
                {language === "pl" ? "Wróć do sklepu" : "Back to shop"}
              </button>
            )}
          </div>
          <button onClick={() => router.push("/dreams/new")} className="text-sm tracking-wide px-3 py-1.5 rounded-lg transition-colors" style={{ background: "var(--color-blush)", color: "var(--color-plum)", fontWeight: 500 }}>+ {t("dreams_new")}</button>
        </div>
        <h1 className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>{t("dreams_title")}</h1>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-12">
        {!loading && entries.length >= 3 && (
          <section className="text-center pt-2 pb-4">
            <button
              onClick={() => router.push("/dreams/workbook")}
              className="px-6 py-2.5 rounded-xl text-xs tracking-[0.2em] uppercase transition-all hover:opacity-80"
              style={{
                background: "linear-gradient(135deg, var(--color-plum), var(--color-mauve))",
                color: "var(--color-cream)",
                fontWeight: 600,
              }}
            >
              {language === "pl" ? "Rozpocznij Workbook" : "Begin Workbook"}
            </button>
          </section>
        )}
        {loading ? (
          <p className="text-center text-sm pt-20" style={{ color: "var(--color-dusty-rose)" }}>{t("loading")}</p>
        ) : entries.length === 0 ? (
          <div className="text-center pt-20 space-y-4">
            <p className="text-4xl">☽</p>
            <p className="text-base" style={{ color: "var(--color-dark)", fontWeight: 500 }}>{t("dreams_empty")}</p>
            <p className="text-sm" style={{ color: "var(--color-mauve)" }}>{language === "pl" ? "Zapisz przeslania nocy." : "Capture the messages of the night."}</p>
            <button onClick={() => router.push("/dreams/new")} className="mt-4 px-6 py-2.5 rounded-xl text-sm transition-all" style={{ background: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}>{t("dreams_new")}</button>
          </div>
        ) : (
          <div className="space-y-3 pt-4">
            {entries.map((entry) => (
              <div key={entry.id} className="p-4 rounded-2xl border transition-all" style={{ background: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 cursor-pointer" onClick={() => router.push(`/dreams/${entry.id}/edit`)}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs" style={{ color: "var(--color-mauve)" }}>
                        {new Date(entry.dream_date).toLocaleDateString(language === "pl" ? "pl-PL" : "en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      {entry.emotional_tone?.map((t) => (<span key={t} className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--color-plum)" }}>{TONE_ICONS[t]?.icon}{TONE_ICONS[t]?.label || t}</span>))}
                      {entry.is_recurring && (<span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "var(--color-blush)", color: "var(--color-plum)" }}>{language === "pl" ? "powtarzający" : "recurring"}</span>)}
                      {analysedIds.has(entry.id)
                        ? (<span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "var(--color-plum)", color: "var(--color-cream)" }}>{language === "pl" ? "przeanalizowany" : "analysed"}</span>)
                        : (<span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "var(--color-gold)", color: "var(--color-dark)" }}>{language === "pl" ? "do analizy" : "ready to analyse"}</span>)
                      }
                      {entry.lucidity && (<span className="text-xs" style={{ color: "var(--color-mauve)" }}>{"◆".repeat(entry.lucidity)}{"◇".repeat(5 - entry.lucidity)}</span>)}
                    </div>
                    {entry.title && (<h3 className="text-base mb-1" style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>{entry.title}</h3>)}
                    <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "var(--color-mauve)" }}>{entry.content}</p>
                    {entry.symbols?.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {entry.symbols.map((s) => (<span key={s} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--color-blush)", color: "var(--color-plum)" }}>{s}</span>))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => toggleFavorite(entry.id, entry.is_favorite)} className="text-lg leading-none" style={{ color: entry.is_favorite ? "var(--color-plum)" : "var(--color-dusty-rose)" }}>{entry.is_favorite ? "♥" : "♡"}</button>
                    <button onClick={() => setDeleteId(entry.id)} className="text-sm leading-none" style={{ color: "var(--color-dusty-rose)" }}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}