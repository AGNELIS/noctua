"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n";

type Patterns = {
  topEmotions: string[];
  recurringThemes: string[];
  dreamSymbols: string[];
  entryCount: number;
};

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
  user_patterns: Patterns | null;
  summary: string | null;
  completed: boolean;
};

const STAGE_LABELS_EN = ["Awareness", "Pattern", "Emotional", "Integration"];
const STAGE_LABELS_PL = ["Konfrontacja", "Wzorzec", "Głębiej", "Integracja"];

const STAGE_INTROS_EN = [
  "Before you begin. This is not journaling. This is confrontation. You're here because something keeps returning. Let's find it.",
  "You've named what you avoid. Now let's trace it. Patterns don't hide. You've just learned not to look.",
  "This is the hardest part. You've seen the pattern. Now feel what's underneath it.",
  "You've faced it. You've felt it. Now, what changes? Not in theory. In your actual life.",
];
const STAGE_INTROS_PL = [
  "Zanim zaczniesz. To nie jest journaling. To konfrontacja. Jesteś tu, bo coś ciągle wraca. Znajdźmy to.",
  "Nazwałaś to, czego unikasz. Teraz prześledźmy to. Wzorce się nie chowają. Po prostu nauczyłaś się nie patrzeć.",
  "To najtrudniejsza część. Zobaczyłaś wzorzec. Teraz poczuj, co jest pod spodem.",
  "Zmierzyłaś się z tym. Poczułaś to. I co teraz? Nie w teorii. W twoim prawdziwym życiu.",
];

function buildQuestions(patterns: Patterns | null, lang: "en" | "pl"): string[] {
  const topEmo = patterns?.topEmotions?.[0];
  const theme = patterns?.recurringThemes?.[0];
  const symbol = patterns?.dreamSymbols?.[0];

  if (lang === "pl") {
    return [
      topEmo
        ? `W twoich wpisach powtarza się "${topEmo}". Czego unikasz, kiedy to czujesz?`
        : "Czego unikasz w tej chwili? Nie tego, co mówisz sobie. Tego, co naprawdę omijasz.",
      theme
        ? `"${theme}": ten temat wraca w twoich wpisach. Gdzie jeszcze w życiu to widzisz?`
        : "Gdzie ten wzorzec się powtarza? W jakich sytuacjach reagujesz tak samo?",
      symbol
        ? `W twoich snach pojawia się "${symbol}". Jakie emocje blokujesz na jawie?`
        : "Czego nie pozwalasz sobie czuć? Co tłumisz, zanim zdążysz to poczuć?",
      "Jak wyglądałaby twoja reakcja, gdybyś odpowiedziała inaczej? Konkretnie, nie idealnie.",
    ];
  }
  return [
    topEmo
      ? `Your entries keep returning to "${topEmo}". What are you avoiding when you feel this?`
      : "What are you avoiding right now? Not what you tell yourself. What you're actually sidestepping.",
    theme
      ? `"${theme}": this theme keeps surfacing in your writing. Where else in your life do you see it?`
      : "Where does this pattern keep happening? In what situations do you react the same way?",
    symbol
      ? `Your dreams keep showing "${symbol}". What emotions are you blocking in waking life?`
      : "What are you not allowing yourself to feel? What do you suppress before it fully arrives?",
    "What would it look like to respond differently? Specifically, not perfectly.",
  ];
}

