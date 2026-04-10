"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n";

const TIME_PERIODS = [
  { value: "morning", en: "Morning (6:00–12:00)", pl: "Rano (6:00–12:00)", time: "09:00" },
  { value: "afternoon", en: "Afternoon (12:00–18:00)", pl: "Popołudnie (12:00–18:00)", time: "15:00" },
  { value: "evening", en: "Evening (18:00–00:00)", pl: "Wieczór (18:00–00:00)", time: "21:00" },
  { value: "night", en: "Night (00:00–6:00)", pl: "Noc (00:00–6:00)", time: "03:00" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const pl = language === "pl";

  const [step, setStep] = useState(1);
  const [birthDate, setBirthDate] = useState("");
  const [timeMode, setTimeMode] = useState<"exact" | "period" | "unknown">("exact");
  const [exactTime, setExactTime] = useState("");
  const [timePeriod, setTimePeriod] = useState("");
  const [birthCity, setBirthCity] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    let finalTime: string | null = null;
    if (timeMode === "exact" && exactTime) {
      finalTime = exactTime;
    } else if (timeMode === "period" && timePeriod) {
      const period = TIME_PERIODS.find(t => t.value === timePeriod);
      finalTime = period?.time || "12:00";
    } else {
      finalTime = "12:00";
    }

    await supabase.from("profiles").update({
      birth_date: birthDate || null,
      birth_time: finalTime,
      birth_city: birthCity.trim() || null,
    }).eq("id", user.id);

    setSaving(false);
    router.push("/dashboard");
  };

  const canContinue = step === 1 ? !!birthDate : step === 2 ? (timeMode === "unknown" || (timeMode === "exact" && exactTime) || (timeMode === "period" && timePeriod)) : true;

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
      <main className="max-w-md mx-auto px-6 py-16 space-y-8">

        {/* Header */}
        <section className="text-center space-y-4">
          <p className="text-xs tracking-[0.4em] uppercase" style={{ color: "var(--color-gold)", fontWeight: 600 }}>
            Noctua Premium
          </p>
          <h1 className="text-2xl md:text-3xl leading-tight" style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>
            {pl ? "Żeby widzieć głębiej, muszę wiedzieć skąd przychodzisz." : "To see deeper, I need to know where you come from."}
          </h1>
          <p className="text-sm" style={{ color: "var(--color-mauve)" }}>
            {pl ? "Te dane pozwolą mi czytać twoje wzorce przez pryzmat planet." : "This data lets me read your patterns through the lens of the planets."}
          </p>
        </section>

        {/* Progress */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              width: s === step ? "32px" : "8px",
              height: "4px",
              borderRadius: "2px",
              background: s <= step ? "var(--color-plum)" : "var(--color-dusty-rose)",
              transition: "all 0.3s",
            }} />
          ))}
        </div>

        {/* Step 1: Birth date */}
        {step === 1 && (
          <section className="space-y-6">
            <div className="text-center">
              <p className="text-lg mb-1" style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}>
                {pl ? "Kiedy się urodziłaś?" : "When were you born?"}
              </p>
              <p className="text-xs" style={{ color: "var(--color-mauve)" }}>
                {pl ? "Data urodzenia" : "Date of birth"}
              </p>
            </div>
            <input
              type="date"
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-center text-lg outline-none"
              style={{
                background: "var(--color-blush)",
                border: "1px solid var(--color-dusty-rose)",
                color: "var(--color-dark)",
                fontFamily: "'Cormorant Garamond', Georgia, serif",
              }}
            />
          </section>
        )}

        {/* Step 2: Birth time */}
        {step === 2 && (
          <section className="space-y-6">
            <div className="text-center">
              <p className="text-lg mb-1" style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}>
                {pl ? "O której godzinie?" : "What time?"}
              </p>
              <p className="text-xs" style={{ color: "var(--color-mauve)" }}>
                {pl ? "Im dokładniej, tym głębiej mogę widzieć." : "The more precise, the deeper I can see."}
              </p>
            </div>

            <div className="space-y-3">
              {/* Exact time */}
              <button
                onClick={() => setTimeMode("exact")}
                className="w-full p-4 rounded-xl text-left transition-all"
                style={{
                  background: timeMode === "exact" ? "var(--color-blush)" : "transparent",
                  border: `1px solid ${timeMode === "exact" ? "var(--color-plum)" : "var(--color-dusty-rose)"}`,
                }}
              >
                <p style={{ fontSize: "14px", color: "var(--color-dark)", fontWeight: 500 }}>
                  {pl ? "Znam dokładną godzinę" : "I know the exact time"}
                </p>
                {timeMode === "exact" && (
                  <input
                    type="time"
                    value={exactTime}
                    onChange={e => setExactTime(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    className="mt-3 w-full px-4 py-2 rounded-lg text-center outline-none"
                    style={{ background: "var(--color-cream)", border: "1px solid var(--color-dusty-rose)", color: "var(--color-dark)" }}
                  />
                )}
              </button>

              {/* Time period */}
              <button
                onClick={() => setTimeMode("period")}
                className="w-full p-4 rounded-xl text-left transition-all"
                style={{
                  background: timeMode === "period" ? "var(--color-blush)" : "transparent",
                  border: `1px solid ${timeMode === "period" ? "var(--color-plum)" : "var(--color-dusty-rose)"}`,
                }}
              >
                <p style={{ fontSize: "14px", color: "var(--color-dark)", fontWeight: 500 }}>
                  {pl ? "Znam przybliżoną porę" : "I know the approximate time"}
                </p>
                {timeMode === "period" && (
                  <div className="mt-3 grid grid-cols-2 gap-2" onClick={e => e.stopPropagation()}>
                    {TIME_PERIODS.map(tp => (
                      <button
                        key={tp.value}
                        onClick={() => setTimePeriod(tp.value)}
                        className="px-3 py-2 rounded-lg text-xs transition-all"
                        style={{
                          background: timePeriod === tp.value ? "var(--color-plum)" : "var(--color-cream)",
                          color: timePeriod === tp.value ? "var(--color-cream)" : "var(--color-mauve)",
                          border: `1px solid ${timePeriod === tp.value ? "var(--color-plum)" : "var(--color-dusty-rose)"}`,
                          fontWeight: timePeriod === tp.value ? 600 : 400,
                        }}
                      >
                        {pl ? tp.pl : tp.en}
                      </button>
                    ))}
                  </div>
                )}
              </button>

              {/* Unknown */}
              <button
                onClick={() => setTimeMode("unknown")}
                className="w-full p-4 rounded-xl text-left transition-all"
                style={{
                  background: timeMode === "unknown" ? "var(--color-blush)" : "transparent",
                  border: `1px solid ${timeMode === "unknown" ? "var(--color-plum)" : "var(--color-dusty-rose)"}`,
                }}
              >
                <p style={{ fontSize: "14px", color: "var(--color-dark)", fontWeight: 500 }}>
                  {pl ? "Nie wiem" : "I don't know"}
                </p>
                {timeMode === "unknown" && (
                  <p className="text-xs mt-2" style={{ color: "var(--color-mauve)" }}>
                    {pl ? "W porządku. Użyję uogólnionego odczytu." : "That is fine. I will use a generalised reading."}
                  </p>
                )}
              </button>
            </div>
          </section>
        )}

        {/* Step 3: Birth city */}
        {step === 3 && (
          <section className="space-y-6">
            <div className="text-center">
              <p className="text-lg mb-1" style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}>
                {pl ? "Gdzie się urodziłaś?" : "Where were you born?"}
              </p>
              <p className="text-xs" style={{ color: "var(--color-mauve)" }}>
                {pl ? "Miasto urodzenia" : "City of birth"}
              </p>
            </div>
            <input
              type="text"
              value={birthCity}
              onChange={e => setBirthCity(e.target.value)}
              placeholder={pl ? "np. Warszawa" : "e.g. London"}
              className="w-full px-4 py-3 rounded-xl text-center text-lg outline-none"
              style={{
                background: "var(--color-blush)",
                border: "1px solid var(--color-dusty-rose)",
                color: "var(--color-dark)",
                fontFamily: "'Cormorant Garamond', Georgia, serif",
              }}
            />
            <p className="text-xs text-center" style={{ color: "var(--color-mauve)", opacity: 0.6 }}>
              {pl ? "Opcjonalne, ale pomaga w dokładności odczytu." : "Optional, but helps with reading accuracy."}
            </p>
          </section>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-4">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 rounded-xl text-sm tracking-wide border"
              style={{ borderColor: "var(--color-dusty-rose)", color: "var(--color-mauve)", fontWeight: 500 }}
            >
              {pl ? "Wróć" : "Back"}
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canContinue}
              className="flex-1 py-3 rounded-xl text-sm tracking-widest uppercase transition-all disabled:opacity-40"
              style={{ background: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}
            >
              {pl ? "Dalej" : "Continue"}
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm tracking-widest uppercase transition-all disabled:opacity-50"
              style={{ background: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}
            >
              {saving ? "..." : (pl ? "Rozpocznij" : "Begin")}
            </button>
          )}
        </div>

        {/* Skip */}
        <div className="text-center">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-xs"
            style={{ color: "var(--color-dusty-rose)" }}
          >
            {pl ? "Pomiń na razie" : "Skip for now"}
          </button>
        </div>

      </main>
    </div>
  );
}