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
    "Saturn asks where you are pretending. Not where you are failing. Where you built a structure around avoiding what you actually need to face.",
    "You described the wall. Now let us look at where you keep rebuilding it. Saturn repeats until you stop.",
    "Underneath every rigid structure there is something soft you are protecting. What is it?",
    "You see the pattern. You feel what is underneath. Now: what structure do you actually need? Not the one fear built. The one you choose.",
  ],
  pl: [
    "Saturn pyta gdzie udajesz. Nie gdzie ci nie wychodzi. Gdzie zbudowałaś strukturę wokół unikania tego z czym naprawdę musisz się zmierzyć.",
    "Opisałaś mur. Teraz popatrzmy gdzie ciągle go odbudowujesz. Saturn powtarza dopóki nie przestaniesz.",
    "Pod każdą sztywną strukturą jest coś miękkiego co chronisz. Co to jest?",
    "Widzisz wzorzec. Czujesz co jest pod spodem. Teraz: jakiej struktury naprawdę potrzebujesz? Nie tej którą zbudował lęk. Tej którą wybierasz.",
  ],
};

function buildSaturnQuestions(sign: string, lang: "en" | "pl"): string[] {
  const signQuestions: Record<string, { en: string[]; pl: string[] }> = {
    Aries: {
      en: [
        "Where do you hesitate to act on your own authority? What happens in your body when nobody tells you what to do?",
        "How many times have you either forced something through or frozen completely? Where does this pattern show up most?",
        "What are you afraid will happen if you lead without permission? Whose voice is telling you that you are not ready?",
        "Name one area where you will act from your own authority this week. Not force. Not freeze. Decide.",
      ],
      pl: [
        "Gdzie wahasz się żeby działać z własnego autorytetu? Co się dzieje w twoim ciele kiedy nikt ci nie mówi co robić?",
        "Ile razy albo przebijałaś się siłą albo kompletnie zamierałaś? Gdzie ten wzorzec pojawia się najczęściej?",
        "Czego się boisz że się stanie jeśli poprowadzisz bez pozwolenia? Czyj głos mówi ci że nie jesteś gotowa?",
        "Wymień jeden obszar gdzie w tym tygodniu zadziałasz z własnego autorytetu. Nie siła. Nie zamrożenie. Decyzja.",
      ],
    },
    Taurus: {
      en: [
        "What is your relationship with security? Do you hold too tight to what you have or convince yourself you do not need anything?",
        "Where do you sacrifice flexibility for stability? Where has this cost you something real?",
        "What would it feel like to trust that you are enough without the safety net? What are you actually afraid of losing?",
        "What is one thing you are holding onto for security that you could release this week? What would you do with that space?",
      ],
      pl: [
        "Jaka jest twoja relacja z bezpieczeństwem? Trzymasz się za mocno tego co masz czy przekonujesz siebie że niczego nie potrzebujesz?",
        "Gdzie poświęcasz elastyczność na rzecz stabilności? Gdzie to cię kosztowało coś prawdziwego?",
        "Jak by się czuło zaufanie że wystarczasz bez siatki bezpieczeństwa? Czego tak naprawdę boisz się stracić?",
        "Czego jednego trzymasz się dla bezpieczeństwa a mogłabyś to puścić w tym tygodniu? Co byś zrobiła z tą przestrzenią?",
      ],
    },
    Gemini: {
      en: [
        "Do you scatter your energy across too many things to avoid going deep into one? When did you last finish what you started?",
        "Where do you use words, information or humor to avoid being pinned down? Where does this protect you?",
        "What happens when you stop talking and sit with silence? What comes up that you normally talk over?",
        "Choose one commitment this week and follow it through without switching. What does that require from you?",
      ],
      pl: [
        "Czy rozpraszasz energię na zbyt wiele rzeczy żeby uniknąć zagłębienia się w jedną? Kiedy ostatnio skończyłaś to co zaczęłaś?",
        "Gdzie używasz słów, informacji lub humoru żeby uniknąć przyparcia do muru? Gdzie to cię chroni?",
        "Co się dzieje kiedy przestajesz mówić i siedzisz z ciszą? Co się pojawia, co normalnie zagadajesz?",
        "Wybierz jedno zobowiązanie w tym tygodniu i doprowadź je do końca bez przeskakiwania. Czego to od ciebie wymaga?",
      ],
    },
    Cancer: {
      en: [
        "Where do you use caretaking as a way to avoid dealing with your own needs? When did someone last take care of you?",
        "How often do you create emotional debt by giving more than you have? Where does this pattern repeat?",
        "What happens when nobody needs you? Who are you when you are not taking care of someone?",
        "This week, let someone take care of you without deflecting. What does it feel like to receive?",
      ],
      pl: [
        "Gdzie używasz opiekowania się innymi żeby uniknąć zajmowania się własnymi potrzebami? Kiedy ktoś ostatnio zaopiekował się tobą?",
        "Jak często tworzysz emocjonalny dług dając więcej niż masz? Gdzie ten wzorzec się powtarza?",
        "Co się dzieje kiedy nikt cię nie potrzebuje? Kim jesteś kiedy nie opiekujesz się kimś?",
        "W tym tygodniu pozwól komuś się tobą zaopiekować bez odwracania uwagi. Jak czujesz się przyjmując?",
      ],
    },
    Leo: {
      en: [
        "Where do you need recognition to feel that what you did was real? What happens when nobody sees you?",
        "Where do you dim yourself to avoid rejection and where do you perform to avoid being ordinary?",
        "What would it mean to create something and show it to nobody? What is your worth if nobody applauds?",
        "Do one thing this week purely for yourself. No audience. No feedback. What does it feel like?",
      ],
      pl: [
        "Gdzie potrzebujesz uznania żeby poczuć że to co zrobiłaś było prawdziwe? Co się dzieje kiedy nikt cię nie widzi?",
        "Gdzie przygaszasz siebie żeby uniknąć odrzucenia a gdzie występujesz żeby uniknąć bycia zwyczajną?",
        "Co by oznaczało stworzyć coś i nikomu tego nie pokazać? Ile jesteś warta jeśli nikt nie klaszcze?",
        "Zrób w tym tygodniu jedną rzecz czysto dla siebie. Bez publiczności. Bez feedbacku. Jak to się czuje?",
      ],
    },
    Virgo: {
      en: [
        "Where does your need to improve things become a way to avoid accepting them as they are? Including yourself.",
        "How many times have you fixed something that was not broken? Where do you repeat this?",
        "What would it mean to be imperfect and still enough? What are you trying to earn through perfection?",
        "Leave one thing imperfect this week on purpose. What does your body do when you resist the urge to fix it?",
      ],
      pl: [
        "Gdzie twoja potrzeba ulepszania staje się sposobem na unikanie akceptacji tego jaki coś jest? Włącznie z sobą.",
        "Ile razy naprawiałaś coś co nie było zepsute? Gdzie to powtarzasz?",
        "Co by oznaczało być niedoskonałą i nadal wystarczającą? Co próbujesz zarobić przez perfekcję?",
        "Zostaw w tym tygodniu jedną rzecz celowo niedoskonałą. Co robi twoje ciało kiedy powstrzymujesz odruch naprawiania?",
      ],
    },
    Libra: {
      en: [
        "Where do you abandon your own position to keep the peace? When did you last disagree openly?",
        "How often do you shape yourself to fit what someone else needs? Where does this pattern cost you?",
        "What are you afraid will happen if people see your real opinion? Whose approval are you managing?",
        "Express one honest disagreement this week without softening it into a compromise. What changes?",
      ],
      pl: [
        "Gdzie porzucasz własne stanowisko żeby utrzymać spokój? Kiedy ostatnio otwarcie się nie zgodziłaś?",
        "Jak często dopasowujesz się do tego czego ktoś inny potrzebuje? Gdzie ten wzorzec cię kosztuje?",
        "Czego się boisz że się stanie jeśli ludzie zobaczą twoją prawdziwą opinię? Czyją aprobatą zarządzasz?",
        "Wyrazi w tym tygodniu jedną szczerą niezgodę bez łagodzenia jej w kompromis. Co się zmienia?",
      ],
    },
    Scorpio: {
      en: [
        "Where do you use control as a substitute for trust? What happens when you cannot predict the outcome?",
        "How many relationships or situations have you held onto past their end because letting go felt like losing?",
        "What would it feel like to be completely vulnerable without any guarantee of safety? What do you protect at all costs?",
        "Release one thing you are controlling this week. Not because it does not matter. Because you trust yourself to survive it.",
      ],
      pl: [
        "Gdzie używasz kontroli jako substytutu zaufania? Co się dzieje kiedy nie możesz przewidzieć wyniku?",
        "Ile relacji lub sytuacji trzymałaś po ich końcu bo puszczenie czuło się jak przegrana?",
        "Jak by się czuła pełna bezbronność bez żadnej gwarancji bezpieczeństwa? Co chronisz za wszelką cenę?",
        "Puść w tym tygodniu jedną rzecz którą kontrolujesz. Nie dlatego że nie ma znaczenia. Dlatego że ufasz sobie że to przeżyjesz.",
      ],
    },
    Sagittarius: {
      en: [
        "Where do you use freedom or philosophy as a way to avoid commitment? What are you running from by always expanding?",
        "How often do you leave before things get difficult? Where do you confuse movement with growth?",
        "What would it mean to stay? Not in a place. In a feeling. In a commitment. What are you afraid staying will reveal?",
        "Commit to one thing fully this week without planning your exit. What does loyalty to yourself actually look like?",
      ],
      pl: [
        "Gdzie używasz wolności lub filozofii żeby uniknąć zobowiązania? Przed czym uciekasz ciągle się rozszerzając?",
        "Jak często odchodzisz zanim robi się trudno? Gdzie mylisz ruch z rozwojem?",
        "Co by oznaczało zostać? Nie w miejscu. W uczuciu. W zobowiązaniu. Czego boisz się że zostawanie ujawni?",
        "Zobowiąż się w tym tygodniu do jednej rzeczy w pełni bez planowania wyjścia. Jak naprawdę wygląda lojalność wobec siebie?",
      ],
    },
    Capricorn: {
      en: [
        "Where has ambition become a wall between you and the people around you? When did work stop being a choice and start being a hiding place?",
        "How often do you measure your worth by what you have achieved? Where does this pattern leave you empty?",
        "If you stopped achieving tomorrow, who would you be? What is underneath the drive?",
        "Do something this week that has no productive value. Rest without earning it. What does that bring up?",
      ],
      pl: [
        "Gdzie ambicja stała się murem między tobą a ludźmi wokół? Kiedy praca przestała być wyborem a zaczęła być kryjówką?",
        "Jak często mierzysz swoją wartość tym co osiągnęłaś? Gdzie ten wzorzec zostawia cię pustą?",
        "Gdybyś jutro przestała osiągać, kim byś była? Co jest pod napędem?",
        "Zrób w tym tygodniu coś co nie ma żadnej produktywnej wartości. Odpocznij bez zarabiania na to. Co to wywołuje?",
      ],
    },
    Aquarius: {
      en: [
        "Where do you use detachment or intellectual distance to avoid emotional intimacy? When did you last let someone truly in?",
        "How often do you position yourself as different to avoid being vulnerable? Where does this isolate you?",
        "What would it feel like to need someone without framing it as weakness? What are you protecting by staying independent?",
        "Let someone see you without your ideas, your causes, your difference this week. Just you. What remains?",
      ],
      pl: [
        "Gdzie używasz dystansu lub intelektualnej odległości żeby uniknąć emocjonalnej bliskości? Kiedy ostatnio naprawdę kogoś wpuściłaś?",
        "Jak często pozycjonujesz się jako inna żeby uniknąć bycia bezbronną? Gdzie to cię izoluje?",
        "Jak by się czuło potrzebowanie kogoś bez ramowania tego jako słabość? Co chronisz pozostając niezależną?",
        "Pozwól komuś w tym tygodniu zobaczyć cię bez twoich idei, spraw, różności. Tylko ciebie. Co zostaje?",
      ],
    },
    Pisces: {
      en: [
        "Where do you dissolve into other people's emotions to avoid facing your own? When did you last know where you end and someone else begins?",
        "How often do you escape into fantasy, spirituality or numbing when reality asks too much? Where does this repeat?",
        "What would it mean to be fully present in your own life without an escape route? What are you afraid reality will show you?",
        "Stay present with one uncomfortable reality this week without softening it with imagination. What do you find?",
      ],
      pl: [
        "Gdzie rozpuszczasz się w emocjach innych ludzi żeby uniknąć zmierzenia się z własnymi? Kiedy ostatnio wiedziałaś gdzie ty się kończysz a ktoś inny zaczyna?",
        "Jak często uciekasz w fantazję, duchowość lub znieczulenie kiedy rzeczywistość wymaga za dużo? Gdzie to się powtarza?",
        "Co by oznaczało być w pełni obecną we własnym życiu bez drogi ucieczki? Czego boisz się że rzeczywistość ci pokaże?",
        "Bądź obecna z jedną niewygodną rzeczywistością w tym tygodniu bez łagodzenia jej wyobraźnią. Co znajdujesz?",
      ],
    },
  };

  const questions = signQuestions[sign] || signQuestions.Aries;
  return lang === "pl" ? questions.pl : questions.en;
}

