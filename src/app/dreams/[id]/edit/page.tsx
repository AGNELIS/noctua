"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TONES = [
  { value: "joyful", label: "✨ Joyful" },
  { value: "peaceful", label: "🕊 Peaceful" },
  { value: "neutral", label: "○ Neutral" },
  { value: "anxious", label: "😰 Anxious" },
  { value: "fearful", label: "🌑 Fearful" },
  { value: "sad", label: "🌧 Sad" },
  { value: "angry", label: "🔥 Angry" },
];

export default function EditDreamEntry() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tones, setTones] = useState<string[]>([]);
  const [lucidity, setLucidity] = useState(0);
  const [isRecurring, setIsRecurring] = useState(false);
  const [symbolInput, setSymbolInput] = useState("");
  const [symbols, setSymbols] = useState<string[]>([]);
  const [dreamDate, setDreamDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEntry = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("dream_entries")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setTitle(data.title || "");
        setContent(data.content || "");
        setTones(data.emotional_tone || []);
        setLucidity(data.lucidity || 0);
        setIsRecurring(data.is_recurring || false);
        setSymbols(data.symbols || []);
        setDreamDate(data.dream_date || "");
      }
      setLoading(false);
    };
    loadEntry();
  }, [id]);

  const toggleTone = (value: string) => {
    setTones((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  };

  const addSymbol = () => {
    const s = symbolInput.trim().toLowerCase();
    if (s && !symbols.includes(s)) {
      setSymbols([...symbols, s]);
    }
    setSymbolInput("");
  };

  const removeSymbol = (s: string) => {
    setSymbols(symbols.filter((x) => x !== s));
  };

  const handleSave = async () => {
    if (!content.trim()) {
      setError("Please describe your dream before saving.");
      return;
    }
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("dream_entries")
      .update({
        title: title.trim() || null,
        content: content.trim(),
        emotional_tone: tones,
        lucidity: lucidity || null,
        is_recurring: isRecurring,
        symbols: symbols,
      })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
    } else {
      router.push("/dreams");
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(to bottom, #f5f0fa, #f0eaf5)" }}
      >
        <p className="text-sm" style={{ color: "#9b8a9e" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(to bottom, #f5f0fa, #f0eaf5, #ebe4f0)",
      }}
    >
      <header className="flex items-center justify-between px-6 py-5">
        <button
          onClick={() => router.push("/dreams")}
          className="text-xs tracking-wide"
          style={{ color: "#9b8a9e" }}
        >
          ← Back
        </button>
        <h1
          className="text-sm tracking-[0.35em] uppercase font-light"
          style={{ color: "#6b5e8b" }}
        >
          Edit Dream
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-sm tracking-wide transition-colors disabled:opacity-50"
          style={{ color: "#ffffff", background: "#6b5e8b" }}
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

        <p className="text-xs text-center tracking-wide" style={{ color: "#9b8a9e" }}>
          {dreamDate &&
            new Date(dreamDate).toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
        </p>

        <div className="flex justify-center gap-2 flex-wrap">
          {TONES.map((t) => (
            <button
              key={t.value}
              onClick={() => toggleTone(t.value)}
              className="px-3 py-1.5 rounded-full text-xs transition-all border"
              style={{
                background: tones.includes(t.value)
                  ? "rgba(107,94,139,0.15)"
                  : "rgba(255,255,255,0.4)",
                borderColor: tones.includes(t.value)
                  ? "rgba(107,94,139,0.3)"
                  : "rgba(155,142,196,0.3)",
                color: tones.includes(t.value) ? "#3d2e4a" : "#8a7a8a",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="text-center space-y-1">
          <p className="text-xs" style={{ color: "#9b8a9e" }}>Lucidity</p>
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setLucidity(lucidity === n ? 0 : n)}
                className="text-lg transition-all"
                style={{ color: n <= lucidity ? "#6b5e8b" : "#d4d0dc" }}
              >
                ◆
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => setIsRecurring(!isRecurring)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-all"
            style={{
              background: isRecurring ? "rgba(107,94,139,0.15)" : "rgba(255,255,255,0.4)",
              borderColor: isRecurring ? "rgba(107,94,139,0.3)" : "rgba(155,142,196,0.3)",
              color: isRecurring ? "#3d2e4a" : "#8a7a8a",
            }}
          >
            {isRecurring ? "↻ Recurring dream" : "↻ Mark as recurring"}
          </button>
        </div>

        <input
          type="text"
          placeholder="Dream title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent text-lg font-light text-center outline-none placeholder:text-[#c4b0c8]"
          style={{ color: "#3d2e4a", fontFamily: "Georgia, 'Times New Roman', serif" }}
        />

        <textarea
          placeholder="Describe your dream..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="w-full bg-transparent text-sm leading-relaxed outline-none resize-none placeholder:text-[#c4b0c8]"
          style={{ color: "#4a3a50" }}
        />

        <div className="space-y-2">
          <p className="text-xs text-center" style={{ color: "#9b8a9e" }}>Dream symbols</p>
          <div className="flex justify-center gap-2">
            <input
              type="text"
              placeholder="e.g. water, snake, flying"
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSymbol(); } }}
              className="bg-transparent text-sm text-center outline-none border-b placeholder:text-[#c4b0c8] w-48"
              style={{ color: "#3d2e4a", borderColor: "rgba(155,142,196,0.3)" }}
            />
            <button
              onClick={addSymbol}
              className="text-xs px-2 py-1 rounded-lg"
              style={{ background: "rgba(107,94,139,0.1)", color: "#6b5e8b" }}
            >
              Add
            </button>
          </div>
          {symbols.length > 0 && (
            <div className="flex justify-center gap-1.5 flex-wrap">
              {symbols.map((s) => (
                <span
                  key={s}
                  className="text-xs px-2 py-1 rounded-full flex items-center gap-1"
                  style={{ background: "rgba(155,142,196,0.12)", color: "#6b5e8b" }}
                >
                  {s}
                  <button onClick={() => removeSymbol(s)} className="opacity-60">×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}