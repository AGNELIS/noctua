"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SunIcon, CloudIcon, SphereIcon, BarbellIcon, StarIcon } from "@/components/NoctuaIcons";

const MOODS = [
  { value: "radiant", icon: <SunIcon size={20} />, label: "Radiant" },
  { value: "calm", icon: <CloudIcon size={20} />, label: "Calm" },
  { value: "neutral", icon: <SphereIcon size={20} />, label: "Neutral" },
  { value: "heavy", icon: <BarbellIcon size={20} />, label: "Heavy" },
  { value: "stormy", icon: <StarIcon size={20} />, label: "Stormy" },
];

export default function NewJournalEntry() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [moods, setMoods] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleMood = (value: string) => {
    setMoods((prev) => prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value]);
  };

  const handleSave = async () => {
    if (!content.trim()) { setError("Please write something before saving."); return; }
    setSaving(true); setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { error: insertError } = await supabase.from("journal_entries").insert({
      user_id: user.id, title: title.trim() || null, content: content.trim(),
      mood: moods, entry_date: new Date().toISOString().split("T")[0],
    });
    if (insertError) { setError(insertError.message); setSaving(false); }
    else { router.push("/journal"); }
  };

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ backgroundColor: "var(--color-cream)" }}>
      <header className="flex items-center justify-between px-6 py-5">
        <button onClick={() => router.push("/journal")} className="text-xs tracking-wide" style={{ color: "var(--color-mauve)" }}>← Cancel</button>
        <h1 className="text-sm tracking-[0.35em] uppercase font-light" style={{ color: "var(--color-plum)" }}>New Entry</h1>
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 rounded-lg text-sm tracking-wide transition-colors disabled:opacity-50"
          style={{ background: "var(--color-plum)", color: "var(--color-cream)" }}>
          {saving ? "Saving..." : "Save"}
        </button>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-12 space-y-6">
        {error && <p className="text-sm text-center" style={{ color: "#c45050" }}>{error}</p>}

        <p className="text-xs text-center tracking-wide" style={{ color: "var(--color-dusty-rose)" }}>
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div className="flex justify-center gap-2 flex-wrap">
          {MOODS.map((m) => (
            <button key={m.value} onClick={() => toggleMood(m.value)}
              className="px-3 py-1.5 rounded-full text-xs transition-all border"
              style={{
                background: moods.includes(m.value) ? "var(--color-blush)" : "transparent",
                borderColor: moods.includes(m.value) ? "var(--color-mauve)" : "var(--color-dusty-rose)",
                color: moods.includes(m.value) ? "var(--color-plum)" : "var(--color-mauve)",
              }}><span className="inline-flex items-center gap-1.5">{m.icon}{m.label}</span></button>
          ))}
        </div>

        <input type="text" placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full text-lg font-light text-center outline-none transition-colors duration-500"
          style={{ color: "var(--color-dark)", backgroundColor: "var(--color-blush)", borderRadius: "12px", padding: "12px", fontFamily: "Georgia, 'Times New Roman', serif" }} />

        <textarea placeholder="What's alive in you today?" value={content} onChange={(e) => setContent(e.target.value)} rows={12}
          className="w-full text-sm leading-relaxed outline-none resize-none transition-colors duration-500"
          style={{ color: "var(--color-dark)", backgroundColor: "var(--color-blush)", borderRadius: "12px", padding: "16px" }} />
      </main>
    </div>
  );
}