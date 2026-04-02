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
  stage_2_response: string | null;
  stage_3_response: string | null;
  stage_4_response: string | null;
  user_patterns: Patterns | null;
  completed: boolean;
};

const STAGE_LABELS_EN = ["Awareness", "Pattern", "Emotional", "Integration"];
const STAGE_LABELS_PL = ["Konfrontacja", "Konkret", "Głębiej", "Integracja"];

const STAGE_INTROS_EN = [
  "Before you begin — this is not journaling. This is confrontation. You're here because something keeps returning. Let's find it.",
  "You've named what you avoid. Now let's trace it. Patterns don't hide — you've just learned not to look.",
  "This is the hardest part. You've seen the pattern. Now feel what's underneath it.",
  "You've faced it. You've felt it. Now — what changes? Not in theory. In your actual life.",
];
const STAGE_INTROS_PL = [
  "Zanim zaczniesz — to nie jest journaling. To konfrontacja. Jesteś tu, bo coś ciągle wraca. Znajdźmy to.",
  "Nazwałaś to, czego unikasz. Teraz prześledźmy to. Wzorce się nie chowają — po prostu nauczyłaś się nie patrzeć.",
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
        : "Czego unikasz w tej chwili? Nie tego, co mówisz sobie — tego, co naprawdę omijasz.",
      theme
        ? `"${theme}" — ten temat wraca w twoich wpisach. Gdzie jeszcze w życiu to widzisz?`
        : "Gdzie ten wzorzec się powtarza? W jakich sytuacjach reagujesz tak samo?",
      symbol
        ? `W twoich snach pojawia się "${symbol}". Jakie emocje blokujesz na jawie?`
        : "Czego nie pozwalasz sobie czuć? Co tłumisz, zanim zdążysz to poczuć?",
      "Jak wyglądałaby twoja reakcja, gdybyś odpowiedziała inaczej? Konkretnie — nie idealnie.",
    ];
  }
  return [
    topEmo
      ? `Your entries keep returning to "${topEmo}". What are you avoiding when you feel this?`
      : "What are you avoiding right now? Not what you tell yourself — what you're actually sidestepping.",
    theme
      ? `"${theme}" — this theme keeps surfacing in your writing. Where else in your life do you see it?`
      : "Where does this pattern keep happening? In what situations do you react the same way?",
    symbol
      ? `Your dreams keep showing "${symbol}". What emotions are you blocking in waking life?`
      : "What are you not allowing yourself to feel? What do you suppress before it fully arrives?",
    "What would it look like to respond differently? Specifically — not perfectly.",
  ];
}

async function extractPatterns(userId: string): Promise<Patterns> {
  const supabase = createClient();

  // Journal emotions
  const { data: journalData } = await supabase
    .from("journal_entries")
    .select("mood, content")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  // Dream symbols
  const { data: dreamData } = await supabase
    .from("dream_entries")
    .select("symbols, content")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  // Shadow work emotions
  const { data: shadowData } = await supabase
    .from("shadow_work_entries")
    .select("emotions")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  // Count emotions
  const emotionCounts: Record<string, number> = {};
  shadowData?.forEach((e) => {
    (e.emotions as string[] || []).forEach((em: string) => {
      emotionCounts[em] = (emotionCounts[em] || 0) + 1;
    });
  });
  journalData?.forEach((e) => {
    if (e.mood) emotionCounts[e.mood] = (emotionCounts[e.mood] || 0) + 1;
  });
  const topEmotions = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);

  // Dream symbols
  const symbolCounts: Record<string, number> = {};
  dreamData?.forEach((d) => {
    (d.symbols as string[] || []).forEach((s: string) => {
      symbolCounts[s] = (symbolCounts[s] || 0) + 1;
    });
  });
  const dreamSymbols = Object.entries(symbolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);

  // Recurring words from journal content (simple extraction)
  const wordCounts: Record<string, number> = {};
  const stopWords = new Set(["the","a","an","i","my","me","is","was","to","and","of","in","it","that","this","for","but","not","with","on","at","from","or","so","if","be","do","have","had","has","am","are","were","been","will","would","can","could","just","like","very","really","also","about","what","when","how","all","some","them","they","their","there","than","then","more","out","up","no","yes","your","you"]);
  journalData?.forEach((e) => {
    if (e.content) {
      const words = (e.content as string).toLowerCase().replace(/[^a-zA-Z\s]/g, "").split(/\s+/);
      words.forEach((w) => {
        if (w.length > 3 && !stopWords.has(w)) {
          wordCounts[w] = (wordCounts[w] || 0) + 1;
        }
      });
    }
  });
  const recurringThemes = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);

  return {
    topEmotions,
    recurringThemes,
    dreamSymbols,
    entryCount: (journalData?.length || 0) + (dreamData?.length || 0) + (shadowData?.length || 0),
  };
}

