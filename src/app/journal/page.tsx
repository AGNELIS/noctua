"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type JournalEntry = {
  id: string;
  title: string | null;
  content: string;
  mood: string[];
  entry_date: string;
  is_favorite: boolean;
  created_at: string;
};

const MOOD_LABELS: Record<string, string> = {
  radiant: "☀️ Radiant",
  calm: "🌿 Calm",
  neutral: "○ Neutral",
  heavy: "🌧 Heavy",
  stormy: "⛈ Stormy",
};

export default function JournalPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("journal_entries")
      .select("*")
      .order("entry_date", { ascending: false });
    setEntries(data || []);
    setLoading(false);
  };

  const toggleFavorite = async (id: string, current: boolean) => {
    const supabase = createClient();
    await supabase
      .from("journal_entries")
      .update({ is_favorite: !current })
      .eq("id", id);
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, is_favorite: !current } : e))
    );
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    const supabase = createClient();
    await supabase.from("journal_entries").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: "linear-gradient(to bottom, #faf5f0, #f5ede6, #f0e6de)",
      }}
    >
      <header className="flex items-center justify-between px-6 py-5">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-xs tracking-wide"
          style={{ color: "#9b8a7a" }}
        >
          ← Back
        </button>
        <h1
          className="text-sm tracking-[0.35em] uppercase font-light"
          style={{ color: "#6b5270" }}
        >
          Journal
        </h1>
        <button
          onClick={() => router.push("/journal/new")}
          className="text-xs tracking-wide px-3 py-1.5 rounded-lg transition-colors"
          style={{ background: "rgba(107,82,112,0.1)", color: "#6b5270" }}
        >
          + New
        </button>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-12">
        {loading ? (
          <p className="text-center text-sm pt-20" style={{ color: "#9b8a7a" }}>
            Loading...
          </p>
        ) : entries.length === 0 ? (
          <div className="text-center pt-20 space-y-4">
            <p className="text-4xl">✦</p>
            <p className="text-sm" style={{ color: "#7a6580" }}>
              Your journal is empty.
            </p>
            <p className="text-xs" style={{ color: "#9b8a7a" }}>
              Begin by writing your first reflection.
            </p>
            <button
              onClick={() => router.push("/journal/new")}
              className="mt-4 px-6 py-2.5 rounded-xl text-sm text-white transition-all"
              style={{ background: "#6b5270" }}
            >
              Write first entry
            </button>
          </div>
        ) : (
          <div className="space-y-3 pt-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="p-4 rounded-2xl border transition-all"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  borderColor: "rgba(212,181,199,0.3)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => router.push(`/journal/${entry.id}/edit`)}
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs" style={{ color: "#9b8a7a" }}>
                        {new Date(entry.entry_date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {entry.mood && entry.mood.length > 0 && entry.mood.map((m) => (
                        <span key={m} className="text-xs" style={{ color: "#8b5e7c" }}>
                          {MOOD_LABELS[m] || m}
                        </span>
                      ))}
                    </div>
                    {entry.title && (
                      <h3
                        className="text-sm font-medium mb-1"
                        style={{ color: "#3d2e4a" }}
                      >
                        {entry.title}
                      </h3>
                    )}
                    <p
                      className="text-xs leading-relaxed line-clamp-2"
                      style={{ color: "#6b5e6b" }}
                    >
                      {entry.content}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => toggleFavorite(entry.id, entry.is_favorite)}
                      className="text-lg leading-none"
                      title="Toggle favourite"
                    >
                      {entry.is_favorite ? "♥" : "♡"}
                    </button>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="text-xs leading-none"
                      style={{ color: "#c49b8e" }}
                      title="Delete"
                    >
                      ✕
                    </button>
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