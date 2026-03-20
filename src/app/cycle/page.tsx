"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type CycleEntry = {
  id: string;
  entry_date: string;
  cycle_phase: string | null;
  flow_intensity: string | null;
  symptoms: string[];
  energy_level: number | null;
  notes: string | null;
};

const PHASES = [
  { value: "menstruation", label: "🌑 Menstruation" },
  { value: "follicular", label: "🌒 Follicular" },
  { value: "ovulation", label: "🌕 Ovulation" },
  { value: "luteal", label: "🌘 Luteal" },
];

const FLOW = [
  { value: "spotting", label: "Spotting" },
  { value: "light", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "heavy", label: "Heavy" },
];

const COMMON_SYMPTOMS = [
  "cramps", "bloating", "headache", "fatigue",
  "mood swings", "tender breasts", "backache", "nausea",
  "cravings", "insomnia", "acne", "anxiety",
];

export default function CycleTrackerPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<CycleEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Form state
  const [phase, setPhase] = useState("");
  const [flow, setFlow] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [energy, setEnergy] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    const entry = entries.find((e) => e.entry_date === selectedDate);
    if (entry) {
      setPhase(entry.cycle_phase || "");
      setFlow(entry.flow_intensity || "");
      setSymptoms(entry.symptoms || []);
      setEnergy(entry.energy_level || 0);
      setNotes(entry.notes || "");
      setExistingId(entry.id);
    } else {
      setPhase("");
      setFlow("");
      setSymptoms([]);
      setEnergy(0);
      setNotes("");
      setExistingId(null);
    }
  }, [selectedDate, entries]);

  const loadEntries = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("cycle_entries")
      .select("*")
      .order("entry_date", { ascending: false });
    setEntries(data || []);
    setLoading(false);
  };

  const toggleSymptom = (s: string) => {
    setSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const payload = {
      user_id: user.id,
      entry_date: selectedDate,
      cycle_phase: phase || null,
      flow_intensity: flow || null,
      symptoms: symptoms,
      energy_level: energy || null,
      notes: notes.trim() || null,
    };

    if (existingId) {
      await supabase
        .from("cycle_entries")
        .update(payload)
        .eq("id", existingId);
    } else {
      await supabase.from("cycle_entries").insert(payload);
    }

    await loadEntries();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = async () => {
    if (!existingId) return;
    if (!confirm("Delete this entry?")) return;
    const supabase = createClient();
    await supabase.from("cycle_entries").delete().eq("id", existingId);
    await loadEntries();
  };

  // Calendar helpers
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Monday start

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const getDateStr = (day: number) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  const getEntryForDay = (day: number) => {
    return entries.find((e) => e.entry_date === getDateStr(day));
  };

  const phaseColor = (p: string | null) => {
    switch (p) {
      case "menstruation": return "#c45050";
      case "follicular": return "#c49b8e";
      case "ovulation": return "#d4af37";
      case "luteal": return "#9b8ec4";
      default: return "transparent";
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(to bottom, #faf0f0, #f5eae8, #f0e4e2)",
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
          style={{ color: "#8b5e5e" }}
        >
          Cycle Tracker
        </h1>
        <div className="w-12" />
      </header>

      <main className="max-w-xl mx-auto px-6 pb-12 space-y-6">
        {/* Calendar */}
        <section
          className="rounded-2xl border p-4"
          style={{
            background: "rgba(255,255,255,0.5)",
            borderColor: "rgba(196,155,142,0.3)",
          }}
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="text-sm px-2" style={{ color: "#8b5e5e" }}>
              ‹
            </button>
            <h2 className="text-sm font-medium tracking-wide" style={{ color: "#3d2e4a" }}>
              {currentMonth.toLocaleDateString("en-GB", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <button onClick={nextMonth} className="text-sm px-2" style={{ color: "#8b5e5e" }}>
              ›
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
              <div
                key={d}
                className="text-center text-xs py-1"
                style={{ color: "#9b8a7a" }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = getDateStr(day);
              const entry = getEntryForDay(day);
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === new Date().toISOString().split("T")[0];

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className="relative w-full aspect-square flex items-center justify-center rounded-full text-xs transition-all"
                  style={{
                    background: isSelected
                      ? "rgba(139,94,94,0.15)"
                      : "transparent",
                    color: isSelected ? "#3d2e4a" : "#5e4e5e",
                    fontWeight: isToday ? 700 : 400,
                  }}
                >
                  {day}
                  {entry && (
                    <span
                      className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full"
                      style={{ background: phaseColor(entry.cycle_phase) }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Phase legend */}
          <div className="flex justify-center gap-3 mt-3 flex-wrap">
            {PHASES.map((p) => (
              <div key={p.value} className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: phaseColor(p.value) }}
                />
                <span className="text-xs" style={{ color: "#8a7a6a" }}>
                  {p.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Entry form for selected date */}
        <section className="space-y-5">
          <p className="text-xs text-center tracking-wide" style={{ color: "#9b8a7a" }}>
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {existingId && (
              <span style={{ color: "#c49b8e" }}> — editing</span>
            )}
          </p>

          {/* Phase */}
          <div className="flex justify-center gap-2 flex-wrap">
            {PHASES.map((p) => (
              <button
                key={p.value}
                onClick={() => setPhase(phase === p.value ? "" : p.value)}
                className="px-3 py-1.5 rounded-full text-xs transition-all border"
                style={{
                  background:
                    phase === p.value
                      ? "rgba(139,94,94,0.15)"
                      : "rgba(255,255,255,0.4)",
                  borderColor:
                    phase === p.value
                      ? "rgba(139,94,94,0.3)"
                      : "rgba(196,155,142,0.3)",
                  color: phase === p.value ? "#3d2e4a" : "#8a7a6a",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Flow intensity */}
          {phase === "menstruation" && (
            <div className="flex justify-center gap-2">
              {FLOW.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFlow(flow === f.value ? "" : f.value)}
                  className="px-3 py-1.5 rounded-full text-xs transition-all border"
                  style={{
                    background:
                      flow === f.value
                        ? "rgba(196,80,80,0.12)"
                        : "rgba(255,255,255,0.4)",
                    borderColor:
                      flow === f.value
                        ? "rgba(196,80,80,0.3)"
                        : "rgba(196,155,142,0.3)",
                    color: flow === f.value ? "#c45050" : "#8a7a6a",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* Energy level */}
          <div className="text-center space-y-1">
            <p className="text-xs" style={{ color: "#9b8a7a" }}>
              Energy level
            </p>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setEnergy(energy === n ? 0 : n)}
                  className="text-lg transition-all"
                  style={{ color: n <= energy ? "#8b5e5e" : "#d4ccc8" }}
                >
                  ●
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms */}
          <div className="space-y-2">
            <p className="text-xs text-center" style={{ color: "#9b8a7a" }}>
              Symptoms
            </p>
            <div className="flex justify-center gap-1.5 flex-wrap">
              {COMMON_SYMPTOMS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSymptom(s)}
                  className="px-2.5 py-1 rounded-full text-xs transition-all border"
                  style={{
                    background: symptoms.includes(s)
                      ? "rgba(139,94,94,0.12)"
                      : "rgba(255,255,255,0.3)",
                    borderColor: symptoms.includes(s)
                      ? "rgba(139,94,94,0.3)"
                      : "rgba(196,155,142,0.2)",
                    color: symptoms.includes(s) ? "#8b5e5e" : "#8a7a6a",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <textarea
            placeholder="Any notes for today..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full bg-transparent text-sm leading-relaxed outline-none resize-none placeholder:text-[#c4b0a0]"
            style={{ color: "#4a3a3a" }}
          />

          {/* Save / Delete */}
          <div className="flex justify-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm text-white transition-all disabled:opacity-50"
              style={{ background: "#8b5e5e" }}
            >
              {saving ? "Saving..." : saved ? "✓ Saved!" : existingId ? "Update" : "Save"}
            </button>
            {existingId && (
              <button
                onClick={handleDelete}
                className="px-4 py-2.5 rounded-xl text-sm transition-all border"
                style={{ borderColor: "rgba(196,80,80,0.3)", color: "#c45050" }}
              >
                Delete
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}