export default function WorkbookPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const pl = language === "pl";

  const [loading, setLoading] = useState(true);
  const [gateBlocked, setGateBlocked] = useState(false);
  const [journalCount, setJournalCount] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const [patterns, setPatterns] = useState<Patterns | null>(null);
  const [response, setResponse] = useState("");
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);

  const stageLabels = pl ? STAGE_LABELS_PL : STAGE_LABELS_EN;
  const stageIntros = pl ? STAGE_INTROS_PL : STAGE_INTROS_EN;

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Gate: minimum 3 journal entries
    const { count } = await supabase
      .from("journal_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    const jCount = count || 0;
    setJournalCount(jCount);

    if (jCount < 3) {
      setGateBlocked(true);
      setLoading(false);
      return;
    }

    // Extract patterns
    const p = await extractPatterns(user.id);
    setPatterns(p);

    // Load or create session
    const { data: existing } = await supabase
      .from("workbook_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("workbook_type", "shadow_work")
      .eq("completed", false)
      .order("created_at", { ascending: false })
      .limit(1);

    if (existing && existing.length > 0) {
      const s = existing[0] as Session;
      setSession(s);
      setPatterns(s.user_patterns || p);
      // Pre-fill current stage response if returning
      const stageKey = `stage_${s.current_stage}_response` as keyof Session;
      if (s[stageKey]) setResponse(s[stageKey] as string);
    } else {
      const { data: newSession } = await supabase
        .from("workbook_sessions")
        .insert({
          user_id: user.id,
          workbook_type: "shadow_work",
          current_stage: 1,
          user_patterns: p,
        })
        .select()
        .single();
      setSession(newSession as Session);
    }

    setLoading(false);
  };

  const handleNext = async () => {
    if (!session || !response.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const stage = session.current_stage;
    const stageField = `stage_${stage}_response`;

    if (stage < 4) {
      await supabase
        .from("workbook_sessions")
        .update({
          [stageField]: response.trim(),
          current_stage: stage + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.id);

      setSession({ ...session, current_stage: stage + 1, [stageField]: response.trim() } as Session);
      setResponse("");
    } else {
      // Final stage
      await supabase
        .from("workbook_sessions")
        .update({
          [stageField]: response.trim(),
          completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.id);

      setCompleted(true);
    }

    setSaving(false);
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
      .insert({
        user_id: user.id,
        workbook_type: "shadow_work",
        current_stage: 1,
        user_patterns: p,
      })
      .select()
      .single();

    setSession(newSession as Session);
    setLoading(false);
  };

  const stage = session?.current_stage || 1;
  const questions = buildQuestions(patterns, language);

  // --- GATE SCREEN ---
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
            {pl
              ? `Ten workbook czyta twoje wzorce. Żeby to zrobić, potrzebuje twoich danych. Masz ${journalCount}/3 wymaganych wpisów w dzienniku.`
              : `This workbook reads your patterns. To do that, it needs your data. You have ${journalCount}/3 required journal entries.`}
          </p>
          <button
            onClick={() => router.push("/journal/new")}
            className="px-8 py-3 rounded-xl text-sm tracking-widest uppercase"
            style={{ backgroundColor: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}
          >
            {pl ? "Napisz w dzienniku" : "Write in journal"}
          </button>
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

  // --- COMPLETED ---
  if (completed) {
    return (
      <div className="min-h-screen transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
        <header className="px-6 pt-5 pb-2">
          <button onClick={() => router.push("/shadow-work")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
            ← {pl ? "Wróć" : "Back"}
          </button>
        </header>
        <main className="max-w-md mx-auto px-6 pt-12 text-center space-y-6">
          <div className="text-5xl mb-2" style={{ color: "var(--color-plum)", opacity: 0.4 }}>◇</div>
          <h1 className="text-2xl tracking-wide" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            {pl ? "Przeszłaś przez to." : "You went through it."}
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "var(--color-dark)" }}>
            {pl
              ? "Nie szukaj teraz odpowiedzi. Pozwól temu pracować w tle. Wróć za kilka dni — zobaczysz, co się zmieniło."
              : "Don't look for answers right now. Let this work in the background. Come back in a few days — you'll see what shifted."}
          </p>
          <div className="flex flex-col gap-3 pt-4">
            <button
              onClick={handleStartNew}
              className="px-8 py-3 rounded-xl text-sm tracking-widest uppercase"
              style={{ backgroundColor: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}
            >
              {pl ? "Zacznij nową sesję" : "Start a new session"}
            </button>
            <button
              onClick={() => router.push("/shadow-work")}
              className="text-sm tracking-wide"
              style={{ color: "var(--color-mauve)" }}
            >
              {pl ? "Wróć do pracy z cieniem" : "Back to shadow work"}
            </button>
          </div>
        </main>
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
        <h2
          className="text-xl md:text-2xl leading-relaxed mb-8"
          style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
        >
          {questions[stage - 1]}
        </h2>

        {/* Response */}
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          rows={8}
          placeholder={pl ? "Pisz tutaj... bądź szczera." : "Write here... be honest."}
          className="w-full rounded-2xl border p-4 text-base resize-none transition-colors duration-500 mb-6"
          style={{
            backgroundColor: "var(--color-blush)",
            borderColor: "var(--color-dusty-rose)",
            color: "var(--color-dark)",
            fontFamily: "Georgia, serif",
          }}
        />

        {/* Next / Complete */}
        <button
          onClick={handleNext}
          disabled={saving || !response.trim()}
          className="w-full py-3.5 rounded-xl text-sm tracking-widest uppercase transition-all"
          style={{
            backgroundColor: response.trim() ? "var(--color-plum)" : "var(--color-dusty-rose)",
            color: response.trim() ? "var(--color-cream)" : "var(--color-mauve)",
            fontWeight: 600,
            opacity: response.trim() ? 1 : 0.5,
          }}
        >
          {saving
            ? "..."
            : stage < 4
              ? (pl ? "Dalej →" : "Next →")
              : (pl ? "Zakończ" : "Complete")}
        </button>
      </main>
    </div>
  );
}