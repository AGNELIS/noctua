"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type DreamEntry = {
  id: string;
  title: string | null;
  content: string;
  lucidity: number | null;
  emotional_tone: string | null;
  symbols: string[];
  is_recurring: boolean;
  is_favorite: boolean;
  dream_date: string;
};

const TONE_LABELS: Record<string, string> = {
  joyful: "✨ Joyful",
  peaceful: "🕊 Peaceful",
  neutral: "○ Neutral",
  anxious: "😰 Anxious",
  fearful: "🌑 Fearful",
  sad: "🌧 Sad",
  angry: "🔥 Angry",
};

export default function DreamsPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<DreamEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("dream_entries")
      .select("*")
      .order("dream_date", { ascending: false });
    setEntries(data || []);
    setLoading(false);
  };

  const toggleFavorite = async (id: string, current: boolean) => {
    const supabase = createClient();
    await supabase
      .from("dream_entries")
      .update({ is_favorite: !current })
      .eq("id", id);
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, is_favorite: !current } : e))
    );
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this dream?")) return;
    const supabase = createClient();
    await supabase.from("dream_entries").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: "linear-gradient(to bottom, #f5f0fa, #f0eaf5, #ebe4f0)",
      }}
    >
      <header className="flex items-center justify-between px-6 py-5">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-xs tracking-wide"
          style={{ color: "#9b8a9e" }}
        >
          ← Back
        </button>
        <h1
          className="text-sm tracking-[0.35em] uppercase font-light"
          style={{ color: "#6b5e8b" }}
        >
          Dream Journal
        </h1>
        <button
          onClick={() => router.push("/dreams/new")}
          className="text-xs tracking-wide px-3 py-1.5 rounded-lg transition-colors"
          style={{ background: "rgba(107,94,139,0.1)", color: "#6b5e8b" }}
        >
          + New
        </button>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-12">
        {loading ? (
          <p className="text-center text-sm pt-20" style={{ color: "#9b8a9e" }}>
            Loading...
          </p>
        ) : entries.length === 0 ? (
          <div className="text-center pt-20 space-y-4">
            <p className="text-4xl">☽</p>
            <p className="text-sm" style={{ color: "#6b5e8b" }}>
              No dreams recorded yet.
            </p>
            <p className="text-xs" style={{ color: "#9b8a9e" }}>
              Capture the messages of the night.
            </p>
            <button
              onClick={() => router.push("/dreams/new")}
              className="mt-4 px-6 py-2.5 rounded-xl text-sm text-white transition-all"
              style={{ background: "#6b5e8b" }}
            >
              Record first dream
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
                  borderColor: "rgba(155,142,196,0.3)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => router.push(`/dreams/${entry.id}/edit`)}
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs" style={{ color: "#9b8a9e" }}>
                        {new Date(entry.dream_date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {entry.emotional_tone && (
                        <span className="text-xs" style={{ color: "#6b5e8b" }}>
                          {TONE_LABELS[entry.emotional_tone] || entry.emotional_tone}
                        </span>
                      )}
                      {entry.is_recurring && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{ background: "rgba(155,142,196,0.15)", color: "#6b5e8b" }}
                        >
                          recurring
                        </span>
                      )}
                      {entry.lucidity && (
                        <span className="text-xs" style={{ color: "#9b8a9e" }}>
                          {"◆".repeat(entry.lucidity)}{"◇".repeat(5 - entry.lucidity)}
                        </span>
                      )}
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
                      style={{ color: "#5e4e6b" }}
                    >
                      {entry.content}
                    </p>
                    {entry.symbols && entry.symbols.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {entry.symbols.map((s) => (
                          <span
                            key={s}
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: "rgba(155,142,196,0.12)",
                              color: "#6b5e8b",
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
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
                      style={{ color: "#c49bb8" }}
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