"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n";

type Patterns = {
  topSymbols: string[];
  topEmotions: string[];
  recurringThemes: string[];
  dreamCount: number;
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

const STAGE_LABELS_EN = ["Awareness", "Symbol", "Emotional", "Integration"];
const STAGE_LABELS_PL = ["Świadomość", "Symbol", "Emocje", "Integracja"];

const STAGE_INTROS_EN = [
  "Your dreams are not random. They're speaking to you in a language you haven't learned yet. Let's start listening.",
  "Symbols repeat for a reason. They're not decoration. They're messages. Let's decode yours.",
  "This is where it gets uncomfortable. Your dreams show what you won't look at during the day.",
  "Understanding means nothing without action. What does your dream life demand from your waking life?",
];
const STAGE_INTROS_PL = [
  "Twoje sny nie są przypadkowe. Mówią do ciebie językiem, którego jeszcze nie znasz. Zacznijmy słuchać.",
  "Symbole powtarzają się nie bez powodu. To nie dekoracja. To wiadomości. Odczytajmy twoje.",
  "Tu robi się niekomfortowo. Twoje sny pokazują to, na co nie chcesz patrzeć za dnia.",
  "Zrozumienie bez działania nic nie znaczy. Czego twoje sny wymagają od twojego życia na jawie?",
];

function buildQuestions(patterns: Patterns | null, lang: "en" | "pl"): string[] {
  const topSymbol = patterns?.topSymbols?.[0];
  const secondSymbol = patterns?.topSymbols?.[1];
  const topEmo = patterns?.topEmotions?.[0];
  const theme = patterns?.recurringThemes?.[0];

  if (lang === "pl") {
    return [
      topEmo
        ? `Twoje sny najczęściej niosą ton "${topEmo}". Co czujesz w ciele, kiedy się budzisz po takim śnie?`
        : "Przypomnij sobie ostatni sen, który został z tobą po przebudzeniu. Co czułaś? Nie co się działo, ale co czułaś?",
      topSymbol
        ? `"${topSymbol}" pojawia się w twoich snach wielokrotnie.${secondSymbol ? ` Podobnie "${secondSymbol}".` : ""} Co ten symbol znaczy dla CIEBIE? Nie ze słownika, tylko z twojego życia.`
        : "Jaki symbol lub obraz wraca w twoich snach? Co on dla ciebie znaczy? Osobiście, nie z interpretacji.",
      theme
        ? `W twoich snach i wpisach przewija się temat "${theme}". Jakie emocje blokujesz na jawie, które twoje sny próbują ci pokazać?`
        : "Czego twoje sny próbują ci powiedzieć, na co nie chcesz patrzeć za dnia?",
      "Gdybyś potraktowała swój ostatni sen jak list od siebie samej, co byś z nim zrobiła? Konkretnie.",
    ];
  }
  return [
    topEmo
      ? `Your dreams most often carry the tone "${topEmo}". What do you feel in your body when you wake from a dream like that?`
      : "Think of the last dream that stayed with you after waking. What did you feel? Not what happened, but what you felt.",
    topSymbol
      ? `"${topSymbol}" appears in your dreams repeatedly.${secondSymbol ? ` So does "${secondSymbol}".` : ""} What does this symbol mean to YOU? Not from a dictionary, but from your life.`
      : "What symbol or image keeps returning in your dreams? What does it mean to you? Personally, not from an interpretation guide.",
    theme
      ? `Your dreams and entries keep circling back to "${theme}". What emotions are you blocking in waking life that your dreams are trying to show you?`
      : "What are your dreams trying to tell you that you refuse to look at during the day?",
    "If you treated your last dream as a letter from yourself, what would you do with it? Specifically.",
  ];
}

async function extractPatterns(userId: string): Promise<Patterns> {
  const supabase = createClient();

  const { data: dreamData } = await supabase
    .from("dream_entries")
    .select("symbols, content, emotional_tone")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  const { data: journalData } = await supabase
    .from("journal_entries")
    .select("content, mood")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  // Top symbols
  const symbolCounts: Record<string, number> = {};
  dreamData?.forEach((d) => {
    (d.symbols as string[] || []).forEach((s: string) => {
      symbolCounts[s] = (symbolCounts[s] || 0) + 1;
    });
  });
  const topSymbols = Object.entries(symbolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([k]) => k);

  // Top emotional tones
  const emoCounts: Record<string, number> = {};
  dreamData?.forEach((d) => {
    (d.emotional_tone as string[] || []).forEach((t: string) => {
      emoCounts[t] = (emoCounts[t] || 0) + 1;
    });
  });
  const topEmotions = Object.entries(emoCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);

  // Recurring themes from dream + journal content
  const wordCounts: Record<string, number> = {};
  const stopWords = new Set(["the","a","an","i","my","me","is","was","to","and","of","in","it","that","this","for","but","not","with","on","at","from","or","so","if","be","do","have","had","has","am","are","were","been","will","would","can","could","just","like","very","really","also","about","what","when","how","all","some","them","they","their","there","than","then","more","out","up","no","yes","your","you","dream","dreamed","felt","feel","know","think","into","back","went","going","could","would","being","something"]);
  [...(dreamData || []), ...(journalData || [])].forEach((e) => {
    const text = (e.content as string) || "";
    const words = text.toLowerCase().replace(/[^a-zA-Z\s]/g, "").split(/\s+/);
    words.forEach((w) => {
      if (w.length > 3 && !stopWords.has(w)) {
        wordCounts[w] = (wordCounts[w] || 0) + 1;
      }
    });
  });
  const recurringThemes = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);

  return {
    topSymbols,
    topEmotions,
    recurringThemes,
    dreamCount: dreamData?.length || 0,
  };
}

