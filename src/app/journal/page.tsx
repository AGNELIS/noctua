"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n";
import { SunIcon, CloudIcon, SphereIcon, BarbellIcon, StarIcon } from "@/components/NoctuaIcons";
import { getEffectivePerms } from "@/lib/effective-perms";

type JournalEntry = {
  id: string;
  title: string | null;
  content: string;
  mood: string[];
  entry_date: string;
  is_favorite: boolean;
  created_at: string;
};

const MOOD_ICONS: Record<string, { icon: React.ReactNode; label: string }> = {
  radiant: { icon: <SunIcon size={18} />, label: "Radiant" },
  calm: { icon: <CloudIcon size={18} />, label: "Calm" },
  neutral: { icon: <SphereIcon size={18} />, label: "Neutral" },
  heavy: { icon: <BarbellIcon size={18} />, label: "Heavy" },
  stormy: { icon: <StarIcon size={18} />, label: "Stormy" },
};

function ConfirmModal({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(42, 26, 40, 0.4)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-sm p-6 rounded-2xl space-y-5 transition-colors duration-500"
        style={{
          backgroundColor: "var(--color-cream)",
          border: "1px solid var(--color-dusty-rose)",
          boxShadow: "0 8px 32px rgba(42, 26, 40, 0.15)",
        }}
      >
        <p className="text-center text-base leading-relaxed" style={{ color: "var(--color-dark)" }}>
          {message}
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl text-sm transition-all border"
            style={{ borderColor: "var(--color-dusty-rose)", color: "var(--color-mauve)", background: "var(--color-blush)", fontWeight: 500 }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 rounded-xl text-sm transition-all"
            style={{ background: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function JournalPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showTeaser, setShowTeaser] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    loadEntries();
    if (typeof window !== "undefined" && window.location.search.includes("saved=true")) setShowTeaser(true);
  }, []);

  const loadEntries = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("is_premium, is_admin, admin_test_mode").eq("id", user.id).single();
      const { isPremium } = getEffectivePerms(profile);
      setIsPremium(isPremium);
    }
    const { data } = await supabase
      .from("journal_entries")
      .select("*")
      .order("entry_date", { ascending: false });
    setEntries(data || []);
    setLoading(false);
  };

  const toggleFavorite = async (id: string, current: boolean) => {
    const supabase = createClient();
    await supabase.from("journal_entries").update({ is_favorite: !current }).eq("id", id);
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, is_favorite: !current } : e)));
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const supabase = createClient();
    await supabase.from("journal_entries").delete().eq("id", deleteId);
    setEntries((prev) => prev.filter((e) => e.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <div className="min-h-screen relative transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
      {deleteId && <ConfirmModal message={language === "pl" ? "Na pewno chcesz usunac ten wpis?" : "Are you sure you want to delete this entry?"} onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />}

      <header className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/dashboard")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>← {t("back")}</button>
          <button onClick={() => router.push("/journal/new")} className="text-sm tracking-wide px-3 py-1.5 rounded-lg transition-colors" style={{ background: "var(--color-blush)", color: "var(--color-plum)", fontWeight: 500 }}>+ {t("journal_new")}</button>
        </div>
        <h1 className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>{t("journal_title")}</h1>
      </header>

      {/* Paywall teaser after saving entry */}
        {showTeaser && !isPremium && entries.length >= 3 && (
          <div className="max-w-xl mx-auto px-6 pt-4">
            <div className="rounded-2xl border p-5 space-y-3" style={{ background: "var(--color-blush)", borderColor: "var(--color-mauve)" }}>
              <p className="text-base leading-relaxed" style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                {language === "pl"
                  ? `Masz ${entries.length} wpisów. Mogę pokazać ci jakie wzorce się wyłaniają.`
                  : `You have ${entries.length} entries. I can show you what patterns are emerging.`}
              </p>
              <div className="flex gap-2">
                <button onClick={() => router.push("/premium")} className="px-4 py-2 rounded-xl text-xs tracking-wide" style={{ background: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}>
                  {language === "pl" ? "Odblokuj wzorce" : "Unlock patterns"}
                </button>
                <button onClick={() => setShowTeaser(false)} className="px-4 py-2 rounded-xl text-xs" style={{ color: "var(--color-mauve)" }}>
                  {language === "pl" ? "Nie teraz" : "Not now"}
                </button>
              </div>
            </div>
          </div>
        )}

      <main className="max-w-xl mx-auto px-6 pt-4 pb-12">
        {loading ? (
          <p className="text-center text-sm pt-20" style={{ color: "var(--color-dusty-rose)" }}>{t("loading")}</p>
        ) : entries.length === 0 ? (
          <div className="text-center pt-20 space-y-4">
            <p className="text-4xl">♡</p>
            <p className="text-base" style={{ color: "var(--color-dark)", fontWeight: 500 }}>{t("journal_empty")}</p>
            <p className="text-sm" style={{ color: "var(--color-mauve)" }}>{language === "pl" ? "Napisz swoja pierwsza refleksje." : "Begin by writing your first reflection."}</p>
            <button onClick={() => router.push("/journal/new")} className="mt-4 px-6 py-2.5 rounded-xl text-sm transition-all" style={{ background: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}>{t("journal_new")}</button>
          </div>
        ) : (
          <div className="pt-4">
            {(() => {
              const groups: { [key: string]: typeof entries } = {};
              entries.forEach((entry) => {
                const d = new Date(entry.entry_date);
                const monthName = d.toLocaleDateString(language === "pl" ? "pl-PL" : "en-GB", { month: "long" });
                const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                const key = `${capitalizedMonth} ${d.getFullYear()}`;
                if (!groups[key]) groups[key] = [];
                groups[key].push(entry);
              });
              return Object.entries(groups).map(([monthLabel, monthEntries], groupIdx) => (
                <div key={monthLabel}>
                  <h2 className={`text-base ${groupIdx === 0 ? "mb-3" : "mt-8 mb-3"}`} style={{ color: "var(--color-mauve)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}>
                    {monthLabel}
                  </h2>
                  <div className="space-y-3">
                    {monthEntries.map((entry) => (
                      <div key={entry.id} className="p-5 rounded-2xl border transition-all shadow-sm" style={{ background: "var(--color-blush)", borderColor: "var(--color-mauve)" }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 cursor-pointer" onClick={() => router.push(`/journal/${entry.id}/edit`)}>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-sm" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
                                {new Date(entry.entry_date).toLocaleDateString(language === "pl" ? "pl-PL" : "en-GB", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                              {entry.mood?.map((m) => (<span key={m} className="inline-flex items-center gap-1.5 text-sm" style={{ color: "var(--color-plum)", fontWeight: 500 }}>{MOOD_ICONS[m]?.icon}{MOOD_ICONS[m]?.label || m}</span>))}
                            </div>
                            {entry.title && (
                              <h3 className="text-base mb-1" style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>{entry.title}</h3>
                            )}
                            <p className="text-base leading-relaxed line-clamp-2" style={{ color: "var(--color-dark)" }}>{entry.content}</p>
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <button onClick={() => toggleFavorite(entry.id, entry.is_favorite)} className="text-lg leading-none" style={{ color: entry.is_favorite ? "var(--color-plum)" : "var(--color-dusty-rose)" }}>{entry.is_favorite ? "♥" : "♡"}</button>
                            <button onClick={() => setDeleteId(entry.id)} className="text-sm leading-none" style={{ color: "var(--color-dusty-rose)" }}>✕</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </main>
    </div>
  );
}