async function extractPatterns(userId: string): Promise<Patterns> {
  const supabase = createClient();
  const { data: journalData } = await supabase.from("journal_entries").select("mood, content").eq("user_id", userId).order("created_at", { ascending: false }).limit(20);
  const { data: dreamData } = await supabase.from("dream_entries").select("symbols, content").eq("user_id", userId).order("created_at", { ascending: false }).limit(20);
  const { data: shadowData } = await supabase.from("shadow_work_entries").select("emotions").eq("user_id", userId).order("created_at", { ascending: false }).limit(20);

  const emotionCounts: Record<string, number> = {};
  shadowData?.forEach((e) => { (e.emotions as string[] || []).forEach((em: string) => { emotionCounts[em] = (emotionCounts[em] || 0) + 1; }); });
  journalData?.forEach((e) => { if (e.mood) emotionCounts[e.mood] = (emotionCounts[e.mood] || 0) + 1; });
  const topEmotions = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);

  const symbolCounts: Record<string, number> = {};
  dreamData?.forEach((d) => { (d.symbols as string[] || []).forEach((s: string) => { symbolCounts[s] = (symbolCounts[s] || 0) + 1; }); });
  const dreamSymbols = Object.entries(symbolCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);

  const wordCounts: Record<string, number> = {};
  const stopWords = new Set(["the","a","an","i","my","me","is","was","to","and","of","in","it","that","this","for","but","not","with","on","at","from","or","so","if","be","do","have","had","has","am","are","were","been","will","would","can","could","just","like","very","really","also","about","what","when","how","all","some","them","they","their","there","than","then","more","out","up","no","yes","your","you"]);
  journalData?.forEach((e) => {
    if (e.content) {
      (e.content as string).toLowerCase().replace(/[^a-zA-Z\s]/g, "").split(/\s+/).forEach((w) => {
        if (w.length > 3 && !stopWords.has(w)) wordCounts[w] = (wordCounts[w] || 0) + 1;
      });
    }
  });
  const recurringThemes = Object.entries(wordCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);

  return { topEmotions, recurringThemes, dreamSymbols, entryCount: (journalData?.length || 0) + (dreamData?.length || 0) + (shadowData?.length || 0) };
}

type StagePhase = "question" | "responding" | "ai_reacting" | "ai_shown" | "followup" | "saving_followup";

