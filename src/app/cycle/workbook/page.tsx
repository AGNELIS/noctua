"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n";

type Patterns = {
  dominantPhase: string | null;
  topSymptoms: string[];
  avgEnergy: number | null;
  entryCount: number;
  phaseDistribution: Record<string, number>;
};

type StagePhase = "question" | "responding" | "ai_reacting" | "ai_shown" | "followup" | "saving_followup";

type Session = {
  id: string;
  current_stage: number;
  stage_1_response: string | null;
  stage_1_ai_reaction: string | null;
  stage_1_followup: string | null;
  stage_2_response: string | null;
  stage_2_ai_reaction: string | null;
  stage_2_followup: string | null;
  stage_3_response: string | null;
  stage_3_ai_reaction: string | null;
  stage_3_followup: string | null;
  stage_4_response: string | null;
  stage_4_ai_reaction: string | null;
  stage_4_followup: string | null;
  summary: string | null;
  user_patterns: Patterns | null;
  completed: boolean;
};

const PHASE_NAMES_PL: Record<string, string> = {
  menstruation: "menstruacja",
  follicular: "faza folikularna",
  ovulation: "owulacja",
  luteal: "faza lutealna",
};

const SYMPTOM_NAMES_PL: Record<string, string> = {
  cramps: "skurcze", bloating: "wzdęcia", headache: "ból głowy", fatigue: "zmęczenie",
  "mood swings": "wahania nastroju", "tender breasts": "bolesność piersi", backache: "ból pleców", nausea: "nudności",
  cravings: "zachcianki", insomnia: "bezsenność", acne: "trądzik", anxiety: "niepokój",
};

const STAGE_LABELS_EN = ["Rhythm", "Pattern", "Tension", "Integration"];
const STAGE_LABELS_PL = ["Rytm", "Wzorzec", "Napięcie", "Integracja"];

const STAGE_INTROS_EN = [
  "Your body has a rhythm. You either work with it or against it. Most women fight it without realising. Let's see where you stand.",
  "Your cycle tells you what you need. Not what you want to hear. Let's look at what keeps repeating.",
  "This is where the real work is. The gap between what your body needs and what you actually give it.",
  "You've seen the pattern. You've felt the tension. Now, what are you going to do differently? Not perfectly. Differently.",
];
const STAGE_INTROS_PL = [
  "Twoje ciało ma rytm. Albo z nim współpracujesz, albo walczysz. Większość kobiet walczy, nawet nie wiedząc. Zobaczmy, gdzie jesteś.",
  "Twój cykl mówi ci, czego potrzebujesz. Nie tego, co chcesz usłyszeć. Sprawdźmy, co się powtarza.",
  "Tu zaczyna się prawdziwa praca. Przepaść między tym, czego potrzebuje twoje ciało, a tym, co mu dajesz.",
  "Zobaczyłaś wzorzec. Poczułaś napięcie. I co teraz? Nie idealnie. Inaczej.",
];

function buildQuestions(patterns: Patterns | null, lang: "en" | "pl"): string[] {
  const phase = patterns?.dominantPhase;
  const topSymptom = patterns?.topSymptoms?.[0];
  const energy = patterns?.avgEnergy;
  const phasePL = phase ? PHASE_NAMES_PL[phase] || phase : null;
  const symptomPL = topSymptom ? SYMPTOM_NAMES_PL[topSymptom] || topSymptom : null;

  if (lang === "pl") {
    return [
      phase
        ? `Większość twoich wpisów przypada na fazę: ${phasePL}. Jak się czujesz w tej fazie? Nie jak myślisz, że powinnaś się czuć. Jak naprawdę się czujesz?`
        : "W której fazie cyklu czujesz się najbardziej sobą? A w której udajesz, że wszystko jest ok?",
      topSymptom
        ? `"${symptomPL}" pojawia się najczęściej w twoich wpisach. Gdzie w życiu wymuszasz coś, zamiast pozwolić sobie na to, czego potrzebujesz?`
        : "Jaki objaw powtarza się co miesiąc? Co twoje ciało próbuje ci powiedzieć, a ty ignorujesz?",
      energy !== null
        ? `Twoja średnia energia to ${(energy ?? 0).toFixed(1)}/5. Gdzie tracisz energię, bo nie słuchasz swojego cyklu?`
        : "W których dniach cyklu zmuszasz się do rzeczy, na które nie masz siły? Co by się stało, gdybyś przestała?",
      "Gdybyś przez jeden cykl żyła w zgodzie ze swoim ciałem zamiast z kalendarzem, co by się zmieniło? Konkretnie.",
    ];
  }
  return [
    phase
      ? `Most of your entries fall in the ${phase} phase. How do you actually feel during this phase? Not how you think you should feel. How you really feel.`
      : "In which phase of your cycle do you feel most like yourself? And in which one are you pretending everything is fine?",
    topSymptom
      ? `"${topSymptom}" appears most often in your entries. Where in your life are you forcing something instead of allowing what you need?`
      : "What symptom repeats every month? What is your body trying to tell you that you keep ignoring?",
    energy !== null
      ? `Your average energy is ${(energy ?? 0).toFixed(1)}/5. Where are you losing energy because you're not listening to your cycle?`
      : "On which days of your cycle do you push through things you have no energy for? What would happen if you stopped?",
    "If you lived one full cycle in alignment with your body instead of your calendar, what would change? Specifically.",
  ];
}

