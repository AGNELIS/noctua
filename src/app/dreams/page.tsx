"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

const TONE_LABELS: Record<string, string> = {
  joyful: "✨ Joyful",
  peaceful: "🕊 Peaceful",
  neutral: "○ Neutral",
  anxious: "😰 Anxious",
  fearful: "🌑 Fearful",
  sad: "🌧 Sad",
  angry: "🔥 Angry",
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
        className="w-full max-w-sm p-6 rounded-2xl space-y-5"
        style={{
          background: "linear-gradient(to bottom, #faf7f5, #f5ede6)",
          border: "1px solid rgba(212,181,199,0.3)",
          boxShadow: "0 8px 32px rgba(42, 26, 40, 0.15)",
        }}
      >
        <p className="text-center text-base leading-relaxed" style={{ color: "#2a1a28" }}>
          {message}
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl text-sm transition-all border"
            style={{
              borderColor: "rgba(212,181,199,0.4)",
              color: "#5a3a5a",
              background: "rgba(255,255,255,0.5)",
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 rounded-xl text-sm transition-all"
            style={{ background: "#6b5270", color: "#ffffff", fontWeight: 600 }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DreamsPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<DreamEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { loadEntries(); }, []);

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

  const confirmDelete = async () => {
    if (!deleteId) return;
    const supabase = createClient();
    await supabase.from("dream_entries").delete().eq("id", deleteId);
    setEntries((prev) => prev.filter((e) => e.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: "linear-gradient(to bottom, #f5f0fa, #f0eaf5, #ebe4f0)",
      }}
    >
      {deleteId && (
        <ConfirmModal
          message="Are you sure you want to delete this dream?"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      <header className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm tracking-wide"
            style={{ color: "#5a3a5a", fontWeight: 500 }}
          >
            ← Back
          </button>
          <button
            onClick={() => router.push("/dreams/new")}
            className="text-sm tracking-wide px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background: "rgba(107,94,139,0.1)",
              color: "#5a3a5a",
              fontWeight: 500,
            }}
          >
            + New
          </button>
        </div>
        <h1
          className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3"
          style={{
            color: "#4A2545",
            fontFamily: "'Antic Didone', Georgia, serif",
            fontWeight: 700,
          }}
        >
          Dream Journal
        </h1>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-12">
        {loading ? (
          <p className="text-center text-sm pt-20" style={{ color: "#9b8a9e" }}>
            Loading...
          </p>
        ) : entries.length === 0 ? (
          <div className="text-center pt-20 space-y-4">
            <p className="text-4xl">☽</p>
            <p className="text-base" style={{ color: "#3d2e4a", fontWeight: 500 }}>
              No dreams recorded yet.
            </p>
            <p className="text-sm" style={{ color: "#5a4a5a" }}>
              Capture the messages of the night.
            </p>
            <button
              onClick={() => router.push("/dreams/new")}
              className="mt-4 px-6 py-2.5 rounded-xl text-sm transition-all"
              style={{ background: "#6b5270", color: "#ffffff", fontWeight: 600 }}
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
                      <span className="text-xs" style={{ color: "#7a6a7a" }}>
                        {new Date(entry.dream_date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {entry.emotional_tone?.map((t) => (
                        <span key={t} className="text-xs" style={{ color: "#5a4a6a" }}>
                          {TONE_LABELS[t] || t}
                        </span>
                      ))}
                      {entry.is_recurring && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{ background: "rgba(155,142,196,0.15)", color: "#5a4a6a" }}
                        >
                          recurring
                        </span>
                      )}
                      {entry.lucidity && (
                        <span className="text-xs" style={{ color: "#7a6a7a" }}>
                          {"◆".repeat(entry.lucidity)}{"◇".repeat(5 - entry.lucidity)}
                        </span>
                      )}
                    </div>
                    {entry.title && (
                      <h3
                        className="text-base mb-1"
                        style={{
                          color: "#2a1a28",
                          fontFamily: "'Cormorant Garamond', Georgia, serif",
                          fontWeight: 600,
                        }}
                      >
                        {entry.title}
                      </h3>
                    )}
                    <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "#4a3a4a" }}>
                      {entry.content}
                    </p>
                    {entry.symbols?.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {entry.symbols.map((s) => (
                          <span
                            key={s}
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(155,142,196,0.12)", color: "#5a4a6a" }}
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
                      style={{ color: entry.is_favorite ? "#6b5270" : "#c4b0c4" }}
                    >
                      {entry.is_favorite ? "♥" : "♡"}
                    </button>
                    <button
                      onClick={() => setDeleteId(entry.id)}
                      className="text-sm leading-none"
                      style={{ color: "#c49bb8" }}
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