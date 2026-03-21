"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MOODS = [
  { value: "radiant", label: "☀️ Radiant" },
  { value: "calm", label: "🌿 Calm" },
  { value: "neutral", label: "○ Neutral" },
  { value: "heavy", label: "🌧 Heavy" },
  { value: "stormy", label: "⛈ Stormy" },
];

export default function EditJournalEntry() {
  const router = useRouter();
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
      const { data } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setTitle(data.title || "");
        setContent(data.content || "");
        setMoods(data.mood || []);
        setEntryDate(data.entry_date || "");
      }
      setLoading(false);
    };
    loadEntry();
  }, [id]);

  const toggleMood = (value: string) => {
    setMoods((prev) =>
      prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value]
    );
  };

  const handleSave = async () => {
    if (!content.trim()) {
      setError("Please write something before saving.");
      return;
    }
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("journal_entries")
      .update({
        title: title.trim() || null,
        content: content.trim(),
        mood: moods,
      })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
    } else {
      router.push("/journal");
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(to bottom, #faf5f0, #f5ede6)" }}
      >
        <p className="text-sm" style={{ color: "#9b8a7a" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(to bottom, #faf5f0, #f5ede6, #f0e6de)",
      }}
    >
      <header className="flex items-center justify-between px-6 py-5">
        <button
          onClick={() => router.push("/journal")}
          className="text-xs tracking-wide"
          style={{ color: "#9b8a7a" }}
        >
          ← Back
        </button>
        <h1
          className="text-sm tracking-[0.35em] uppercase font-light"
          style={{ color: "#6b5270" }}
        >
          Edit Entry
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs tracking-wide px-3 py-1.5 rounded-lg text-white transition-colors disabled:opacity-50"
          style={{ background: "#6b5270" }}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-12 space-y-6">
        {error && (
          <p className="text-sm text-center" style={{ color: "#c45050" }}>
            {error}
          </p>
        )}

        <p className="text-xs text-center tracking-wide" style={{ color: "#9b8a7a" }}>
          {entryDate &&
            new Date(entryDate).toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
        </p>

        <div className="flex justify-center gap-2 flex-wrap">
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => toggleMood(m.value)}
              className="px-3 py-1.5 rounded-full text-xs transition-all border"
              style={{
                background: moods.includes(m.value)
                  ? "rgba(107,82,112,0.15)"
                  : "rgba(255,255,255,0.4)",
                borderColor: moods.includes(m.value)
                  ? "rgba(107,82,112,0.3)"
                  : "rgba(212,181,199,0.3)",
                color: moods.includes(m.value) ? "#3d2e4a" : "#8a7a6a",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent text-lg font-light text-center outline-none placeholder:text-[#c4b0a0]"
          style={{
            color: "#3d2e4a",
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        />

        <textarea
          placeholder="What's alive in you today?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          className="w-full bg-transparent text-sm leading-relaxed outline-none resize-none placeholder:text-[#c4b0a0]"
          style={{ color: "#4a3a50" }}
        />
      </main>
    </div>
  );
}