export default function WorkbookPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const pl = language === "pl";

  const [loading, setLoading] = useState(true);
  const [gateBlocked, setGateBlocked] = useState(false);
  const [journalCount, setJournalCount] = useState(0);
  const [shadowCount, setShadowCount] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const [patterns, setPatterns] = useState<Patterns | null>(null);
  const [response, setResponse] = useState("");
  const [followup, setFollowup] = useState("");
  const [aiReaction, setAiReaction] = useState("");
  const [phase, setPhase] = useState<StagePhase>("question");
  const [completed, setCompleted] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  const stageLabels = pl ? STAGE_LABELS_PL : STAGE_LABELS_EN;
  const stageIntros = pl ? STAGE_INTROS_PL : STAGE_INTROS_EN;

  useEffect(() => { init(); }, []);

  const init = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { count: jRaw } = await supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    const { count: sRaw } = await supabase.from("shadow_work_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    const jCount = jRaw || 0;
    const sCount = sRaw || 0;
    setJournalCount(jCount);
    setShadowCount(sCount);

    const { data: lastSession } = await supabase.from("workbook_sessions")
      .select("created_at").eq("user_id", user.id).eq("workbook_type", "shadow_work").eq("completed", true)
      .order("created_at", { ascending: false }).limit(1);
    const sinceDateWb = lastSession && lastSession.length > 0 ? lastSession[0].created_at : new Date(0).toISOString();
    const { count: newJ } = await supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", sinceDateWb);
    const { count: newS } = await supabase.from("shadow_work_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", sinceDateWb);
    const { count: newD } = await supabase.from("dream_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", sinceDateWb);
    const totalNewEntries = (newJ || 0) + (newS || 0) + (newD || 0);
    const { data: adminCheck } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
    if (totalNewEntries < 5 && !adminCheck?.is_admin) {
      setGateBlocked(true);
      setLoading(false);
      return;
    }

    const p = await extractPatterns(user.id);
    setPatterns(p);

    const { data: existing } = await supabase.from("workbook_sessions").select("*")
      .eq("user_id", user.id).eq("workbook_type", "shadow_work").eq("completed", false)
      .order("created_at", { ascending: false }).limit(1);

    if (existing && existing.length > 0) {
      const s = existing[0] as Session;
      setSession(s);
      setPatterns(s.user_patterns || p);
      // Restore state based on what's saved
      const stage = s.current_stage;
      const stageResponse = s[`stage_${stage}_response` as keyof Session] as string | null;
      const stageReaction = s[`stage_${stage}_ai_reaction` as keyof Session] as string | null;
      const stageFollowup = s[`stage_${stage}_followup` as keyof Session] as string | null;

      if (stageFollowup) {
        // This stage is complete, should have moved to next
        setPhase("question");
      } else if (stageReaction) {
        setAiReaction(stageReaction);
        setPhase("ai_shown");
      } else if (stageResponse) {
        setResponse(stageResponse);
        setPhase("ai_reacting");
        // Auto-trigger AI reaction
      } else {
        setPhase("question");
      }

      if (s.summary) {
        setSummary(s.summary);
        setCompleted(true);
      }
    } else {
      const { data: newSession } = await supabase.from("workbook_sessions")
        .insert({ user_id: user.id, workbook_type: "shadow_work", current_stage: 1, user_patterns: p })
        .select().single();
      setSession(newSession as Session);
    }

    setLoading(false);
  };

  const getPreviousResponses = () => {
    if (!session) return [];
    const prev = [];
    for (let i = 1; i <= 4; i++) {
      const r = session[`stage_${i}_response` as keyof Session] as string | null;
      const f = session[`stage_${i}_followup` as keyof Session] as string | null;
      if (r) prev.push({ stage: i, response: r, followup: f || undefined });
    }
    return prev;
  };

  const handleSubmitResponse = async () => {
    if (!session || !response.trim()) return;
    setPhase("ai_reacting");

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
          sessionId: session.id,
          stage,
          response: response.trim(),
          previousResponses: getPreviousResponses(),
          patterns,
          language,
          workbookType: "shadow_work",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAiReaction(data.reaction);
        setSession({ ...session, [`stage_${stage}_response`]: response.trim(), [`stage_${stage}_ai_reaction`]: data.reaction } as Session);
        setPhase("ai_shown");
      } else {
        setPhase("question");
      }
    } catch {
      setPhase("question");
    }
  };

  const handleSubmitFollowup = async () => {
    if (!session || !followup.trim()) return;
    setPhase("saving_followup");

    const supabase = createClient();
    const stage = session.current_stage;

    await supabase.from("workbook_sessions")
      .update({ [`stage_${stage}_followup`]: followup.trim(), updated_at: new Date().toISOString() })
      .eq("id", session.id);

    const updatedSession = { ...session, [`stage_${stage}_followup`]: followup.trim() } as Session;

    if (stage < 4) {
      await supabase.from("workbook_sessions")
        .update({ current_stage: stage + 1, updated_at: new Date().toISOString() })
        .eq("id", session.id);
      updatedSession.current_stage = stage + 1;
      setSession(updatedSession);
      setResponse("");
      setFollowup("");
      setAiReaction("");
      setPhase("question");
    } else {
      // Final stage — generate summary
      setSession(updatedSession);
      setGeneratingSummary(true);
      try {
        const res = await fetch("/api/workbook-react", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: session.id,
            stage: 4,
            response: "",
            previousResponses: [...getPreviousResponses(), { stage: 4, response: session.stage_4_response || response.trim(), followup: followup.trim() }],
            patterns,
            language,
            workbookType: "shadow_work",
            isSummary: true,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setSummary(data.reaction);
          setCompleted(true);
        }
      } catch {}
      setGeneratingSummary(false);
    }
  };

  const handleStartNew = async () => {
    setCompleted(false); setResponse(""); setFollowup(""); setAiReaction("");
    setSummary(null); setSession(null); setLoading(true); setPhase("question");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const p = await extractPatterns(user.id);
    setPatterns(p);
    const { data: newSession } = await supabase.from("workbook_sessions")
      .insert({ user_id: user.id, workbook_type: "shadow_work", current_stage: 1, user_patterns: p })
      .select().single();
    setSession(newSession as Session);
    setLoading(false);
  };

  const stage = session?.current_stage || 1;
  const questions = buildQuestions(patterns, language);

  // --- GATE ---
  if (!loading && gateBlocked) {
    return (
      <div className="min-h-screen transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
        <header className="px-6 pt-5 pb-2">
          <button onClick={() => router.push("/shadow-work")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
            ← {pl ? "Wróć" : "Back"}
          </button>
        </header>
        <main className="max-w-md mx-auto px-6 pt-16 text-center space-y-6">
          <div className="text-5xl mb-2" style={{ color: "var(--color-plum)", opacity: 0.3 }}>◈</div>
          <h1 className="text-2xl tracking-wide" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            {pl ? "Jeszcze nie teraz" : "Not yet"}
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "var(--color-dark)" }}>
            {pl ? "Ten workbook czyta twoje wzorce. Żeby to zrobić, potrzebuje twoich danych. Minimum 3 wpisy w dzienniku i 3 wpisy w pracy z cieniem."
              : "This workbook reads your patterns. To do that, it needs your data. Minimum 3 journal entries and 3 shadow work entries."}
          </p>
          <div className="space-y-2 pt-2">
            <p className="text-sm" style={{ color: "var(--color-mauve)" }}>
              {pl ? "Potrzebujesz minimum 5 nowych wpisów od ostatniej sesji (dziennik, sny, praca z cieniem)." : "You need at least 5 new entries since your last session (journal, dreams, shadow work)."}
            </p>
          </div>
        </main>
      </div>
    );
  }

  // --- LOADING ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-gradient)" }}>
        <p className="text-sm tracking-widest uppercase animate-pulse" style={{ color: "var(--color-mauve)" }}>
          {pl ? "Czytam twoje wzorce..." : "Reading your patterns..."}
        </p>
      </div>
    );
  }

  // --- COMPLETED WITH SUMMARY ---
  if (completed && summary) {
    return (
      <div className="min-h-screen transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
        <header className="px-6 pt-5 pb-2">
          <button onClick={() => router.push("/shadow-work")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
            ← {pl ? "Wróć" : "Back"}
          </button>
        </header>
        <main className="max-w-xl mx-auto px-6 pt-8 pb-16 space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-3" style={{ color: "var(--color-plum)", opacity: 0.4 }}>◇</div>
            <h1 className="text-2xl tracking-wide" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              {pl ? "Przeszłaś przez to." : "You went through it."}
            </h1>
          </div>

          <div className="rounded-2xl border p-5" style={{ background: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
            <div className="space-y-1">
              {summary.split("\n").map((line: string, i: number) => {
                if (!line.trim()) return <div key={i} className="h-2" />;
                const isHeading = /^[A-ZŻŹĆĄŚĘŁÓŃ]/.test(line.trim()) && line.trim().length < 30 && !line.trim().includes(".");
                return isHeading ? (
                  <p key={i} className="text-base mt-4 mb-1" style={{ color: "var(--color-plum)", fontWeight: 600, fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.1rem" }}>
                    {line.trim()}
                  </p>
                ) : (
                  <p key={i} className="text-sm leading-relaxed" style={{ color: "var(--color-dark)", textAlign: "justify" }}>
                    {line.trim()}
                  </p>
                );
              })}
            </div>
          </div>

          <p className="text-sm text-center leading-relaxed" style={{ color: "var(--color-dark)", opacity: 0.7 }}>
            {pl ? "Nie szukaj teraz odpowiedzi. Pozwól temu pracować w tle. Wróć za kilka dni." : "Don't look for answers now. Let this work in the background. Come back in a few days."}
          </p>

          <div className="flex flex-col gap-3 text-center pt-2">
            <button onClick={handleStartNew} className="px-8 py-3 rounded-xl text-sm tracking-widest uppercase"
              style={{ backgroundColor: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}>
              {pl ? "Nowa sesja" : "New session"}
            </button>
            <button onClick={() => router.push("/shadow-work")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)" }}>
              {pl ? "Wróć do pracy z cieniem" : "Back to shadow work"}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // --- GENERATING SUMMARY ---
  if (generatingSummary) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-gradient)" }}>
        <p className="text-sm tracking-widest uppercase animate-pulse" style={{ color: "var(--color-mauve)" }}>
          {pl ? "Analizuję twoją sesję..." : "Analysing your session..."}
        </p>
      </div>
    );
  }

  // --- WORKBOOK STAGES ---
  return (
    <div className="min-h-screen transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
      <header className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/shadow-work")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
            ← {pl ? "Wróć" : "Back"}
          </button>
          <span className="text-xs tracking-widest uppercase" style={{ color: "var(--color-mauve)", opacity: 0.7 }}>
            {stage}/4
          </span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-16">
        {/* Progress bar */}
        <div className="flex gap-2 mt-4 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex-1 h-1 rounded-full transition-all duration-500" style={{
              backgroundColor: s <= stage ? "var(--color-plum)" : "var(--color-dusty-rose)",
              opacity: s <= stage ? 1 : 0.3,
            }} />
          ))}
        </div>

        {/* Stage label */}
        <p className="text-xs uppercase tracking-[0.3em] mb-3" style={{ color: "var(--color-mauve)", fontWeight: 600 }}>
          {stageLabels[stage - 1]}
        </p>

        {/* Stage intro */}
        <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--color-dark)", opacity: 0.7 }}>
          {stageIntros[stage - 1]}
        </p>

        {/* Question */}
        <h2 className="text-xl md:text-2xl leading-relaxed mb-6"
          style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>
          {questions[stage - 1]}
        </h2>

        {/* Phase: Question — write response */}
        {(phase === "question" || phase === "responding") && (
          <div className="space-y-4">
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={6}
              placeholder={pl ? "Pisz tutaj... bądź szczera." : "Write here... be honest."}
              className="w-full rounded-2xl border p-4 text-base resize-none transition-colors duration-500"
              style={{ backgroundColor: "var(--color-blush)", borderColor: "var(--color-dusty-rose)", color: "var(--color-dark)", fontFamily: "Georgia, serif" }}
            />
            <button
              onClick={handleSubmitResponse}
              disabled={!response.trim()}
              className="w-full py-3.5 rounded-xl text-sm tracking-widest uppercase transition-all"
              style={{
                backgroundColor: response.trim() ? "var(--color-plum)" : "var(--color-dusty-rose)",
                color: response.trim() ? "var(--color-cream)" : "var(--color-mauve)",
                fontWeight: 600, opacity: response.trim() ? 1 : 0.5,
              }}>
              {pl ? "Wyślij" : "Submit"}
            </button>
          </div>
        )}

        {/* Phase: AI reacting */}
        {phase === "ai_reacting" && (
          <div className="text-center py-8">
            <p className="text-sm tracking-widest uppercase animate-pulse" style={{ color: "var(--color-mauve)" }}>
              {pl ? "Czytam co napisałaś..." : "Reading what you wrote..."}
            </p>
          </div>
        )}

        {/* Phase: AI shown — display reaction + followup */}
        {(phase === "ai_shown" || phase === "saving_followup") && (
          <div className="space-y-6">
            {/* User's response */}
            <div className="rounded-xl p-4" style={{ background: "var(--color-blush)", borderLeft: "3px solid var(--color-dusty-rose)" }}>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-dark)" }}>{response}</p>
            </div>

            {/* AI reaction */}
            <div className="rounded-xl p-4" style={{ background: "var(--color-cream)", borderLeft: "3px solid var(--color-plum)" }}>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-dark)", textAlign: "justify" }}>{aiReaction}</p>
            </div>

            {/* Followup textarea */}
            <textarea
              value={followup}
              onChange={(e) => setFollowup(e.target.value)}
              rows={4}
              placeholder={pl ? "Odpowiedz na to pytanie..." : "Respond to this question..."}
              className="w-full rounded-2xl border p-4 text-base resize-none transition-colors duration-500"
              style={{ backgroundColor: "var(--color-blush)", borderColor: "var(--color-dusty-rose)", color: "var(--color-dark)", fontFamily: "Georgia, serif" }}
            />

            <button
              onClick={handleSubmitFollowup}
              disabled={phase === "saving_followup" || !followup.trim()}
              className="w-full py-3.5 rounded-xl text-sm tracking-widest uppercase transition-all"
              style={{
                backgroundColor: followup.trim() ? "var(--color-plum)" : "var(--color-dusty-rose)",
                color: followup.trim() ? "var(--color-cream)" : "var(--color-mauve)",
                fontWeight: 600, opacity: followup.trim() ? 1 : 0.5,
              }}>
              {phase === "saving_followup" ? "..." : stage < 4 ? (pl ? "Dalej →" : "Next →") : (pl ? "Zakończ sesję" : "Complete session")}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}