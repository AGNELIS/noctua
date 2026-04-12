"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n";
import { calculateNatalChart } from "@/lib/natal";

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
    "Chiron points to the wound you help others heal but cannot heal in yourself. Not because you are broken. Because you keep looking away.",
    "You described the wound. Now look at how you have built your entire life around it. Where does it shape every choice you make?",
    "The wound is not the event. It is the story you told yourself about what it means about you. What is that story?",
    "Healing is not forgetting. It is no longer organising your life to avoid the pain. What would you do differently if the wound had no power over you?",
  ],
  pl: [
    "Chiron wskazuje ranę którą pomagasz innym leczyć ale nie potrafisz wyleczyć w sobie. Nie dlatego że jesteś złamana. Dlatego że ciągle odwracasz wzrok.",
    "Opisałaś ranę. Teraz popatrz jak zbudowałaś wokół niej całe życie. Gdzie kształtuje każdy wybór który robisz?",
    "Rana to nie wydarzenie. To historia którą opowiedziałaś sobie o tym co to mówi o tobie. Jaka jest ta historia?",
    "Leczenie to nie zapominanie. To przestanie organizowania życia żeby unikać bólu. Co byś robiła inaczej gdyby rana nie miała nad tobą władzy?",
  ],
};

function buildChironQuestions(sign: string, lang: "en" | "pl"): string[] {
  const signQuestions: Record<string, { en: string[]; pl: string[] }> = {
    Aries: {
      en: [
        "Where do you feel like you do not have the right to exist fully, take up space or assert yourself? When did that start?",
        "How often do you either overcompensate with aggression or disappear completely? Where does this pattern show up?",
        "What would it feel like to simply be here without earning your place? Whose voice told you that you have to fight to matter?",
        "Take up space this week without apologizing. Not loudly. Just fully. What does that require from you?",
      ],
      pl: [
        "Gdzie czujesz że nie masz prawa istnieć w pełni, zajmować miejsca lub stawiać na swoim? Kiedy to się zaczęło?",
        "Jak często albo przekompensowujesz agresją albo znikasz kompletnie? Gdzie pojawia się ten wzorzec?",
        "Jak by się czuło po prostu być tutaj bez zasługiwania na swoje miejsce? Czyj głos powiedział ci że musisz walczyć żeby mieć znaczenie?",
        "Zajmij w tym tygodniu miejsce bez przepraszania. Nie głośno. Po prostu w pełni. Czego to od ciebie wymaga?",
      ],
    },
    Taurus: {
      en: [
        "Where do you feel fundamentally unsafe in your body or in the material world? What does security mean to you and why does it never feel like enough?",
        "How often do you either hoard or reject material comfort? Where does your relationship with having or not having define you?",
        "What would it feel like to trust that you will be provided for? What early experience taught you that you cannot rely on the ground beneath you?",
        "Allow yourself one thing this week that you want but feel you do not deserve. What comes up?",
      ],
      pl: [
        "Gdzie czujesz się fundamentalnie niebezpiecznie we własnym ciele lub w materialnym świecie? Co dla ciebie znaczy bezpieczeństwo i dlaczego nigdy nie czujesz że jest wystarczająco?",
        "Jak często albo gromadzisz albo odrzucasz materialny komfort? Gdzie twoja relacja z posiadaniem lub nieposiadaniem cię definiuje?",
        "Jak by się czuło zaufać że będzie ci dane? Jakie wczesne doświadczenie nauczyło cię że nie możesz polegać na gruncie pod sobą?",
        "Pozwól sobie w tym tygodniu na jedną rzecz której chcesz ale czujesz że nie zasługujesz. Co się pojawia?",
      ],
    },
    Gemini: {
      en: [
        "Where do you feel like your voice does not matter or that you will be misunderstood no matter what you say?",
        "How often do you either talk too much to prove your intelligence or go silent because you assume nobody will listen? Where does this repeat?",
        "What would it feel like to speak and be truly heard? When was the first time you learned that your words were not safe?",
        "Say one thing this week that you have been holding back. Not for their reaction. For yours. What does it feel like to finally say it?",
      ],
      pl: [
        "Gdzie czujesz że twój głos nie ma znaczenia lub że zostaniesz źle zrozumiana bez względu na to co powiesz?",
        "Jak często albo mówisz za dużo żeby udowodnić inteligencję albo milkniesz bo zakładasz że nikt nie będzie słuchać? Gdzie to się powtarza?",
        "Jak by się czuło mówić i być naprawdę usłyszaną? Kiedy po raz pierwszy nauczyłaś się że twoje słowa nie są bezpieczne?",
        "Powiedz w tym tygodniu jedną rzecz którą wstrzymywałaś. Nie dla ich reakcji. Dla twojej. Jak się czujesz wreszcie to mówiąc?",
      ],
    },
    Cancer: {
      en: [
        "Where do you feel like home does not exist for you? Where do you nurture everyone else while starving yourself emotionally?",
        "How often do you create the family dynamic you grew up in, even when you swore you would not? Where does this pattern live?",
        "What would it feel like to be mothered the way you needed? What did you learn about your own needs being too much?",
        "Let yourself be taken care of this week without giving anything back. What is the hardest part of receiving?",
      ],
      pl: [
        "Gdzie czujesz że dom dla ciebie nie istnieje? Gdzie karmisz wszystkich innych a siebie emocjonalnie głodzisz?",
        "Jak często odtwarzasz dynamikę rodzinną w której dorastałaś nawet kiedy przysięgałaś że tego nie zrobisz? Gdzie ten wzorzec żyje?",
        "Jak by się czuło być zaopiekowaną tak jak potrzebowałaś? Czego nauczyłaś się o swoich potrzebach że są za duże?",
        "Pozwól się w tym tygodniu zaopiekować bez dawania czegokolwiek w zamian. Co jest najtrudniejsze w przyjmowaniu?",
      ],
    },
    Leo: {
      en: [
        "Where do you feel fundamentally unseen or unworthy of attention? When did you learn that shining was dangerous?",
        "How often do you either perform for love or hide to avoid rejection? Where does this split show up?",
        "What would it feel like to be loved for who you are, not what you do? What part of you do you think is unlovable?",
        "Create something this week and share it without editing it for approval. What does raw visibility feel like?",
      ],
      pl: [
        "Gdzie czujesz się fundamentalnie niewidziana lub niegodna uwagi? Kiedy nauczyłaś się że świecenie jest niebezpieczne?",
        "Jak często albo występujesz dla miłości albo chowasz się żeby uniknąć odrzucenia? Gdzie pojawia się ten podział?",
        "Jak by się czuło być kochaną za to kim jesteś nie za to co robisz? Jaką część siebie uważasz za niekochaną?",
        "Stwórz w tym tygodniu coś i podziel się tym bez edytowania pod aprobatę. Jak czuje się surowa widoczność?",
      ],
    },
    Virgo: {
      en: [
        "Where do you feel fundamentally flawed? When did you learn that you need to be useful to be worthy of love?",
        "How often do you criticize yourself before anyone else can? Where does self-improvement become self-punishment?",
        "What would it feel like to be imperfect and still loved? What early message taught you that mistakes equal rejection?",
        "Make a deliberate mistake this week and do not correct it. What does your body tell you?",
      ],
      pl: [
        "Gdzie czujesz się fundamentalnie wadliwa? Kiedy nauczyłaś się że musisz być użyteczna żeby być godną miłości?",
        "Jak często krytykujesz siebie zanim zrobi to ktokolwiek inny? Gdzie samodoskonalenie staje się samokaraniem?",
        "Jak by się czuło być niedoskonałą i nadal kochaną? Jaki wczesny przekaz nauczył cię że błędy równają się odrzucenie?",
        "Popełnij w tym tygodniu celowy błąd i go nie poprawiaj. Co mówi ci twoje ciało?",
      ],
    },
    Libra: {
      en: [
        "Where do you lose yourself in relationships to avoid being alone? When did you learn that your worth depends on being chosen?",
        "How often do you betray your own needs to maintain harmony? Where has peace-keeping cost you yourself?",
        "What would it feel like to be whole without a partner, a mirror, an audience? What is the emptiness you are filling with others?",
        "Spend time alone this week doing something you usually do with someone else. What do you discover about yourself?",
      ],
      pl: [
        "Gdzie gubisz siebie w relacjach żeby uniknąć bycia samą? Kiedy nauczyłaś się że twoja wartość zależy od bycia wybraną?",
        "Jak często zdradzasz własne potrzeby żeby utrzymać harmonię? Gdzie utrzymywanie pokoju kosztowało cię siebie samą?",
        "Jak by się czuło być całą bez partnera, lustra, publiczności? Jaką pustkę wypełniasz innymi?",
        "Spędź w tym tygodniu czas sama robiąc coś co zwykle robisz z kimś innym. Co odkrywasz o sobie?",
      ],
    },
    Scorpio: {
      en: [
        "Where do you feel that trusting someone will inevitably lead to betrayal? When was the first time your trust was broken?",
        "How often do you test people before letting them in or push them away before they can leave? Where is this pattern?",
        "What would it feel like to be completely vulnerable without a backup plan? What are you protecting by keeping walls up?",
        "Trust someone this week with something small that feels big. Not as a test. What changes inside you?",
      ],
      pl: [
        "Gdzie czujesz że zaufanie komuś nieuchronnie doprowadzi do zdrady? Kiedy po raz pierwszy twoje zaufanie zostało złamane?",
        "Jak często testujesz ludzi zanim ich wpuścisz lub odpychasz zanim zdążą odejść? Gdzie jest ten wzorzec?",
        "Jak by się czuło być całkowicie bezbronną bez planu awaryjnego? Co chronisz trzymając mury?",
        "Zaufaj komuś w tym tygodniu z czymś małym co czuje się duże. Nie jako test. Co zmienia się w tobie?",
      ],
    },
    Sagittarius: {
      en: [
        "Where do you feel like you will never find the meaning you are looking for? When did your search for truth become running?",
        "How often do you use travel, philosophy or new experiences to avoid sitting with the wound that no answer can fix?",
        "What would it feel like to stop searching and simply be with what is? What question are you afraid has no answer?",
        "Stay still this week when you want to move. What comes up when there is nowhere to go?",
      ],
      pl: [
        "Gdzie czujesz że nigdy nie znajdziesz sensu którego szukasz? Kiedy twoje poszukiwanie prawdy stało się uciekaniem?",
        "Jak często używasz podróży, filozofii lub nowych doświadczeń żeby uniknąć siedzenia z raną której żadna odpowiedź nie naprawi?",
        "Jak by się czuło przestać szukać i po prostu być z tym co jest? Jakiego pytania boisz się że nie ma odpowiedzi?",
        "Zostań w tym tygodniu w miejscu kiedy chcesz się ruszyć. Co się pojawia kiedy nie ma dokąd iść?",
      ],
    },
    Capricorn: {
      en: [
        "Where do you feel like you have to carry everything alone? When did you learn that asking for help means you are weak?",
        "How often do you use achievement to prove you are not the abandoned or overlooked child you once were?",
        "What would it feel like to fail publicly and still be okay? What are you building to protect that child?",
        "Ask for help this week with something you could do alone. What does it cost you? What does it give you?",
      ],
      pl: [
        "Gdzie czujesz że musisz dźwigać wszystko sama? Kiedy nauczyłaś się że proszenie o pomoc oznacza że jesteś słaba?",
        "Jak często używasz osiągnięć żeby udowodnić że nie jesteś tym porzuconym lub pominiętym dzieckiem którym kiedyś byłaś?",
        "Jak by się czuło publicznie ponieść porażkę i nadal być okay? Co budujesz żeby chronić to dziecko?",
        "Poproś w tym tygodniu o pomoc z czymś co mogłabyś zrobić sama. Co cię to kosztuje? Co ci daje?",
      ],
    },
    Aquarius: {
      en: [
        "Where do you feel like you do not belong anywhere? When did you learn that being different means being alone?",
        "How often do you use uniqueness as armor against intimacy? Where does belonging feel like a threat to who you are?",
        "What would it feel like to be fully accepted by a group without losing yourself? What are you afraid they will take?",
        "Join something this week where you are not the expert or the outsider. Just a member. What does that feel like?",
      ],
      pl: [
        "Gdzie czujesz że nie pasujesz nigdzie? Kiedy nauczyłaś się że bycie inną oznacza bycie samą?",
        "Jak często używasz wyjątkowości jako pancerza przeciw bliskości? Gdzie przynależność czuje się jak zagrożenie dla tego kim jesteś?",
        "Jak by się czuło być w pełni zaakceptowaną przez grupę bez tracenia siebie? Czego boisz się że zabiorą?",
        "Dołącz w tym tygodniu do czegoś gdzie nie jesteś ekspertką ani outsiderką. Tylko członkinią. Jak to się czuje?",
      ],
    },
    Pisces: {
      en: [
        "Where do you absorb other people's pain and call it empathy? When did you learn that feeling everything is your role?",
        "How often do you sacrifice your boundaries to save someone else? Where does compassion become self-erasure?",
        "What would it feel like to witness suffering without absorbing it? What are you afraid will happen if you stop carrying it?",
        "Set one boundary this week with someone in pain. Stay compassionate but separate. What does healthy empathy feel like?",
      ],
      pl: [
        "Gdzie wchłaniasz ból innych ludzi i nazywasz to empatią? Kiedy nauczyłaś się że czucie wszystkiego to twoja rola?",
        "Jak często poświęcasz swoje granice żeby ratować kogoś innego? Gdzie współczucie staje się samowykasowaniem?",
        "Jak by się czuło być świadkiem cierpienia bez wchłaniania go? Czego boisz się że się stanie jeśli przestaniesz to dźwigać?",
        "Postaw w tym tygodniu jedną granicę z kimś kto cierpi. Zostań współczująca ale oddzielona. Jak czuje się zdrowa empatia?",
      ],
    },
  };

  const questions = signQuestions[sign] || signQuestions.Aries;
  return lang === "pl" ? questions.pl : questions.en;
}