export default function DreamWorkbookPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const pl = language === "pl";

  const [loading, setLoading] = useState(true);
  const [gateBlocked, setGateBlocked] = useState(false);
  const [dreamCount, setDreamCount] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const [patterns, setPatterns] = useState<Patterns | null>(null);
  const [response, setResponse] = useState("");
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [phase, setPhase] = useState<StagePhase>("question");
  const [aiReaction, setAiReaction] = useState("");
  const [followup, setFollowup] = useState("");
  const [summary, setSummary] = useState("");

  const stageLabels = pl ? STAGE_LABELS_PL : STAGE_LABELS_EN;
  const stageIntros = pl ? STAGE_INTROS_PL : STAGE_INTROS_EN;

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { count } = await supabase
      .from("dream_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    const dCount = count || 0;
    setDreamCount(dCount);

    const { data: lastDreamSession } = await supabase.from("workbook_sessions")
      .select("created_at").eq("user_id", user.id).eq("workbook_type", "dream_integration").eq("completed", true)
      .order("created_at", { ascending: false }).limit(1);
    const sinceDream = lastDreamSession && lastDreamSession.length > 0 ? lastDreamSession[0].created_at : new Date(0).toISOString();
    const { count: newDreams } = await supabase.from("dream_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", sinceDream);
    const { count: newJournal } = await supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", sinceDream);
    const totalNewDream = (newDreams || 0) + (newJournal || 0);
    const { data: adminCheck } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
    if (totalNewDream < 5 && !adminCheck?.is_admin) {
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
      .eq("workbook_type", "dream_integration")
      .eq("completed", false)
      .order("created_at", { ascending: false })
      .limit(1);

    if (existing && existing.length > 0) {
      const s = existing[0] as Session;
      setSession(s);
      setPatterns(s.user_patterns || p);
      const stage = s.current_stage;
      const stageResponse = s[`stage_${stage}_response` as keyof Session] as string | null;
      const stageReaction = s[`stage_${stage}_ai_reaction` as keyof Session] as string | null;
      if (stageResponse) {
        setResponse(stageResponse);
        if (stageReaction) {
          setAiReaction(stageReaction);
          setPhase("ai_shown");
        } else {
          setPhase("ai_reacting");
        }
      }
    } else {
      const { data: newSession } = await supabase
        .from("workbook_sessions")
        .insert({
          user_id: user.id,
          workbook_type: "dream_integration",
          current_stage: 1,
          user_patterns: p,
        })
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
          workbookType: "dream_integration",
        }),
      });
      const data = await res.json();
      if (data.reaction) {
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

  const handleFollowup = async () => {
    if (!session) return;
    setPhase("saving_followup");
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
      setResponse("");
      setAiReaction("");
      setFollowup("");
      setPhase("question");
    } else {
      // Generate summary
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
            workbookType: "dream_integration",
            isSummary: true,
          }),
        });
        const data = await res.json();
        if (data.reaction) {
          setSummary(data.reaction);
        }
      } catch { /* ignore */ }
      setCompleted(true);
    }
  };

  const handleStartNew = async () => {
    setCompleted(false);
    setResponse("");
    setSession(null);
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const p = await extractPatterns(user.id);
    setPatterns(p);

    const { data: newSession } = await supabase
      .from("workbook_sessions")
      .insert({ user_id: user.id, workbook_type: "dream_integration", current_stage: 1, user_patterns: p })
      .select()
      .single();
    setSession(newSession as Session);
    setLoading(false);
  };

  const stage = session?.current_stage || 1;
  const questions = buildQuestions(patterns, language);

  if (!loading && gateBlocked) {
    return (
      <div className="min-h-screen transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
        <header className="px-6 pt-5 pb-2">
          <button onClick={() => router.push("/dreams")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
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
              ? "Potrzebujesz minimum 5 nowych wpisów od ostatniej sesji (sny + dziennik)."
              : "You need at least 5 new entries since your last session (dreams + journal)."}
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
          {pl ? "Czytam twoje sny..." : "Reading your dreams..."}
        </p>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
        <header className="px-6 pt-5 pb-2">
          <button onClick={() => router.push("/dreams")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
            ← {pl ? "Wróć" : "Back"}
          </button>
        </header>
        <main className="max-w-md mx-auto px-6 pt-12 text-center space-y-6">
          <div className="text-5xl mb-2" style={{ color: "var(--color-plum)", opacity: 0.4 }}>◇</div>
          <h1 className="text-2xl tracking-wide" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            {pl ? "Coś się otworzyło." : "Something opened."}
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
            <button onClick={() => router.push("/dreams")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)" }}>
              {pl ? "Wróć do snów" : "Back to dreams"}
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
          <button onClick={() => router.push("/dreams")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
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
        {(phase === "question" || phase === "responding") && (
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
        {phase === "ai_reacting" && (
          <div className="text-center py-12">
            <p className="text-sm tracking-widest uppercase animate-pulse" style={{ color: "var(--color-mauve)" }}>
              {pl ? "Czytam między wierszami..." : "Reading between the lines..."}
            </p>
          </div>
        )}

        {/* Phase: AI shown + followup */}
        {(phase === "ai_shown" || phase === "saving_followup") && (
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
              disabled={phase === "saving_followup"}
              className="w-full py-3.5 rounded-xl text-sm tracking-widest uppercase transition-all"
              style={{ backgroundColor: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}>
              {phase === "saving_followup" ? "..." : stage < 4 ? (pl ? "Dalej →" : "Next →") : (pl ? "Zakończ" : "Complete")}
            </button>
          </>
        )}
      </main>
    </div>
  );
}