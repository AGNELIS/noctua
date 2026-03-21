"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MOODS = [
  { value: "radiant", label: "☀️ Radiant" },
  { value: "calm", label: "🌿 Calm" },
  { value: "neutral", label: "○ Neutral" },
  { value: "heavy", label: "🌧 Heavy" },
  { value: "stormy", label: "⛈ Stormy" },
];

export default function NewJournalEntry() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [moods, setMoods] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error: insertError } = await supabase
      .from("journal_entries")
      .insert({
        user_id: user.id,
        title: title.trim() || null,
        content: content.trim(),
        mood: moods,
        entry_date: new Date().toISOString().split("T")[0],
      });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
    } else {
      router.push("/journal");
    }
  };

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
          ← Cancel
        </button>
        <h1
          className="text-sm tracking-[0.35em] uppercase font-light"
          style={{ color: "#6b5270" }}
        >
          New Entry
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-sm tracking-wide transition-colors disabled:opacity-50"
          style={{ color: "#ffffff", background: "#6b5270" }}
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
          {new Date().toLocaleDateString("en-GB", {
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