export default function SaturnWorkbookPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const lang = language as "en" | "pl";
  const pl = lang === "pl";

  const [loading, setLoading] = useState(true);
  const [natalSign, setNatalSign] = useState<string | null>(null);
  const [natalSignPl, setNatalSignPl] = useState<string | null>(null);
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
    if (!profile?.birth_date) {
      router.push("/onboarding");
      return;
    }

    if (!profile.is_admin) {
      const { data: saturnProduct } = await supabase.from("shop_products").select("id").eq("name", "Saturn Workbook").single();
      const { data: bundleProduct } = await supabase.from("shop_products").select("id").eq("name", "Depth Work Bundle").single();
      const productIds = [saturnProduct?.id, bundleProduct?.id].filter(Boolean);

      const { data: purchases } = await supabase
        .from("user_purchases")
        .select("id")
        .eq("user_id", user.id)
        .in("product_id", productIds);

      const hasPurchased = (purchases || []).length > 0;

      if (!hasPurchased && !profile.is_premium) {
        router.push("/shop");
        return;
      }
    }

    const chart = calculateNatalChart(profile.birth_date, profile.birth_time, profile.birth_city);
    setNatalSign(chart.saturn.sign);
    setNatalSignPl(chart.saturn.signPl);
    setNatalDescription(pl ? chart.saturn.descriptionPl : chart.saturn.description);
    setQuestions(buildSaturnQuestions(chart.saturn.sign, lang));

    const { data: sessions } = await supabase
      .from("workbook_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("workbook_type", "saturn")
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
      workbook_type: "saturn",
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

    setReacting(true);
    let reaction = "";
    try {
      const res = await fetch("/api/workbook-planetary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: currentStage + 1,
          response: response.trim(),
          planet: "saturn",
          natalSign,
          language: lang,
        }),
      });
      const data = await res.json();
      reaction = data.reaction || "";
    } catch {}
    setReacting(false);

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

    if (!isComplete) {
      setSaving(false);
    } else {
      setSaving(false);
    }
  };

  const nextStage = () => {
    setCurrentStage(currentStage + 1);
    setAiReaction(null);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-cream)" }}>
      <p style={{ color: "var(--color-mauve)", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
        {pl ? "Sprawdzam twoje struktury..." : "Checking your structures..."}
      </p>
    </div>
  );

  const canStartNew = pastSessions.length > 0 && !session && (() => {
    const last = pastSessions[0];
    if (!last.completed_at) return false;
    const diff = Date.now() - new Date(last.completed_at).getTime();
    return diff > 30 * 24 * 60 * 60 * 1000;
  })();

  const daysSinceLast = pastSessions.length > 0 && pastSessions[0].completed_at
    ? Math.floor((Date.now() - new Date(pastSessions[0].completed_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-cream)" }}>
      <main className="max-w-lg mx-auto px-5 py-8 space-y-6">

        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
              ← {pl ? "Wróć" : "Back"}
            </button>
            <div className="w-12" />
          </div>
          <h1 className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3"
            style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>
            {pl ? "Zeszyt Saturna" : "Saturn Workbook"}
          </h1>
        </div>

        <section className="text-center space-y-2">
          <p className="text-xs tracking-[0.2em] uppercase" style={{ color: "var(--color-gold)", fontWeight: 600 }}>
            {pl ? "Twój Saturn" : "Your Saturn"}
          </p>
          <p className="text-2xl" style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>
            {pl ? `Saturn w ${natalSignPl || natalSign}` : `Saturn in ${natalSign}`}
          </p>
          <p className="leading-relaxed max-w-md mx-auto" style={{ color: "var(--color-mauve)", fontSize: "0.95rem", lineHeight: 1.7 }}>
            {natalDescription}
          </p>
        </section>

        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
          <span style={{ color: "var(--color-gold)", fontSize: "1.1rem" }}>♄</span>
          <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
        </div>

        {/* No active session */}
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
                      {pl
                        ? `Następny cykl dostępny za ${30 - (daysSinceLast || 0)} dni. Saturn nie spieszy się. Ty też nie musisz.`
                        : `Next cycle available in ${30 - (daysSinceLast || 0)} days. Saturn does not rush. Neither should you.`}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Active session */}
        {session && !session.completed_at && (
          <div className="space-y-6">
            {/* Progress bars */}
            <div className="space-y-3">
              <div className="flex gap-2">
                {STAGE_LABELS[lang].map((label, i) => (
                  <div key={i} className="flex-1 h-1 rounded-full" style={{
                    background: i < currentStage ? "var(--color-plum)" : i === currentStage ? "var(--color-gold)" : "var(--color-dusty-rose)",
                    opacity: i > currentStage ? 0.3 : 1,
                  }} />
                ))}
              </div>
              <p className="text-center" style={{ color: "var(--color-plum)", fontSize: "0.85rem", fontWeight: 500, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                {pl ? `Etap ${currentStage + 1} z 4` : `Stage ${currentStage + 1} of 4`}
                <span style={{ color: "var(--color-dusty-rose)", margin: "0 6px" }}>·</span>
                {STAGE_LABELS[lang][currentStage]}
              </p>
            </div>

            {/* Stage intro */}
            <p className="text-center" style={{ color: "var(--color-mauve)", fontStyle: "italic", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1rem", lineHeight: 1.8 }}>
              {STAGE_INTROS[lang][currentStage]}
            </p>

            {/* AI reaction from previous stage */}
            {aiReaction && currentStage > 0 && currentStage <= 3 && (
              <div className="p-4 rounded-xl" style={{ background: "var(--color-blush)", borderLeft: "3px solid var(--color-gold)" }}>
                <p style={{ color: "var(--color-dark)", lineHeight: 1.8, textAlign: "justify", fontSize: "0.95rem" }}>{aiReaction}</p>
              </div>
            )}

            {/* Question */}
            <div className="space-y-3">
              <p style={{ color: "var(--color-dark)", fontWeight: 600, lineHeight: 1.8, fontSize: "0.9rem" }}>{questions[currentStage]}</p>
              <textarea
                value={response}
                onChange={e => setResponse(e.target.value)}
                rows={6}
                className="w-full rounded-xl p-4 resize-none focus:outline-none"
                style={{ background: "var(--color-blush)", color: "var(--color-dark)", border: "1px solid var(--color-dusty-rose)", fontFamily: "'Cormorant Garamond', Georgia, serif", lineHeight: 1.7, fontSize: "0.95rem" }}
                placeholder={pl ? "Twoja odpowiedź..." : "Your response..."}
              />
              <button onClick={handleSubmit} disabled={saving || !response.trim()}
                className="w-full py-3 rounded-xl transition-all"
                style={{
                  background: response.trim() ? "linear-gradient(135deg, var(--color-plum), var(--color-mauve))" : "var(--color-blush)",
                  color: response.trim() ? "var(--color-cream)" : "var(--color-dusty-rose)",
                  fontWeight: 600, fontSize: "0.95rem",
                }}>
                {saving ? (pl ? "Zapisuję..." : "Saving...") : reacting ? (pl ? "Czytam..." : "Reading...") : (pl ? "Zapisz" : "Save")}
              </button>
            </div>
          </div>
        )}

        {/* Just completed — show final reaction */}
        {session && session.completed_at && aiReaction && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl" style={{ background: "var(--color-blush)", borderLeft: "3px solid var(--color-gold)" }}>
              <p className="text-sm" style={{ color: "var(--color-dark)", lineHeight: 1.7, textAlign: "justify" }}>
                {aiReaction}
              </p>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ background: "var(--color-blush)" }}>
              <p className="text-sm" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
                {pl ? "Cykl ukończony." : "Cycle complete."}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--color-mauve)" }}>
                {pl ? "Następny cykl za 30 dni. Daj sobie czas na integrację." : "Next cycle in 30 days. Give yourself time to integrate."}
              </p>
            </div>
          </div>
        )}

        {/* Between stages — show reaction and next button */}
        {session && !session.completed_at && aiReaction && currentStage < 4 && (session.responses || []).length > currentStage && (
          <div className="space-y-3">
            <button onClick={nextStage} className="w-full py-3 rounded-xl text-sm"
              style={{ background: "var(--color-blush)", color: "var(--color-plum)", fontWeight: 600, border: "1px solid var(--color-dusty-rose)" }}>
              {pl ? "Następny etap →" : "Next stage →"}
            </button>
          </div>
        )}

        {/* Past sessions */}
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
                    <span className="text-sm" style={{ color: "var(--color-dark)" }}>
                      {pl ? `Cykl ${s.cycle_number}` : `Cycle ${s.cycle_number}`}
                    </span>
                    <span className="text-xs" style={{ color: "var(--color-mauve)" }}>
                      {new Date(s.started_at).toLocaleDateString()}
                    </span>
                  </div>
                </button>
                {expandedPast === s.id && (
                  <div className="mt-2 space-y-3 px-2">
                    {(s.responses || []).map((r: any, i: number) => (
                      <div key={i} className="space-y-1">
                        <p className="text-xs" style={{ color: "var(--color-plum)", fontWeight: 600 }}>
                          {STAGE_LABELS[lang][i]}
                        </p>
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