async function extractPatterns(userId: string): Promise<Patterns> {
  const supabase = createClient();

  const { data: cycleData } = await supabase
    .from("cycle_entries")
    .select("cycle_phase, symptoms, energy_level, flow_intensity")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .limit(30);

  const phaseCounts: Record<string, number> = {};
  const symptomCounts: Record<string, number> = {};
  let energySum = 0;
  let energyCount = 0;

  cycleData?.forEach((e) => {
    if (e.cycle_phase) phaseCounts[e.cycle_phase] = (phaseCounts[e.cycle_phase] || 0) + 1;
    (e.symptoms as string[] || []).forEach((s: string) => {
      symptomCounts[s] = (symptomCounts[s] || 0) + 1;
    });
    if (e.energy_level) { energySum += e.energy_level; energyCount++; }
  });

  const dominantPhase = Object.entries(phaseCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const topSymptoms = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
  const avgEnergy = energyCount > 0 ? energySum / energyCount : null;

  return {
    dominantPhase,
    topSymptoms,
    avgEnergy,
    entryCount: cycleData?.length || 0,
    phaseDistribution: phaseCounts,
  };
}

export default function CycleWorkbookPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const pl = language === "pl";

  const [loading, setLoading] = useState(true);
  const [gateBlocked, setGateBlocked] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const [patterns, setPatterns] = useState<Patterns | null>(null);
  const [response, setResponse] = useState("");
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [uiPhase, setUiPhase] = useState<StagePhase>("question");
  const [aiReaction, setAiReaction] = useState("");
  const [followup, setFollowup] = useState("");
  const [summary, setSummary] = useState("");

  const stageLabels = pl ? STAGE_LABELS_PL : STAGE_LABELS_EN;
  const stageIntros = pl ? STAGE_INTROS_PL : STAGE_INTROS_EN;

  useEffect(() => { init(); }, []);

  const init = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { count } = await supabase
      .from("cycle_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    const cCount = count || 0;
    setCycleCount(cCount);

    const { data: lastCycleSession } = await supabase.from("workbook_sessions")
      .select("created_at").eq("user_id", user.id).eq("workbook_type", "cycle_alignment").eq("completed", true)
      .order("created_at", { ascending: false }).limit(1);
    const sinceCycle = lastCycleSession && lastCycleSession.length > 0 ? lastCycleSession[0].created_at : new Date(0).toISOString();
    const { count: newCycleEntries } = await supabase.from("cycle_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", sinceCycle);
    const { count: newJournalCycle } = await supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", sinceCycle);
    const totalNewCycle = (newCycleEntries || 0) + (newJournalCycle || 0);
    const { data: adminCheck } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
    if (totalNewCycle < 5 && !adminCheck?.is_admin) {
      setGateBlocked(true);
      setLoading(false);
      return;
    }

    const p = await extractPatterns(user.id);
    setPatterns(p);

    const { data: existing } = await supabase
      .from("workbook_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("workbook_type", "cycle_alignment")
      .eq("completed", false)
      .order("created_at", { ascending: false })
      .limit(1);

    if (existing && existing.length > 0) {
      const s = existing[0] as Session;
      setSession(s);
      setPatterns(s.user_patterns || p);
      const stageC = s.current_stage;
      const stageResponse = s[`stage_${stageC}_response` as keyof Session] as string | null;
      const stageReaction = s[`stage_${stageC}_ai_reaction` as keyof Session] as string | null;
      if (stageResponse) {
        setResponse(stageResponse);
        if (stageReaction) {
          setAiReaction(stageReaction);
          setUiPhase("ai_shown");
        } else {
          setUiPhase("ai_reacting");
        }
      }
    } else {
      const { data: newSession } = await supabase
        .from("workbook_sessions")
        .insert({ user_id: user.id, workbook_type: "cycle_alignment", current_stage: 1, user_patterns: p })
        .select()
        .single();
      setSession(newSession as Session);
    }

    setLoading(false);
  };

  const getPreviousResponses = () => {
    if (!session) return [];
    const prev: { stage: number; response: string; followup?: string }[] = [];
    for (let i = 1; i <= 4; i++) {
      const r = session[`stage_${i}_response` as keyof Session] as string | null;
      const f = session[`stage_${i}_followup` as keyof Session] as string | null;
      if (r) prev.push({ stage: i, response: r, followup: f || undefined });
    }
    return prev;
  };

  const handleNext = async () => {
    if (!session || !response.trim()) return;
    setUiPhase("ai_reacting");
    const supabase = createClient();
    const stage = session.current_stage;
    await supabase.from("workbook_sessions")
      .update({ [`stage_${stage}_response`]: response.trim(), updated_at: new Date().toISOString() })
      .eq("id", session.id);
    try {
      const res = await fetch("/api/workbook-react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id, stage, response: response.trim(),
          previousResponses: getPreviousResponses(), patterns, language,
          workbookType: "cycle_alignment",
        }),
      });
      const data = await res.json();
      if (data.reaction) {
        setAiReaction(data.reaction);
        setSession({ ...session, [`stage_${stage}_response`]: response.trim(), [`stage_${stage}_ai_reaction`]: data.reaction } as Session);
        setUiPhase("ai_shown");
      } else { setUiPhase("question"); }
    } catch { setUiPhase("question"); }
  };

  const handleFollowup = async () => {
    if (!session) return;
    setUiPhase("saving_followup");
    const supabase = createClient();
    const stage = session.current_stage;
    await supabase.from("workbook_sessions")
      .update({ [`stage_${stage}_followup`]: followup.trim(), updated_at: new Date().toISOString() })
      .eq("id", session.id);
    if (stage < 4) {
      await supabase.from("workbook_sessions")
        .update({ current_stage: stage + 1, updated_at: new Date().toISOString() })
        .eq("id", session.id);
      setSession({ ...session, current_stage: stage + 1, [`stage_${stage}_followup`]: followup.trim() } as Session);
      setResponse(""); setAiReaction(""); setFollowup(""); setUiPhase("question");
    } else {
      try {
        const res = await fetch("/api/workbook-react", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: session.id, stage: 4, response: "",
            previousResponses: [...getPreviousResponses(), { stage: 4, response: session.stage_4_response || response.trim(), followup: followup.trim() }],
            patterns, language, workbookType: "cycle_alignment", isSummary: true,
          }),
        });
        const data = await res.json();
        if (data.reaction) { setSummary(data.reaction); }
      } catch { /* ignore */ }
      setCompleted(true);
    }
  };


  const handleStartNew = async () => {
    setCompleted(false); setResponse(""); setSession(null); setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const p = await extractPatterns(user.id);
    setPatterns(p);
    const { data: newSession } = await supabase.from("workbook_sessions")
      .insert({ user_id: user.id, workbook_type: "cycle_alignment", current_stage: 1, user_patterns: p })
      .select().single();
    setSession(newSession as Session);
    setLoading(false);
  };

  const stage = session?.current_stage || 1;
  const questions = buildQuestions(patterns, language);

  if (!loading && gateBlocked) {
    return (
      <div className="min-h-screen transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
        <header className="px-6 pt-5 pb-2">
          <button onClick={() => router.push("/cycle")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
            ← {pl ? "Wróć" : "Back"}
          </button>
        </header>
        <main className="max-w-md mx-auto px-6 pt-16 text-center space-y-6">
          <div className="text-5xl mb-2" style={{ color: "var(--color-plum)", opacity: 0.3 }}>◈</div>
          <h1 className="text-2xl tracking-wide" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            {pl ? "Jeszcze nie teraz" : "Not yet"}
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "var(--color-dark)" }}>
            {pl
              ? "Potrzebujesz minimum 5 nowych wpisów od ostatniej sesji (cykl + dziennik)."
              : "You need at least 5 new entries since your last session (cycle + journal)."}
          </p>
          <div className="pt-2">
            <p className="text-sm" style={{ color: "var(--color-mauve)" }}>
              {pl ? "Wróć kiedy będziesz miała więcej materiału do pracy." : "Come back when you have more material to work with."}
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-gradient)" }}>
        <p className="text-sm tracking-widest uppercase animate-pulse" style={{ color: "var(--color-mauve)" }}>
          {pl ? "Czytam rytm twojego ciała..." : "Reading your body's rhythm..."}
        </p>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
        <header className="px-6 pt-5 pb-2">
          <button onClick={() => router.push("/cycle")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
            ← {pl ? "Wróć" : "Back"}
          </button>
        </header>
        <main className="max-w-md mx-auto px-6 pt-12 text-center space-y-6">
          <div className="text-5xl mb-2" style={{ color: "var(--color-plum)", opacity: 0.4 }}>◇</div>
          <h1 className="text-2xl tracking-wide" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            {pl ? "Twoje ciało pamięta." : "Your body remembers."}
          </h1>
          {summary ? (
            <div className="text-left mt-4 p-5 rounded-2xl" style={{ backgroundColor: "var(--color-blush)" }}>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--color-dark)", textAlign: "justify" }}>{summary}</p>
            </div>
          ) : (
            <p className="text-sm animate-pulse" style={{ color: "var(--color-mauve)" }}>
              {pl ? "Piszę podsumowanie..." : "Writing your summary..."}
            </p>
          )}
          <div className="flex flex-col gap-3 pt-4">
            <button onClick={handleStartNew} className="px-8 py-3 rounded-xl text-sm tracking-widest uppercase"
              style={{ backgroundColor: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}>
              {pl ? "Zacznij nową sesję" : "Start a new session"}
            </button>
            <button onClick={() => router.push("/cycle")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)" }}>
              {pl ? "Wróć do cyklu" : "Back to cycle"}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
      <header className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/cycle")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
            ← {pl ? "Wróć" : "Back"}
          </button>
          <span className="text-xs tracking-widest uppercase" style={{ color: "var(--color-mauve)", opacity: 0.7 }}>
            {stage}/4
          </span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-16">
        <div className="flex gap-2 mt-4 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex-1 h-1 rounded-full transition-all duration-500" style={{
              backgroundColor: s <= stage ? "var(--color-plum)" : "var(--color-dusty-rose)",
              opacity: s <= stage ? 1 : 0.3,
            }} />
          ))}
        </div>

        <p className="text-xs uppercase tracking-[0.3em] mb-3" style={{ color: "var(--color-mauve)", fontWeight: 600 }}>
          {stageLabels[stage - 1]}
        </p>

        <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--color-dark)", opacity: 0.7 }}>
          {stageIntros[stage - 1]}
        </p>

        <h2 className="text-xl md:text-2xl leading-relaxed mb-8"
          style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>
          {questions[stage - 1]}
        </h2>

        {/* Phase: Question */}
        {(uiPhase === "question" || uiPhase === "responding") && (
          <>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={8}
              placeholder={pl ? "Pisz tutaj... bądź szczera." : "Write here... be honest."}
              className="w-full rounded-2xl border p-4 text-base resize-none transition-colors duration-500 mb-6"
              style={{ backgroundColor: "var(--color-blush)", borderColor: "var(--color-dusty-rose)", color: "var(--color-dark)", fontFamily: "Georgia, serif" }}
            />
            <button
              onClick={handleNext}
              disabled={!response.trim()}
              className="w-full py-3.5 rounded-xl text-sm tracking-widest uppercase transition-all"
              style={{
                backgroundColor: response.trim() ? "var(--color-plum)" : "var(--color-dusty-rose)",
                color: response.trim() ? "var(--color-cream)" : "var(--color-mauve)",
                fontWeight: 600, opacity: response.trim() ? 1 : 0.5,
              }}>
              {pl ? "Wyślij" : "Submit"}
            </button>
          </>
        )}

        {/* Phase: AI reacting */}
        {uiPhase === "ai_reacting" && (
          <div className="text-center py-12">
            <p className="text-sm tracking-widest uppercase animate-pulse" style={{ color: "var(--color-mauve)" }}>
              {pl ? "Wsłuchuję się w twój rytm..." : "Listening to your rhythm..."}
            </p>
          </div>
        )}

        {/* Phase: AI shown + followup */}
        {(uiPhase === "ai_shown" || uiPhase === "saving_followup") && (
          <>
            <div className="mb-4 p-4 rounded-2xl" style={{ backgroundColor: "var(--color-blush)", opacity: 0.7 }}>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-dark)" }}>{response}</p>
            </div>
            <div className="mb-6 p-4 rounded-2xl border" style={{ borderColor: "var(--color-dusty-rose)", backgroundColor: "var(--color-cream)" }}>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-dark)", textAlign: "justify" }}>{aiReaction}</p>
            </div>
            <textarea
              value={followup}
              onChange={(e) => setFollowup(e.target.value)}
              rows={4}
              placeholder={pl ? "Twoja odpowiedź..." : "Your response..."}
              className="w-full rounded-2xl border p-4 text-base resize-none transition-colors duration-500 mb-6"
              style={{ backgroundColor: "var(--color-blush)", borderColor: "var(--color-dusty-rose)", color: "var(--color-dark)", fontFamily: "Georgia, serif" }}
            />
            <button
              onClick={handleFollowup}
              disabled={uiPhase === "saving_followup"}
              className="w-full py-3.5 rounded-xl text-sm tracking-widest uppercase transition-all"
              style={{ backgroundColor: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}>
              {uiPhase === "saving_followup" ? "..." : stage < 4 ? (pl ? "Dalej →" : "Next →") : (pl ? "Zakończ" : "Complete")}
            </button>
          </>
        )}
      </main>
    </div>
  );
}