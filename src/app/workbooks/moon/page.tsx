"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n";
import { calculateNatalChart } from "@/lib/natal";
import { getEffectivePerms } from "@/lib/effective-perms";

type Session = {
  id: string;
  cycle_number: number;
  started_at: string;
  completed_at: string | null;
  ai_summary: string | null;
  responses: any[];
};

const STAGE_LABELS = {
  en: ["Recognition", "Pattern", "Depth", "Integration"],
  pl: ["Rozpoznanie", "Wzorzec", "Głębia", "Integracja"],
};

const STAGE_INTROS = {
  en: [
    "This is about how you feel. Not what you think about how you feel. The difference matters.",
    "You described your reaction. Now let us look at where it repeats. Patterns do not hide. You just stop noticing them.",
    "You have seen the pattern. Now go underneath it. What is the feeling you organise your whole life around avoiding?",
    "You have looked at it. You have felt it. Now the question is simple: what, specifically, will you do differently?",
  ],
  pl: [
    "Tu chodzi o to jak czujesz. Nie o to co myślisz o tym jak czujesz. Ta różnica ma znaczenie.",
    "Opisałaś swoją reakcję. Teraz popatrzmy gdzie się powtarza. Wzorce się nie chowają. Po prostu przestajesz je zauważać.",
    "Zobaczyłaś wzorzec. Teraz wejdź pod niego. Jakie jest to uczucie wokół którego organizujesz całe życie żeby go unikać?",
    "Popatrzyłaś na to. Poczułaś to. Teraz pytanie jest proste: co konkretnie zrobisz inaczej?",
  ],
};