export default function ChironWorkbookPage() {
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

  useEffect(() => { init(); }, [language]);

  const init = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: profile } = await supabase.from("profiles").select("birth_date, birth_time, birth_city, is_premium, is_admin").eq("id", user.id).single();
    if (!profile?.birth_date) { router.push("/onboarding"); return; }

    if (!profile.is_admin) {
      const { data: chironProduct } = await supabase.from("shop_products").select("id").eq("name", "Chiron Workbook").single();
      const { data: bundleProduct } = await supabase.from("shop_products").select("id").eq("name", "Depth Work Bundle").single();
      const productIds = [chironProduct?.id, bundleProduct?.id].filter(Boolean);
      const { data: purchases } = await supabase.from("user_purchases").select("id").eq("user_id", user.id).in("product_id", productIds);
      if ((purchases || []).length === 0 && !profile.is_premium) { router.push("/shop"); return; }
    }

    const chart = calculateNatalChart(profile.birth_date, profile.birth_time, profile.birth_city);
    setNatalSign(chart.chiron.sign);
    setNatalDescription(pl ? chart.chiron.descriptionPl : chart.chiron.description);
    setQuestions(buildChironQuestions(chart.chiron.sign, lang));

    const { data: sessions } = await supabase
      .from("workbook_progress").select("*").eq("user_id", user.id).eq("workbook_type", "chiron")
      .order("started_at", { ascending: false });

    const allSessions = (sessions as Session[]) || [];
    const active = allSessions.find(s => !s.completed_at);
    const past = allSessions.filter(s => s.completed_at);

    if (active) {
      setSession(active);
      const responses = active.responses || [];
      setCurrentStage(responses.length);
      if (responses.length > 0) setAiReaction(responses[responses.length - 1].ai_reaction || null);
    }

    setPastSessions(past);
    setLoading(false);
  };

  const startSession = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("workbook_progress").insert({
      user_id: user.id, workbook_type: "chiron", cycle_number: pastSessions.length + 1, responses: [],
    }).select().single();
    if (data) { setSession(data as Session); setCurrentStage(0); setAiReaction(null); setResponse(""); }
  };

  const handleSubmit = async () => {
    if (!response.trim() || !session || !natalSign) return;
    setSaving(true);
    setReacting(true);
    let reaction = "";
    try {
      const res = await fetch("/api/workbook-planetary", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: currentStage + 1, response: response.trim(), planet: "chiron", natalSign, language: lang }),
      });
      const data = await res.json();
      reaction = data.reaction || "";
    } catch {}
    setReacting(false);

    const supabase = createClient();
    const updatedResponses = [...(session.responses || []), {
      stage: currentStage + 1, question: questions[currentStage], response: response.trim(), ai_reaction: reaction, timestamp: new Date().toISOString(),
    }];
    const isComplete = currentStage === 3;
    await supabase.from("workbook_progress").update({
      responses: updatedResponses, completed_at: isComplete ? new Date().toISOString() : null,
    }).eq("id", session.id);

    setSession({ ...session, responses: updatedResponses, completed_at: isComplete ? new Date().toISOString() : null });
    setAiReaction(reaction);
    setResponse("");
    setSaving(false);
  };

  const nextStage = () => { setCurrentStage(currentStage + 1); setAiReaction(null); };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-cream)" }}>
      <p style={{ color: "var(--color-mauve)", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
        {pl ? "Szukam rany..." : "Finding the wound..."}
      </p>
    </div>
  );

  const canStartNew = pastSessions.length > 0 && !session && (() => {
    const last = pastSessions[0];
    if (!last.completed_at) return false;
    return Date.now() - new Date(last.completed_at).getTime() > 30 * 24 * 60 * 60 * 1000;
  })();

  const daysSinceLast = pastSessions.length > 0 && pastSessions[0].completed_at
    ? Math.floor((Date.now() - new Date(pastSessions[0].completed_at).getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-cream)" }}>
      <main className="max-w-lg mx-auto px-5 py-8 space-y-6">
        <div className="space-y-2">
          <button onClick={() => router.back()} className="text-sm block text-left" style={{ color: "var(--color-mauve)" }}>{pl ? "← Wróć" : "← Back"}</button>
          <h1 className="text-2xl text-center" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: "var(--color-dark)", fontWeight: 700 }}>
            {pl ? "Zeszyt Chirona" : "Chiron Workbook"}
          </h1>
          {natalSign && (
            <p className="text-sm text-center" style={{ color: "var(--color-plum)", fontWeight: 600 }}>{pl ? `Chiron w ${natalSign}` : `Chiron in ${natalSign}`}</p>
          )}
          <p className="text-sm leading-relaxed text-center" style={{ color: "var(--color-mauve)", lineHeight: 1.7 }}>{natalDescription}</p>
        </div>

        {!session && (
          <div className="space-y-4">
            {pastSessions.length === 0 ? (
              <div className="text-center space-y-4">
                <p className="text-sm" style={{ color: "var(--color-mauve)", fontStyle: "italic", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  {pl ? "Pierwszy cykl. Cztery pytania. Cztery warstwy." : "First cycle. Four questions. Four layers."}
                </p>
                <button onClick={startSession} className="w-full py-3 rounded-xl text-sm"
                  style={{ background: "linear-gradient(135deg, var(--color-plum), var(--color-mauve))", color: "var(--color-cream)", fontWeight: 600 }}>
                  {pl ? "Rozpocznij" : "Begin"}
                </button>
              </div>
            ) : (
              <div className="text-center space-y-3">
                {canStartNew ? (
                  <>
                    <p className="text-sm" style={{ color: "var(--color-mauve)", fontStyle: "italic", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                      {pl ? `Cykl ${pastSessions.length + 1}. Pytania się zmieniły. Ty też.` : `Cycle ${pastSessions.length + 1}. The questions changed. So did you.`}
                    </p>
                    <button onClick={startSession} className="w-full py-3 rounded-xl text-sm"
                      style={{ background: "linear-gradient(135deg, var(--color-plum), var(--color-mauve))", color: "var(--color-cream)", fontWeight: 600 }}>
                      {pl ? "Następny cykl" : "Next cycle"}
                    </button>
                  </>
                ) : (
                  <div className="p-4 rounded-xl" style={{ background: "var(--color-blush)" }}>
                    <p className="text-sm" style={{ color: "var(--color-mauve)" }}>
                      {pl ? `Następny cykl dostępny za ${30 - (daysSinceLast || 0)} dni. Rana potrzebuje czasu. Daj jej go.`
                        : `Next cycle available in ${30 - (daysSinceLast || 0)} days. The wound needs time. Give it that.`}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {session && !session.completed_at && (
          <div className="space-y-6">
            <div className="flex justify-center gap-3">
              {STAGE_LABELS[lang].map((label, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs"
                    style={{
                      background: i < currentStage ? "var(--color-plum)" : i === currentStage ? "var(--color-gold)" : "var(--color-blush)",
                      border: `1.5px solid ${i <= currentStage ? "var(--color-plum)" : "var(--color-dusty-rose)"}`,
                      color: i <= currentStage ? "var(--color-cream)" : "var(--color-mauve)", fontWeight: 600,
                    }}>{i + 1}</div>
                  <span className="text-xs" style={{ color: i <= currentStage ? "var(--color-plum)" : "var(--color-dusty-rose)", fontSize: "9px" }}>{label}</span>
                </div>
              ))}
            </div>

            <p className="text-sm text-center" style={{ color: "var(--color-mauve)", fontStyle: "italic", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              {STAGE_INTROS[lang][currentStage]}
            </p>

            {aiReaction && currentStage > 0 && currentStage <= 3 && (
              <div className="p-4 rounded-xl" style={{ background: "var(--color-blush)", borderLeft: "3px solid var(--color-gold)" }}>
                <p className="text-sm" style={{ color: "var(--color-dark)", lineHeight: 1.7, textAlign: "justify" }}>{aiReaction}</p>
              </div>
            )}

            <div className="space-y-3">
              <p style={{ color: "var(--color-dark)", fontWeight: 600, lineHeight: 1.7, fontSize: "0.95rem" }}>{questions[currentStage]}</p>
              <textarea value={response} onChange={e => setResponse(e.target.value)} rows={6}
                className="w-full rounded-xl p-4 text-sm resize-none focus:outline-none"
                style={{ background: "var(--color-blush)", color: "var(--color-dark)", border: "1px solid var(--color-dusty-rose)", fontFamily: "'Cormorant Garamond', Georgia, serif", lineHeight: 1.7 }}
                placeholder={pl ? "Twoja odpowiedź..." : "Your response..."} />
              <button onClick={handleSubmit} disabled={saving || !response.trim()} className="w-full py-3 rounded-xl text-sm transition-all"
                style={{
                  background: response.trim() ? "linear-gradient(135deg, var(--color-plum), var(--color-mauve))" : "var(--color-blush)",
                  color: response.trim() ? "var(--color-cream)" : "var(--color-dusty-rose)", fontWeight: 600,
                }}>
                {saving ? (pl ? "Zapisuję..." : "Saving...") : reacting ? (pl ? "Czytam..." : "Reading...") : (pl ? "Zapisz" : "Save")}
              </button>
            </div>
          </div>
        )}

        {session && session.completed_at && aiReaction && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl" style={{ background: "var(--color-blush)", borderLeft: "3px solid var(--color-gold)" }}>
              <p className="text-sm" style={{ color: "var(--color-dark)", lineHeight: 1.7, textAlign: "justify" }}>{aiReaction}</p>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ background: "var(--color-blush)" }}>
              <p className="text-sm" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
                {pl ? "Cykl ukończony." : "Cycle complete."}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--color-mauve)" }}>
                {pl ? "Następny cykl za 30 dni. Leczenie nie jest liniowe." : "Next cycle in 30 days. Healing is not linear."}
              </p>
            </div>
          </div>
        )}

        {session && !session.completed_at && aiReaction && currentStage < 4 && (session.responses || []).length > currentStage && (
          <div className="space-y-3">
            <button onClick={nextStage} className="w-full py-3 rounded-xl text-sm"
              style={{ background: "var(--color-blush)", color: "var(--color-plum)", fontWeight: 600, border: "1px solid var(--color-dusty-rose)" }}>
              {pl ? "Następny etap →" : "Next stage →"}
            </button>
          </div>
        )}

        {pastSessions.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm" style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
              {pl ? "Poprzednie cykle" : "Past cycles"}
            </p>
            {pastSessions.map(s => (
              <div key={s.id}>
                <button onClick={() => setExpandedPast(expandedPast === s.id ? null : s.id)}
                  className="w-full text-left p-3 rounded-xl" style={{ background: "var(--color-blush)" }}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: "var(--color-dark)" }}>{pl ? `Cykl ${s.cycle_number}` : `Cycle ${s.cycle_number}`}</span>
                    <span className="text-xs" style={{ color: "var(--color-mauve)" }}>{new Date(s.started_at).toLocaleDateString()}</span>
                  </div>
                </button>
                {expandedPast === s.id && (
                  <div className="mt-2 space-y-3 px-2">
                    {(s.responses || []).map((r: any, i: number) => (
                      <div key={i} className="space-y-1">
                        <p className="text-xs" style={{ color: "var(--color-plum)", fontWeight: 600 }}>{STAGE_LABELS[lang][i]}</p>
                        <p className="text-xs" style={{ color: "var(--color-mauve)", fontStyle: "italic" }}>{r.question}</p>
                        <p className="text-sm" style={{ color: "var(--color-dark)", lineHeight: 1.6 }}>{r.response}</p>
                        {r.ai_reaction && (
                          <p className="text-xs" style={{ color: "var(--color-mauve)", borderLeft: "2px solid var(--color-gold)", paddingLeft: "8px", lineHeight: 1.5 }}>
                            {r.ai_reaction}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}