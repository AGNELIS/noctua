"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n";
import { getMoonPhase, getUpcomingMoonEvents, type MoonEvent } from "@/lib/moon";
import { MiniMoon } from "@/components/NoctuaIcons";

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
  { value: "menstruation", label: "Menstruation", pl: "Menstruacja", color: "#c45050" },
  { value: "follicular", label: "Follicular", pl: "Folikularna", color: "#c49b8e" },
  { value: "ovulation", label: "Ovulation", pl: "Owulacja", color: "#d4af37" },
  { value: "luteal", label: "Luteal", pl: "Lutealna", color: "#9b8ec4" },
];

const FLOW = [
  { value: "spotting", label: "Spotting", pl: "Plamienie" },
  { value: "light", label: "Light", pl: "Lekki" },
  { value: "medium", label: "Medium", pl: "Sredni" },
  { value: "heavy", label: "Heavy", pl: "Obfity" },
];

const COMMON_SYMPTOMS = [
  "cramps", "bloating", "headache", "fatigue",
  "mood swings", "tender breasts", "backache", "nausea",
  "cravings", "insomnia", "acne", "anxiety",
];

const SYMPTOMS_PL: Record<string, string> = {
  cramps: "skurcze", bloating: "wzdęcia", headache: "ból głowy", fatigue: "zmęczenie",
  "mood swings": "wahania nastroju", "tender breasts": "bolesność piersi", backache: "ból pleców", nausea: "nudności",
  cravings: "zachcianki", insomnia: "bezsenność", acne: "trądzik", anxiety: "niepokój",
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

export default function CycleTrackerPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [entries, setEntries] = useState<CycleEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState("");
  const [flow, setFlow] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [energy, setEnergy] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [moonEvents, setMoonEvents] = useState<MoonEvent[]>([]);

  useEffect(() => {
    setMoonEvents(getUpcomingMoonEvents(3));
  }, []);

  const getMoonForDay = (day: number) => {
    const dateStr = getDateStr(day);
    const event = moonEvents.find((e) => e.date.toISOString().split("T")[0] === dateStr);
    if (event) return <MiniMoon phase={event.type} size={10} />;
    return null;
  };

  useEffect(() => { loadEntries(); }, []);

  useEffect(() => {
    const entry = entries.find((e) => e.entry_date === selectedDate);
    if (entry) {
      setPhase(entry.cycle_phase || ""); setFlow(entry.flow_intensity || "");
      setSymptoms(entry.symptoms || []); setEnergy(entry.energy_level || 0);
      setNotes(entry.notes || ""); setExistingId(entry.id);
    } else {
      setPhase(""); setFlow(""); setSymptoms([]); setEnergy(0); setNotes(""); setExistingId(null);
    }
  }, [selectedDate, entries]);

  const loadEntries = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("cycle_entries").select("*").order("entry_date", { ascending: false });
    setEntries(data || []);
    setLoading(false);
  };

  const toggleSymptom = (s: string) => setSymptoms((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const payload = { user_id: user.id, entry_date: selectedDate, cycle_phase: phase || null, flow_intensity: flow || null, symptoms, energy_level: energy || null, notes: notes.trim() || null };
    if (existingId) { await supabase.from("cycle_entries").update(payload).eq("id", existingId); }
    else { await supabase.from("cycle_entries").insert(payload); }
    await loadEntries();
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const confirmDelete = async () => {
    if (!existingId) return;
    const supabase = createClient();
    await supabase.from("cycle_entries").delete().eq("id", existingId);
    await loadEntries();
    setDeleteConfirm(false);
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const getDateStr = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const getEntryForDay = (day: number) => entries.find((e) => e.entry_date === getDateStr(day));

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
    <div className="min-h-screen transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
      {deleteConfirm && <ConfirmModal message={language === "pl" ? "Usunac ten wpis?" : "Delete this entry?"} onConfirm={confirmDelete} onCancel={() => setDeleteConfirm(false)} />}

      <header className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/dashboard")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>← {t("back")}</button>
          <div className="w-12" />
        </div>
        <h1 className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>{t("cycle_title")}</h1>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-12 space-y-6">
        <section className="rounded-2xl border p-4 transition-colors duration-500" style={{ background: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="text-lg px-2" style={{ color: "var(--color-mauve)" }}>‹</button>
            <h2 className="text-base font-medium tracking-wide" style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
              {currentMonth.toLocaleDateString(language === "pl" ? "pl-PL" : "en-GB", { month: "long", year: "numeric" })}
            </h2>
            <button onClick={nextMonth} className="text-lg px-2" style={{ color: "var(--color-mauve)" }}>›</button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {(language === "pl" ? ["Pn", "Wt", "Sr", "Cz", "Pt", "So", "Nd"] : ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]).map((d) => (
              <div key={d} className="text-center text-xs py-1" style={{ color: "var(--color-mauve)", fontWeight: 600 }}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startOffset }).map((_, i) => (<div key={`empty-${i}`} />))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = getDateStr(day);
              const entry = getEntryForDay(day);
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === new Date().toISOString().split("T")[0];
              return (
                <button key={day} onClick={() => setSelectedDate(dateStr)}
                  className="relative w-full aspect-square flex flex-col items-center justify-center text-sm transition-all"
                  style={{ borderRadius: "50%", background: isSelected ? "var(--color-dusty-rose)" : "transparent", color: isSelected ? "var(--color-cream)" : "var(--color-dark)", fontWeight: isToday ? 700 : 400 }}>
                  <span>{day}</span>
                  <div className="flex items-center gap-0.5" style={{ marginTop: "1px", minHeight: "8px" }}>
                    {entry && (<span style={{ display: "block", width: "5px", height: "5px", borderRadius: "50%", background: phaseColor(entry.cycle_phase) }} />)}
                    {getMoonForDay(day)}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex justify-center gap-4 mt-4 flex-wrap">
            {PHASES.map((p) => (
              <div key={p.value} className="flex items-center gap-1.5">
                <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: phaseColor(p.value) }} />
                <span className="text-xs" style={{ color: "var(--color-mauve)" }}>{language === "pl" ? p.pl : p.label}</span>
              </div>
            ))}
          </div>
        </section>

        {moonEvents.length > 0 && (
          <section className="rounded-2xl border p-4 transition-colors duration-500" style={{ background: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
            <p className="text-xs text-center uppercase tracking-widest mb-3" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>{language === "pl" ? "Nadchodzące wydarzenia księżycowe" : "Upcoming lunar events"}</p>
            <div className="space-y-2">
              {moonEvents.filter((e) => e.date.getTime() > Date.now()).slice(0, 6).map((e, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--color-dark)" }}>
                    <MiniMoon phase={e.type} size={18} />{" "}
                    {language === "pl" ? e.labelPl : e.label}
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-mauve)" }}>
                    {e.date.toLocaleDateString(language === "pl" ? "pl-PL" : "en-GB", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-5">
          <p className="text-sm text-center tracking-wide" style={{ color: "var(--color-dark)", fontWeight: 500 }}>
            {new Date(selectedDate + "T12:00:00").toLocaleDateString(language === "pl" ? "pl-PL" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {existingId && (<span style={{ color: "var(--color-mauve)", fontWeight: 400 }}> - {language === "pl" ? "edycja" : "editing"}</span>)}
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            {PHASES.map((p) => (
              <button key={p.value} onClick={() => setPhase(phase === p.value ? "" : p.value)}
                className="px-3 py-2 rounded-full text-sm transition-all border"
                style={{ background: phase === p.value ? "var(--color-blush)" : "transparent", borderColor: phase === p.value ? "var(--color-mauve)" : "var(--color-dusty-rose)", color: phase === p.value ? "var(--color-dark)" : "var(--color-mauve)", fontWeight: phase === p.value ? 600 : 400 }}
              ><span className="inline-flex items-center gap-1.5"><span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: p.color }} />{language === "pl" ? p.pl : p.label}</span></button>
            ))}
          </div>
          {phase === "menstruation" && (
            <div className="flex justify-center gap-2">
              {FLOW.map((f) => (
                <button key={f.value} onClick={() => setFlow(flow === f.value ? "" : f.value)}
                  className="px-3 py-2 rounded-full text-sm transition-all border"
                  style={{ background: flow === f.value ? "rgba(196,80,80,0.12)" : "transparent", borderColor: flow === f.value ? "rgba(196,80,80,0.3)" : "var(--color-dusty-rose)", color: flow === f.value ? "#c45050" : "var(--color-mauve)", fontWeight: flow === f.value ? 600 : 400 }}
                >{language === "pl" ? f.pl : f.label}</button>
              ))}
            </div>
          )}
          <div className="text-center space-y-2">
            <p className="text-sm" style={{ color: "var(--color-plum)", fontWeight: 600 }}>{language === "pl" ? "Poziom energii" : "Energy level"}</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setEnergy(energy === n ? 0 : n)} className="text-xl transition-all" style={{ color: n <= energy ? "var(--color-plum)" : "var(--color-dusty-rose)" }}>●</button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-center" style={{ color: "var(--color-plum)", fontWeight: 600 }}>{t("cycle_symptoms")}</p>
            <div className="flex justify-center gap-2 flex-wrap">
              {COMMON_SYMPTOMS.map((s) => (
                <button key={s} onClick={() => toggleSymptom(s)}
                  className="px-3 py-1.5 rounded-full text-sm transition-all border"
                  style={{ background: symptoms.includes(s) ? "var(--color-blush)" : "transparent", borderColor: symptoms.includes(s) ? "var(--color-mauve)" : "var(--color-dusty-rose)", color: symptoms.includes(s) ? "var(--color-dark)" : "var(--color-mauve)", fontWeight: symptoms.includes(s) ? 600 : 400 }}
                >{language === "pl" ? SYMPTOMS_PL[s] || s : s}</button>
              ))}
            </div>
          </div>
          <textarea placeholder={language === "pl" ? "Notatki na dzis..." : "Any notes for today..."} value={notes} onChange={(e) => setNotes(e.target.value)} rows={6}
            className="w-full text-sm leading-relaxed outline-none resize-none transition-colors duration-500"
            style={{ color: "var(--color-dark)", backgroundColor: "var(--color-blush)", borderRadius: "12px", padding: "16px", border: "1px solid var(--color-dusty-rose)" }} />
          <div className="flex justify-center gap-3">
            <button onClick={handleSave} disabled={saving}
              className="px-8 py-3 rounded-xl text-base transition-all disabled:opacity-50"
              style={{ background: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}>
              {saving ? "..." : saved ? "✓" : existingId ? (language === "pl" ? "Zaktualizuj" : "Update") : t("save")}
            </button>
            {existingId && (
              <button onClick={() => setDeleteConfirm(true)}
                className="px-5 py-3 rounded-xl text-base transition-all border"
                style={{ borderColor: "rgba(196,80,80,0.4)", color: "#c45050", fontWeight: 500 }}>{t("delete")}</button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}