function buildMoonQuestions(sign: string, lang: "en" | "pl", context?: string): string[] {
  const signQuestions: Record<string, { en: string[]; pl: string[] }> = {
    Aries: {
      en: [
        "When did you last react to something before you had time to understand what you were actually feeling?",
        "Where in your life do you confuse action with processing? Where do you move instead of feeling?",
        "What happens inside you in the gap between the trigger and your reaction? What lives there that you skip over?",
        "Name one situation this week where you will pause before reacting. What will you do in that pause?",
      ],
      pl: [
        "Kiedy ostatnio zareagowałaś na coś zanim zdążyłaś zrozumieć co właściwie czujesz?",
        "Gdzie w życiu mylisz działanie z przetwarzaniem? Gdzie ruszasz się zamiast czuć?",
        "Co się dzieje w tobie w luce między bodźcem a reakcją? Co tam mieszka, co przeskakujesz?",
        "Nazwij jedną sytuację w tym tygodniu gdzie zatrzymasz się zanim zareagujesz. Co zrobisz w tej pauzie?",
      ],
    },
    Taurus: {
      en: [
        "What are you holding onto right now that you know you should let go of? Why is letting go harder than keeping it?",
        "When your environment changes unexpectedly, what is the first thing you do? What does that tell you about what you need to feel safe?",
        "What would happen if the thing you rely on for stability disappeared tomorrow? Not practically. Emotionally.",
        "Where this week can you allow something to change without trying to control how it changes?",
      ],
      pl: [
        "Czego się teraz trzymasz, wiedząc że powinnaś puścić? Dlaczego puszczenie jest trudniejsze niż trzymanie?",
        "Kiedy twoje otoczenie zmienia się niespodziewanie, co robisz najpierw? Co to mówi o tym czego potrzebujesz żeby czuć się bezpiecznie?",
        "Co by się stało gdyby to na czym polegasz dla stabilności zniknęło jutro? Nie praktycznie. Emocjonalnie.",
        "Gdzie w tym tygodniu możesz pozwolić żeby coś się zmieniło bez próby kontrolowania jak się zmieni?",
      ],
    },
    Gemini: {
      en: [
        "When did you last explain a feeling so well that you convinced yourself you had dealt with it? What was still there afterwards?",
        "What topic do you keep circling back to in conversations, in your head, in your writing? What is underneath the circling?",
        "If you could not talk, write or explain for 24 hours, what feeling would catch up with you?",
        "This week, when you notice yourself starting to explain what you feel, stop. Sit with it for 5 minutes without words. What happens?",
      ],
      pl: [
        "Kiedy ostatnio wyjaśniłaś uczucie tak dobrze że przekonałaś siebie że je przepracowałaś? Co nadal tam było potem?",
        "Do jakiego tematu ciągle wracasz w rozmowach, w głowie, w pisaniu? Co jest pod tym krążeniem?",
        "Gdybyś nie mogła mówić, pisać ani wyjaśniać przez 24 godziny, jakie uczucie by cię dogoniło?",
        "W tym tygodniu, kiedy zauważysz że zaczynasz wyjaśniać co czujesz, zatrzymaj się. Posiedź z tym 5 minut bez słów. Co się stanie?",
      ],
    },
    Cancer: {
      en: [
        "Whose emotions are you carrying right now that are not yours? How do you know the difference?",
        "When someone close to you is in pain, what happens to your own needs? Where do they go?",
        "What would it feel like to watch someone you love struggle without stepping in to fix it? What comes up?",
        "This week, before you respond to someone else's emotion, ask yourself: what do I actually need right now? Act on that first.",
      ],
      pl: [
        "Czyje emocje teraz nosisz które nie są twoje? Skąd wiesz jaka jest różnica?",
        "Kiedy ktoś bliski cierpi, co się dzieje z twoimi potrzebami? Gdzie odchodzą?",
        "Jak by się czuło patrzenie jak ktoś kogo kochasz zmaga się z czymś bez wkraczania żeby to naprawić? Co się pojawia?",
        "W tym tygodniu, zanim zareagujesz na czyjąś emocję, zapytaj siebie: czego ja właściwie teraz potrzebuję? Zrób to najpierw.",
      ],
    },
    Leo: {
      en: [
        "When was the last time you felt truly unseen? Not ignored. Unseen. What did you do with that feeling?",
        "Where do you perform a version of yourself instead of showing the real one? What are you afraid will happen if people see the real version?",
        "What would you need to hear from someone right now that you are not willing to ask for?",
        "This week, tell someone what you actually need instead of waiting for them to figure it out. Notice what that feels like.",
      ],
      pl: [
        "Kiedy ostatnio czułaś się naprawdę niezauważona? Nie zignorowana. Niezauważona. Co zrobiłaś z tym uczuciem?",
        "Gdzie odgrywasz wersję siebie zamiast pokazywać prawdziwą? Czego się boisz że się stanie jeśli ludzie zobaczą prawdziwą wersję?",
        "Co chciałabyś teraz usłyszeć od kogoś o co nie jesteś gotowa poprosić?",
        "W tym tygodniu, powiedz komuś czego naprawdę potrzebujesz zamiast czekać aż sami się domyślą. Zwróć uwagę jak to się czuje.",
      ],
    },
    Virgo: {
      en: [
        "What feeling have you recently analysed instead of felt? What happened to it after you broke it into pieces?",
        "Where in your life are you solving emotions instead of experiencing them? What is the cost of that?",
        "If you allowed yourself to feel something fully, without understanding why, without a plan for what to do about it, what would come up?",
        "This week, when something bothers you, do not fix it. Do not analyse it. Write down what you feel in one sentence. Leave it.",
      ],
      pl: [
        "Jakie uczucie ostatnio przeanalizowałaś zamiast je poczuć? Co się z nim stało po tym jak rozłożyłaś je na części?",
        "Gdzie w życiu rozwiązujesz emocje zamiast je przeżywać? Jaki jest tego koszt?",
        "Gdybyś pozwoliła sobie poczuć coś w pełni, bez rozumienia dlaczego, bez planu co z tym zrobić, co by się pojawiło?",
        "W tym tygodniu, kiedy coś cię martwi, nie naprawiaj tego. Nie analizuj. Napisz co czujesz w jednym zdaniu. Zostaw to.",
      ],
    },
    Libra: {
      en: [
        "When was the last time you changed your opinion to match someone else's? Did you notice it happening?",
        "If you removed every relationship from your life for one day, who would you be? What would you feel?",
        "What conflict are you avoiding right now that is costing you more than the confrontation would?",
        "This week, disagree with someone about something small. Do not soften it. Notice what happens in your body.",
      ],
      pl: [
        "Kiedy ostatnio zmieniłaś zdanie żeby pasowało do czyjegoś? Czy zauważyłaś kiedy to się działo?",
        "Gdybyś usunęła każdą relację z życia na jeden dzień, kim byłabyś? Co byś czuła?",
        "Jakiego konfliktu teraz unikasz który kosztuje cię więcej niż kosztowałaby konfrontacja?",
        "W tym tygodniu, nie zgódź się z kimś w drobnej sprawie. Nie łagodź tego. Zauważ co się dzieje w twoim ciele.",
      ],
    },
    Scorpio: {
      en: [
        "Who has seen you at your most vulnerable recently? If nobody, why not? If someone, what did it cost you?",
        "Where do you test people before you let them close? What are you actually checking for?",
        "What would happen if you let someone help you without controlling how they help?",
        "This week, share something with someone that you would normally keep to yourself. Something small but real. See what happens.",
      ],
      pl: [
        "Kto ostatnio widział cię w twoim najbardziej wrażliwym stanie? Jeśli nikt, dlaczego? Jeśli ktoś, ile cię to kosztowało?",
        "Gdzie testujesz ludzi zanim pozwolisz im się zbliżyć? Czego właściwie szukasz?",
        "Co by się stało gdybyś pozwoliła komuś ci pomóc bez kontrolowania jak pomagają?",
        "W tym tygodniu, podziel się z kimś czymś co normalnie zatrzymałabyś dla siebie. Czymś małym ale prawdziwym. Zobacz co się stanie.",
      ],
    },
    Sagittarius: {
      en: [
        "What are you running from right now? Not physically. Emotionally. What feeling would catch you if you stopped?",
        "When things get emotionally heavy, what is your first impulse? New plan? New perspective? New anything?",
        "What would staying feel like? Not leaving the situation, the person, the feeling. Just staying.",
        "This week, when you want to change the subject, redirect, or lighten the mood, do not. Stay in it 5 minutes longer than is comfortable.",
      ],
      pl: [
        "Od czego teraz uciekasz? Nie fizycznie. Emocjonalnie. Jakie uczucie by cię złapało gdybyś się zatrzymała?",
        "Kiedy sprawy robią się emocjonalnie ciężkie, jaki jest twój pierwszy odruch? Nowy plan? Nowa perspektywa? Cokolwiek nowego?",
        "Jak by się czuło zostanie? Nie odchodzenie od sytuacji, osoby, uczucia. Po prostu zostanie.",
        "W tym tygodniu, kiedy chcesz zmienić temat, przekierować albo rozładować nastrój, nie rób tego. Zostań w tym 5 minut dłużej niż jest komfortowo.",
      ],
    },
    Capricorn: {
      en: [
        "When was the last time you allowed yourself to not be fine? What happened?",
        "Where do you perform strength because you believe falling apart is not an option? Who taught you that?",
        "If productivity and achievement were removed from your identity, what would be left? What would you feel?",
        "This week, cancel one thing you committed to that you do not actually want to do. Do not explain why. Notice the discomfort.",
      ],
      pl: [
        "Kiedy ostatnio pozwoliłaś sobie nie być w porządku? Co się stało?",
        "Gdzie odgrywasz siłę bo wierzysz że rozpadanie się nie wchodzi w grę? Kto cię tego nauczył?",
        "Gdyby produktywność i osiągnięcia zostały usunięte z twojej tożsamości, co by zostało? Co byś czuła?",
        "W tym tygodniu, odwołaj jedną rzecz na którą się zgodziłaś a której naprawdę nie chcesz robić. Nie tłumacz dlaczego. Zauważ dyskomfort.",
      ],
    },
    Aquarius: {
      en: [
        "When did you last feel something strongly and immediately start analysing it instead of staying in it?",
        "Where is the gap between understanding your emotions and actually experiencing them? What lives in that gap?",
        "If you could not rationalise your feelings for one week, what would surface?",
        "This week, when someone asks how you are, answer with what you feel, not what you think. One sentence. See what shifts.",
      ],
      pl: [
        "Kiedy ostatnio poczułaś coś mocno i natychmiast zaczęłaś to analizować zamiast w tym zostać?",
        "Gdzie jest luka między rozumieniem twoich emocji a faktycznym ich przeżywaniem? Co mieszka w tej luce?",
        "Gdybyś nie mogła racjonalizować swoich uczuć przez tydzień, co by wypłynęło?",
        "W tym tygodniu, kiedy ktoś zapyta jak się czujesz, odpowiedz tym co czujesz, nie tym co myślisz. Jedno zdanie. Zobacz co się zmieni.",
      ],
    },
    Pisces: {
      en: [
        "Right now, what are you feeling that does not belong to you? How do you know it is not yours?",
        "When you walk into a room full of people, what happens to your own emotional state? Where does it go?",
        "What would it feel like to feel only your own feelings for one full day? What are you afraid you would find?",
        "This week, before absorbing someone else's mood, pause and name what YOU felt before they arrived. Hold onto that.",
      ],
      pl: [
        "Co teraz czujesz co nie należy do ciebie? Skąd wiesz że to nie twoje?",
        "Kiedy wchodzisz do pokoju pełnego ludzi, co się dzieje z twoim własnym stanem emocjonalnym? Gdzie odchodzi?",
        "Jak by się czuło czucie tylko swoich własnych uczuć przez jeden pełny dzień? Czego boisz się że znajdziesz?",
        "W tym tygodniu, zanim wchłoniesz czyjś nastrój, zatrzymaj się i nazwij co TY czułaś zanim ta osoba przyszła. Trzymaj się tego.",
      ],
    },
  };

  const questions = signQuestions[sign] || signQuestions.Aries;
  return lang === "pl" ? questions.pl : questions.en;
}

export default function MoonWorkbookPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const lang = language as "en" | "pl";
  const pl = lang === "pl";

  const [loading, setLoading] = useState(true);
  const [natalSign, setNatalSign] = useState<string | null>(null);
  const [natalDescription, setNatalDescription] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [currentStage, setCurrentStage] = useState(0);
  const [response, setResponse] = useState("");
  const [aiReaction, setAiReaction] = useState<string | null>(null);
  const [reacting, setReacting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [pastSessions, setPastSessions] = useState<Session[]>([]);
  const [expandedPast, setExpandedPast] = useState<string | null>(null);

  useEffect(() => { init(); }, []);

  const init = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: profile } = await supabase.from("profiles").select("birth_date, birth_time, birth_city, is_premium, is_admin, admin_test_mode").eq("id", user.id).single();
    const { isAdmin, isPremium } = getEffectivePerms(profile);
    if (!profile?.birth_date) {
      router.push("/onboarding");
      return;
    }

    // Check access: purchased workbook OR bundle OR premium OR admin
    if (!isAdmin) {
      const { data: moonProduct } = await supabase.from("shop_products").select("id").eq("name", "Moon Workbook").single();
      const { data: bundleProduct } = await supabase.from("shop_products").select("id").eq("name", "Depth Work Bundle").single();
      const productIds = [moonProduct?.id, bundleProduct?.id].filter(Boolean);

      const { data: purchases } = await supabase
        .from("user_purchases")
        .select("id")
        .eq("user_id", user.id)
        .in("product_id", productIds);

      const hasPurchased = (purchases || []).length > 0;

      if (!hasPurchased && !isPremium) {
        router.push("/shop");
        return;
      }
    }

    const chart = calculateNatalChart(profile.birth_date, profile.birth_time, profile.birth_city);
    setNatalSign(chart.moon.sign);
    setNatalDescription(pl ? chart.moon.descriptionPl : chart.moon.description);
    setQuestions(buildMoonQuestions(chart.moon.sign, lang));

    // Load existing sessions
    const { data: sessions } = await supabase
      .from("workbook_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("workbook_type", "moon")
      .order("started_at", { ascending: false });

    const allSessions = (sessions as Session[]) || [];
    const active = allSessions.find(s => !s.completed_at);
    const past = allSessions.filter(s => s.completed_at);

    if (active) {
      setSession(active);
      const responses = active.responses || [];
      setCurrentStage(responses.length);
      if (responses.length > 0) {
        const last = responses[responses.length - 1];
        setAiReaction(last.ai_reaction || null);
      }
    }

    setPastSessions(past);
    setLoading(false);
  };

  const startSession = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const cycleNum = pastSessions.length + 1;

    const { data } = await supabase.from("workbook_progress").insert({
      user_id: user.id,
      workbook_type: "moon",
      cycle_number: cycleNum,
      responses: [],
    }).select().single();

    if (data) {
      setSession(data as Session);
      setCurrentStage(0);
      setAiReaction(null);
      setResponse("");
    }
  };

  const handleSubmit = async () => {
    if (!response.trim() || !session || !natalSign) return;
    setSaving(true);

    // Get AI reaction
    setReacting(true);
    let reaction = "";
    try {
      const res = await fetch("/api/workbook-planetary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: currentStage + 1,
          response: response.trim(),
          planet: "moon",
          natalSign,
          language: lang,
        }),
      });
      const data = await res.json();
      reaction = data.reaction || "";
    } catch {}
    setReacting(false);

    // Save to session
    const supabase = createClient();
    const updatedResponses = [...(session.responses || []), {
      stage: currentStage + 1,
      question: questions[currentStage],
      response: response.trim(),
      ai_reaction: reaction,
      timestamp: new Date().toISOString(),
    }];

    const isComplete = currentStage === 3;

    await supabase.from("workbook_progress").update({
      responses: updatedResponses,
      completed_at: isComplete ? new Date().toISOString() : null,
    }).eq("id", session.id);

    setSession({ ...session, responses: updatedResponses, completed_at: isComplete ? new Date().toISOString() : null });
    setAiReaction(reaction);
    setResponse("");
    if (currentStage === 3) { try { fetch("/api/extract-patterns", { method: "POST" }); } catch {} }
    setSaving(false);

    if (isComplete) {
      // Send notification
      await supabase.from("notifications").insert({
        user_id: (await supabase.auth.getUser()).data.user!.id,
        type: "workbook_complete",
        title_en: "Moon Workbook: cycle complete",
        title_pl: "Zeszyt Księżyca: cykl ukończony",
        body_en: "You finished a cycle. Your next one will be available in 30 days.",
        body_pl: "Ukończyłaś cykl. Następny będzie dostępny za 30 dni.",
        link: "/workbooks/moon",
      });
    }
  };

  const nextStage = () => {
    setCurrentStage(currentStage + 1);
    setAiReaction(null);
    setResponse("");
  };

  const canStartNewCycle = () => {
    if (pastSessions.length === 0) return true;
    const lastCompleted = pastSessions[0];
    if (!lastCompleted.completed_at) return false;
    const daysSince = (Date.now() - new Date(lastCompleted.completed_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= 30;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-gradient)" }}>
        <p className="text-sm" style={{ color: "var(--color-dusty-rose)" }}>{pl ? "Ładowanie..." : "Loading..."}</p>
      </div>
    );
  }

  const isComplete = session?.completed_at != null;
  const labels = STAGE_LABELS[lang];
  const intros = STAGE_INTROS[lang];

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
      <header className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
            ← {pl ? "Wróć" : "Back"}
          </button>
          <div className="w-12" />
        </div>
        <h1 className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3"
          style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>
          {pl ? "Zeszyt Księżyca" : "Moon Workbook"}
        </h1>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-16 space-y-8">

        {/* Natal Moon info */}
        <section className="text-center space-y-2 pt-4">
          <p className="text-xs tracking-[0.2em] uppercase" style={{ color: "var(--color-gold)", fontWeight: 600 }}>
            {pl ? "Twój Księżyc" : "Your Moon"}
          </p>
          <p className="text-2xl" style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>
            {pl ? `Księżyc w ${natalSign}` : `Moon in ${natalSign}`}
          </p>
          <p className="text-sm leading-relaxed max-w-md mx-auto" style={{ color: "var(--color-mauve)" }}>
            {natalDescription}
          </p>
        </section>

        {/* Divider */}
        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
          <span className="text-xs" style={{ color: "var(--color-gold)", opacity: 0.6 }}>☽</span>
          <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
        </div>

        {/* No active session */}
        {!session && (
          <section className="text-center space-y-6">
            {canStartNewCycle() ? (
              <>
                <p className="text-base leading-relaxed" style={{ color: "var(--color-dark)" }}>
                  {pastSessions.length === 0
                    ? (pl ? "Pierwszy cykl. Cztery pytania. Bądź szczera." : "First cycle. Four questions. Be honest.")
                    : (pl ? `Cykl ${pastSessions.length + 1}. Pytania się zmieniły. Ty też.` : `Cycle ${pastSessions.length + 1}. The questions changed. So did you.`)}
                </p>
                <button onClick={startSession} className="px-8 py-3 rounded-xl text-sm tracking-widest uppercase"
                  style={{ background: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}>
                  {pl ? "Rozpocznij" : "Begin"}
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-base" style={{ color: "var(--color-dark)" }}>
                  {pl ? "Następny cykl będzie dostępny za:" : "Next cycle available in:"}
                </p>
                <p className="text-2xl" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  {Math.max(0, Math.ceil(30 - (Date.now() - new Date(pastSessions[0].completed_at!).getTime()) / (1000 * 60 * 60 * 24)))} {pl ? "dni" : "days"}
                </p>
                <p className="text-xs" style={{ color: "var(--color-mauve)" }}>
                  {pl ? "W międzyczasie pisz dziennik, zapisuj sny, pracuj z cieniem." : "In the meantime, journal, record dreams, do shadow work."}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Active session */}
        {session && !isComplete && (
          <section className="space-y-6">
            {/* Progress */}
            <div className="flex justify-between">
              {labels.map((label, i) => (
                <div key={i} className="text-center flex-1">
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "50%", margin: "0 auto",
                    background: i < currentStage ? "var(--color-plum)" : i === currentStage ? "var(--color-gold)" : "var(--color-blush)",
                    border: `1.5px solid ${i <= currentStage ? "var(--color-plum)" : "var(--color-dusty-rose)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", color: i <= currentStage ? "var(--color-cream)" : "var(--color-mauve)", fontWeight: 600,
                  }}>
                    {i < currentStage ? "✓" : i + 1}
                  </div>
                  <p className="text-xs mt-1" style={{ color: i === currentStage ? "var(--color-plum)" : "var(--color-mauve)", fontWeight: i === currentStage ? 600 : 400 }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* AI reaction from previous stage */}
            {aiReaction && (
              <div className="rounded-2xl p-5" style={{ background: "var(--color-blush)", border: "1px solid var(--color-dusty-rose)" }}>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-dark)", textAlign: "justify" }}>
                  {aiReaction}
                </p>
                <div className="text-center mt-4">
                  <button onClick={nextStage} className="px-6 py-2 rounded-xl text-xs tracking-widest uppercase"
                    style={{ background: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}>
                    {pl ? "Dalej" : "Continue"}
                  </button>
                </div>
              </div>
            )}

            {/* Current question */}
            {!aiReaction && currentStage < 4 && (
              <div className="space-y-4">
                <p className="text-xs" style={{ color: "var(--color-mauve)", fontStyle: "italic" }}>
                  {intros[currentStage]}
                </p>
                <p className="text-lg leading-relaxed" style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  {questions[currentStage]}
                </p>
                <textarea
                  value={response}
                  onChange={e => setResponse(e.target.value)}
                  rows={6}
                  className="w-full rounded-2xl border p-4 text-base resize-none"
                  style={{ backgroundColor: "var(--color-blush)", borderColor: "var(--color-dusty-rose)", color: "var(--color-dark)", fontFamily: "Georgia, serif" }}
                />
                <button
                  onClick={handleSubmit}
                  disabled={saving || reacting || !response.trim()}
                  className="w-full py-3 rounded-xl text-sm tracking-widest uppercase transition-all disabled:opacity-40"
                  style={{ background: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}>
                  {reacting ? (pl ? "Czytam..." : "Reading...") : saving ? "..." : (pl ? "Wyślij" : "Submit")}
                </button>
              </div>
            )}
          </section>
        )}

        {/* Completed */}
        {session && isComplete && (
          <section className="text-center space-y-6">
            <div className="text-3xl" style={{ color: "var(--color-plum)", opacity: 0.3 }}>☽</div>
            <p className="text-lg" style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              {pl ? "Cykl ukończony." : "Cycle complete."}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-mauve)" }}>
              {pl
                ? "Następny cykl będzie dostępny za 30 dni. Pytania będą inne. Odniosą się do tego co napisałaś teraz."
                : "The next cycle will be available in 30 days. The questions will be different. They will reference what you wrote now."}
            </p>
            <button onClick={() => router.push("/dashboard")} className="px-6 py-2 rounded-xl text-sm tracking-wide"
              style={{ border: "1px solid var(--color-dusty-rose)", color: "var(--color-plum)", fontWeight: 500 }}>
              {pl ? "Wróć do panelu" : "Back to dashboard"}
            </button>
          </section>
        )}

        {/* Past sessions */}
        {pastSessions.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
              <span className="text-xs uppercase tracking-widest" style={{ color: "var(--color-mauve)" }}>
                {pl ? "Poprzednie cykle" : "Past cycles"}
              </span>
              <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
            </div>
            {pastSessions.map(s => (
              <div key={s.id} className="rounded-2xl border" style={{ background: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
                <button onClick={() => setExpandedPast(expandedPast === s.id ? null : s.id)} className="w-full text-left p-4">
                  <div className="flex justify-between items-center">
                    <p style={{ color: "var(--color-dark)", fontWeight: 500, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                      {pl ? `Cykl ${s.cycle_number}` : `Cycle ${s.cycle_number}`}
                    </p>
                    <span className="text-xs" style={{ color: "var(--color-mauve)" }}>
                      {s.completed_at ? new Date(s.completed_at).toLocaleDateString(pl ? "pl-PL" : "en-GB", { day: "numeric", month: "long" }) : ""}
                    </span>
                  </div>
                </button>
                {expandedPast === s.id && (
                  <div className="px-4 pb-4 space-y-4" style={{ borderTop: "1px solid var(--color-dusty-rose)" }}>
                    {(s.responses || []).map((r: any, i: number) => (
                      <div key={i} className="pt-3 space-y-2">
                        <p className="text-xs uppercase tracking-wider" style={{ color: "var(--color-gold)", fontWeight: 600 }}>{labels[i]}</p>
                        <p className="text-sm" style={{ color: "var(--color-plum)", fontWeight: 500 }}>{r.question}</p>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--color-dark)" }}>{r.response}</p>
                        {r.ai_reaction && (
                          <p className="text-sm leading-relaxed italic" style={{ color: "var(--color-mauve)" }}>{r.ai_reaction}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

      </main>
    </div>
  );
}