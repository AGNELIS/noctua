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
    "The South Node is your comfort zone. The North Node is your growth. This is not about leaving one for the other. It is about knowing which one is running your life right now.",
    "You described where you default. Now look at how that default keeps you safe and stuck at the same time.",
    "The comfort zone is not comfortable. It is familiar. There is a difference. What would unfamiliar growth actually feel like in your body?",
    "You cannot abandon where you come from. But you can stop living there. What is one step toward where you are going?",
  ],
  pl: [
    "Węzeł Południowy to twoja strefa komfortu. Węzeł Północny to twój rozwój. Tu nie chodzi o porzucenie jednego dla drugiego. Chodzi o wiedzenie które z nich steruje teraz twoim życiem.",
    "Opisałaś gdzie wracasz domyślnie. Teraz popatrz jak to domyślne trzyma cię jednocześnie bezpiecznie i w miejscu.",
    "Strefa komfortu nie jest komfortowa. Jest znajoma. Jest różnica. Jak nieznajomy rozwój czułby się naprawdę w twoim ciele?",
    "Nie możesz porzucić skąd przychodzisz. Ale możesz przestać tam mieszkać. Jaki jest jeden krok w kierunku tego dokąd zmierzasz?",
  ],
};

function buildNodesQuestions(northSign: string, southSign: string, lang: "en" | "pl"): string[] {
  const nodeQuestions: Record<string, { en: string[]; pl: string[] }> = {
    "Aries-Libra": {
      en: [
        "Where do you lose yourself in other people's needs to avoid standing alone? When did you last make a decision purely for yourself?",
        "How often do you wait for someone else to go first, to validate your choice, or to give you permission? Where does this dependence repeat?",
        "What would it feel like to choose yourself without making it about anyone else? What are you afraid you will lose if you stop accommodating?",
        "Take one independent action this week that you would normally run by someone else first. What do you discover about yourself?",
      ],
      pl: [
        "Gdzie gubisz siebie w potrzebach innych żeby uniknąć stania samodzielnie? Kiedy ostatnio podjęłaś decyzję czysto dla siebie?",
        "Jak często czekasz aż ktoś inny pójdzie pierwszy, potwierdzi twój wybór lub da ci pozwolenie? Gdzie ta zależność się powtarza?",
        "Jak by się czuło wybrać siebie bez robienia z tego sprawy kogoś innego? Czego boisz się że stracisz jeśli przestaniesz się dostosowywać?",
        "Podejmij w tym tygodniu jedno niezależne działanie które normalnie najpierw konsultowałabyś z kimś innym. Co odkrywasz o sobie?",
      ],
    },
    "Taurus-Scorpio": {
      en: [
        "Where do you cling to stability because change feels like annihilation? What are you holding onto that has already ended?",
        "How often do you choose comfort over transformation? Where does playing it safe keep you from the depth you actually need?",
        "What would it feel like to let something valuable die because something more real is waiting? What is the loss you keep avoiding?",
        "Release one thing this week that gives you security but no growth. What emerges in the space it leaves?",
      ],
      pl: [
        "Gdzie trzymasz się stabilności bo zmiana czuje się jak unicestwienie? Czego się trzymasz co już się skończyło?",
        "Jak często wybierasz komfort zamiast transformacji? Gdzie granie bezpiecznie trzyma cię z dala od głębi której naprawdę potrzebujesz?",
        "Jak by się czuło pozwolić czemuś wartościowemu umrzeć bo coś bardziej prawdziwego czeka? Jaka jest ta strata której ciągle unikasz?",
        "Puść w tym tygodniu jedną rzecz która daje ci bezpieczeństwo ale nie rozwój. Co pojawia się w przestrzeni którą zostawia?",
      ],
    },
    "Gemini-Sagittarius": {
      en: [
        "Where do you hide behind big ideas, beliefs or philosophies to avoid dealing with the specific and the small? When did you last listen instead of preaching?",
        "How often do you escape into the big picture when the details need your attention? Where does your need to know everything prevent you from learning anything?",
        "What would it feel like to say I do not know without reaching for a philosophy to fill the gap? What happens when you sit with a question instead of answering it?",
        "Have one conversation this week where you only ask and listen. No opinions. No wisdom. What do you learn?",
      ],
      pl: [
        "Gdzie chowasz się za wielkimi ideami, przekonaniami lub filozofiami żeby uniknąć zajmowania się tym co konkretne i małe? Kiedy ostatnio słuchałaś zamiast głosić?",
        "Jak często uciekasz w wielki obraz kiedy szczegóły potrzebują twojej uwagi? Gdzie twoja potrzeba wiedzenia wszystkiego przeszkadza ci w nauczeniu się czegokolwiek?",
        "Jak by się czuło powiedzieć nie wiem bez sięgania po filozofię żeby wypełnić lukę? Co się dzieje kiedy siedzisz z pytaniem zamiast na nie odpowiadać?",
        "Przeprowadź w tym tygodniu jedną rozmowę w której tylko pytasz i słuchasz. Bez opinii. Bez mądrości. Czego się uczysz?",
      ],
    },
    "Cancer-Capricorn": {
      en: [
        "Where do you use achievement and control to avoid feeling vulnerable? When did you last let yourself need someone without earning it?",
        "How often do you build walls of competence around a soft interior that nobody gets to see? Where does this pattern isolate you?",
        "What would it feel like to be held without having to be strong? What did you learn about vulnerability that made you decide it was not safe?",
        "Let someone see you without your armor this week. Not in crisis. Just soft. What does that cost you and what does it give you?",
      ],
      pl: [
        "Gdzie używasz osiągnięć i kontroli żeby uniknąć poczucia bezbronności? Kiedy ostatnio pozwoliłaś sobie potrzebować kogoś bez zasługiwania na to?",
        "Jak często budujesz mury kompetencji wokół miękkiego wnętrza którego nikt nie widzi? Gdzie ten wzorzec cię izoluje?",
        "Jak by się czuło być trzymaną bez konieczności bycia silną? Czego nauczyłaś się o bezbronności że zdecydowałaś że nie jest bezpieczna?",
        "Pozwól komuś zobaczyć cię bez pancerza w tym tygodniu. Nie w kryzysie. Po prostu miękką. Co to cię kosztuje i co ci daje?",
      ],
    },
    "Leo-Aquarius": {
      en: [
        "Where do you disappear into the group, the cause or the idea to avoid the vulnerability of being personally seen? When did you last stand out on purpose?",
        "How often do you intellectualize your emotions or hide behind objectivity? Where does your detachment protect you from rejection?",
        "What would it feel like to be the center of attention and let it be personal? What are you afraid people will see if you stop hiding behind ideas?",
        "Create something personal this week and put your name on it. Not for a cause. For you. What does that bring up?",
      ],
      pl: [
        "Gdzie znikasz w grupie, sprawie lub idei żeby uniknąć bezbronności bycia widzianą osobiście? Kiedy ostatnio celowo się wyróżniłaś?",
        "Jak często intelektualizujesz emocje lub chowasz się za obiektywizmem? Gdzie twój dystans chroni cię przed odrzuceniem?",
        "Jak by się czuło być w centrum uwagi i pozwolić żeby to było osobiste? Czego boisz się że ludzie zobaczą jeśli przestaniesz chować się za ideami?",
        "Stwórz w tym tygodniu coś osobistego i podpisz się pod tym. Nie dla sprawy. Dla siebie. Co to wywołuje?",
      ],
    },
    "Virgo-Pisces": {
      en: [
        "Where do you escape into fantasy, spirituality or dissolution to avoid the discipline of showing up in reality? When did you last finish something imperfect instead of dreaming about perfection?",
        "How often do you sacrifice structure for flow? Where does your resistance to routine keep you from building anything lasting?",
        "What would it feel like to serve something real instead of imagining something ideal? What are you avoiding by staying in the dream?",
        "Complete one practical task this week that you have been postponing in favor of something more inspired. What does discipline give you that inspiration cannot?",
      ],
      pl: [
        "Gdzie uciekasz w fantazję, duchowość lub rozpuszczenie żeby uniknąć dyscypliny pojawiania się w rzeczywistości? Kiedy ostatnio skończyłaś coś niedoskonałego zamiast marzyć o perfekcji?",
        "Jak często poświęcasz strukturę na rzecz flow? Gdzie twój opór wobec rutyny przeszkadza ci w zbudowaniu czegoś trwałego?",
        "Jak by się czuło służyć czemuś prawdziwemu zamiast wyobrażać sobie coś idealnego? Czego unikasz zostając w marzeniu?",
        "Ukończ w tym tygodniu jedno praktyczne zadanie które odkładałaś na rzecz czegoś bardziej inspirującego. Co dyscyplina daje ci czego inspiracja nie może?",
      ],
    },
    "Libra-Aries": {
      en: [
        "Where do you act first and consider others later? When did independence become an excuse to avoid intimacy?",
        "How often do you start things alone because partnership feels like compromise? Where does self-reliance become isolation?",
        "What would it feel like to need someone without losing yourself? What are you afraid compromise will take from you?",
        "Collaborate with someone this week on something you would normally do alone. What do you learn about yourself in partnership?",
      ],
      pl: [
        "Gdzie działasz najpierw a bierzesz pod uwagę innych później? Kiedy niezależność stała się wymówką żeby uniknąć bliskości?",
        "Jak często zaczynasz rzeczy sama bo partnerstwo czuje się jak kompromis? Gdzie samowystarczalność staje się izolacją?",
        "Jak by się czuło potrzebować kogoś bez tracenia siebie? Czego boisz się że kompromis ci zabierze?",
        "Współpracuj z kimś w tym tygodniu nad czymś co normalnie robiłabyś sama. Czego uczysz się o sobie w partnerstwie?",
      ],
    },
    "Scorpio-Taurus": {
      en: [
        "Where do you create crisis because peace feels boring or suspicious? When did you last let something be simple?",
        "How often do you dig for hidden meanings when the surface is the truth? Where does your intensity destroy what could be easy?",
        "What would it feel like to enjoy something without analyzing it? What are you afraid will happen if you stop looking for the catch?",
        "Accept something at face value this week. No investigation. No suspicion. What does simplicity feel like?",
      ],
      pl: [
        "Gdzie tworzysz kryzys bo spokój czuje się nudny lub podejrzany? Kiedy ostatnio pozwoliłaś żeby coś było proste?",
        "Jak często szukasz ukrytych znaczeń kiedy powierzchnia jest prawdą? Gdzie twoja intensywność niszczy to co mogłoby być łatwe?",
        "Jak by się czuło cieszyć się czymś bez analizowania? Czego boisz się że się stanie jeśli przestaniesz szukać haczyka?",
        "Przyjmij w tym tygodniu coś za dobrą monetę. Bez dochodzenia. Bez podejrzeń. Jak czuje się prostota?",
      ],
    },
    "Sagittarius-Gemini": {
      en: [
        "Where do you collect information without committing to a direction? When did curiosity become avoidance of depth?",
        "How often do you scatter your energy across many interests to avoid the discomfort of choosing one path?",
        "What would it feel like to believe in something fully knowing you might be wrong? What are you avoiding by keeping all options open?",
        "Commit to one belief or direction this week and follow it without researching alternatives. What does conviction feel like?",
      ],
      pl: [
        "Gdzie zbierasz informacje bez zobowiązywania się do kierunku? Kiedy ciekawość stała się unikaniem głębi?",
        "Jak często rozpraszasz energię na wiele zainteresowań żeby uniknąć dyskomfortu wybierania jednej ścieżki?",
        "Jak by się czuło wierzyć w coś w pełni wiedząc że możesz się mylić? Czego unikasz trzymając wszystkie opcje otwarte?",
        "Zobowiąż się w tym tygodniu do jednego przekonania lub kierunku i podążaj za nim bez szukania alternatyw. Jak czuje się przekonanie?",
      ],
    },
    "Capricorn-Cancer": {
      en: [
        "Where do you use emotion, family or comfort as a reason not to grow? When did safety become a cage?",
        "How often do you retreat into what feels like home instead of building something in the world? Where does nurturing become hiding?",
        "What would it feel like to step into authority without losing your softness? What are you afraid the world will do to you if you show up fully?",
        "Take responsibility for one thing this week that you have been avoiding by staying in your comfort zone. What do you build?",
      ],
      pl: [
        "Gdzie używasz emocji, rodziny lub komfortu jako powodu żeby nie rosnąć? Kiedy bezpieczeństwo stało się klatką?",
        "Jak często wycofujesz się w to co czuje się jak dom zamiast budować coś w świecie? Gdzie opiekowanie się staje się ukrywaniem?",
        "Jak by się czuło wejść w autorytet bez tracenia miękkości? Czego boisz się że świat ci zrobi jeśli pojawisz się w pełni?",
        "Weź w tym tygodniu odpowiedzialność za jedną rzecz której unikałaś zostając w strefie komfortu. Co budujesz?",
      ],
    },
    "Aquarius-Leo": {
      en: [
        "Where do you perform for attention because being ordinary feels like disappearing? When did you last do something without an audience?",
        "How often do you make everything about your personal story when the situation calls for something bigger? Where does ego block contribution?",
        "What would it feel like to matter without being special? What are you afraid will happen if you are just one of many?",
        "Contribute to something this week where you receive no individual credit. What do you learn about your worth?",
      ],
      pl: [
        "Gdzie występujesz dla uwagi bo bycie zwyczajną czuje się jak znikanie? Kiedy ostatnio zrobiłaś coś bez publiczności?",
        "Jak często robisz z wszystkiego swoją osobistą historię kiedy sytuacja wymaga czegoś większego? Gdzie ego blokuje wkład?",
        "Jak by się czuło mieć znaczenie bez bycia wyjątkową? Czego boisz się że się stanie jeśli będziesz jedną z wielu?",
        "Wnieś wkład w coś w tym tygodniu gdzie nie otrzymasz indywidualnego uznania. Czego uczysz się o swojej wartości?",
      ],
    },
    "Pisces-Virgo": {
      en: [
        "Where do you use productivity and analysis to avoid feeling? When did doing become a substitute for being?",
        "How often do you fix, organize or improve instead of surrendering to what is? Where does control mask fear of the unknown?",
        "What would it feel like to let go of the plan and trust the process? What are you afraid will fall apart if you stop managing everything?",
        "Surrender control of one thing this week and let it unfold without your intervention. What do you discover about trust?",
      ],
      pl: [
        "Gdzie używasz produktywności i analizy żeby uniknąć czucia? Kiedy robienie stało się substytutem bycia?",
        "Jak często naprawiasz, organizujesz lub ulepszasz zamiast poddać się temu co jest? Gdzie kontrola maskuje lęk przed nieznanym?",
        "Jak by się czuło puścić plan i zaufać procesowi? Czego boisz się że się rozpadnie jeśli przestaniesz wszystkim zarządzać?",
        "Oddaj w tym tygodniu kontrolę nad jedną rzeczą i pozwól jej się rozwinąć bez twojej interwencji. Co odkrywasz o zaufaniu?",
      ],
    },
  };

  const key = `${northSign}-${southSign}`;
  const reverseKey = `${southSign}-${northSign}`;
  const questions = nodeQuestions[key] || nodeQuestions[reverseKey] || nodeQuestions["Aries-Libra"];
  return lang === "pl" ? questions.pl : questions.en;
}

export default function LunarNodesWorkbookPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const lang = language as "en" | "pl";
  const pl = lang === "pl";

  const [loading, setLoading] = useState(true);
  const [northSign, setNorthSign] = useState<string | null>(null);
  const [northSignPl, setNorthSignPl] = useState<string | null>(null);
  const [southSign, setSouthSign] = useState<string | null>(null);
  const [southSignPl, setSouthSignPl] = useState<string | null>(null);
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
  const [locked, setLocked] = useState(false);
  const [completedWorkbooks, setCompletedWorkbooks] = useState(0);

  useEffect(() => { init(); }, [language]);

  const init = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: profile } = await supabase.from("profiles").select("birth_date, birth_time, birth_city, is_premium, is_admin").eq("id", user.id).single();
    if (!profile?.birth_date) { router.push("/onboarding"); return; }

    // Check how many planetary workbooks completed
    const { data: completedWb } = await supabase
      .from("workbook_progress")
      .select("workbook_type")
      .eq("user_id", user.id)
      .not("completed_at", "is", null);

    const uniqueCompleted = new Set((completedWb || []).map(w => w.workbook_type)).size;
    const planetaryCompleted = (completedWb || []).filter(w => ["moon", "saturn", "pluto", "chiron", "lilith"].includes(w.workbook_type));
    const uniquePlanetary = new Set(planetaryCompleted.map(w => w.workbook_type)).size;
    setCompletedWorkbooks(uniquePlanetary);

    if (uniquePlanetary < 2 && !profile.is_admin) {
      setLocked(true);
      setLoading(false);
      return;
    }

    if (!profile.is_admin) {
      const { data: nodesProduct } = await supabase.from("shop_products").select("id").eq("name", "Lunar Nodes Workbook").single();
      const { data: bundleProduct } = await supabase.from("shop_products").select("id").eq("name", "Depth Work Bundle").single();
      const productIds = [nodesProduct?.id, bundleProduct?.id].filter(Boolean);
      const { data: purchases } = await supabase.from("user_purchases").select("id").eq("user_id", user.id).in("product_id", productIds);
      if ((purchases || []).length === 0 && !profile.is_premium) { router.push("/shop"); return; }
    }

    const chart = calculateNatalChart(profile.birth_date, profile.birth_time, profile.birth_city);
    setNorthSign(chart.northNode.sign);
    setNorthSignPl(chart.northNode.signPl);
    setSouthSign(chart.southNode.sign);
    setSouthSignPl(chart.southNode.signPl);
    const desc = pl
      ? `Węzeł Północny w ${chart.northNode.signPl}: ${chart.northNode.descriptionPl} Węzeł Południowy w ${chart.southNode.signPl}: ${chart.southNode.descriptionPl}`
      : `North Node in ${chart.northNode.sign}: ${chart.northNode.description} South Node in ${chart.southNode.sign}: ${chart.southNode.description}`;
    setNatalDescription(desc);
    setQuestions(buildNodesQuestions(chart.northNode.sign, chart.southNode.sign, lang));

    const { data: sessions } = await supabase
      .from("workbook_progress").select("*").eq("user_id", user.id).eq("workbook_type", "lunar-nodes")
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
      user_id: user.id, workbook_type: "lunar-nodes", cycle_number: pastSessions.length + 1, responses: [],
    }).select().single();
    if (data) { setSession(data as Session); setCurrentStage(0); setAiReaction(null); setResponse(""); }
  };

  const handleSubmit = async () => {
    if (!response.trim() || !session || !northSign) return;
    setSaving(true);
    setReacting(true);
    let reaction = "";
    try {
      const res = await fetch("/api/workbook-planetary", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: currentStage + 1, response: response.trim(), planet: "lunar-nodes", natalSign: `North Node ${northSign}, South Node ${southSign}`, language: lang }),
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
        {pl ? "Sprawdzam twój kierunek..." : "Checking your direction..."}
      </p>
    </div>
  );

  if (locked) return (
    <div className="min-h-screen" style={{ background: "var(--color-cream)" }}>
      <main className="max-w-lg mx-auto px-5 py-8 space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
              ← {pl ? "Wróć" : "Back"}
            </button>
            <div className="w-12" />
          </div>
          <h1 className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3"
            style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>
            {pl ? "Zeszyt Węzłów Księżycowych" : "Lunar Nodes Workbook"}
          </h1>
        </div>
        <div className="p-6 rounded-xl text-center space-y-3" style={{ background: "var(--color-blush)" }}>
          <p className="text-3xl">☊</p>
          <p className="text-sm" style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, lineHeight: 1.6 }}>
            {pl
              ? "Zanim popatrzysz na kierunek, musisz znać siebie. Ukończ minimum 2 zeszyty planetarne żeby odblokować Węzły."
              : "Before you look at direction, you need to know yourself. Complete at least 2 planetary workbooks to unlock the Nodes."}
          </p>
          <p className="text-xs" style={{ color: "var(--color-mauve)" }}>
            {pl ? `${completedWorkbooks}/2 ukończonych` : `${completedWorkbooks}/2 completed`}
          </p>
          <div className="flex justify-center gap-2 mt-3">
            {["🌙", "🪐", "💀", "💫", "🔥"].map((e, i) => (
              <span key={i} className="text-lg" style={{ opacity: i < completedWorkbooks ? 1 : 0.3 }}>{e}</span>
            ))}
          </div>
          <button onClick={() => router.push("/shop")} className="mt-4 px-6 py-2 rounded-xl text-sm"
            style={{ background: "linear-gradient(135deg, var(--color-plum), var(--color-mauve))", color: "var(--color-cream)", fontWeight: 600 }}>
            {pl ? "Zobacz zeszyty" : "See workbooks"}
          </button>
        </div>
      </main>
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
        <div>
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
              ← {pl ? "Wróć" : "Back"}
            </button>
            <div className="w-12" />
          </div>
          <h1 className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3"
            style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>
            {pl ? "Zeszyt Węzłów Księżycowych" : "Lunar Nodes Workbook"}
          </h1>
        </div>

        <section className="text-center space-y-2">
          <p className="text-xs tracking-[0.2em] uppercase" style={{ color: "var(--color-gold)", fontWeight: 600 }}>
            {pl ? "Twoje Węzły" : "Your Nodes"}
          </p>
          {northSign && southSign && (
            <p className="text-2xl" style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>
              ☊ {pl ? (northSignPl || northSign) : northSign} · ☋ {pl ? (southSignPl || southSign) : southSign}
            </p>
          )}
          <p className="leading-relaxed max-w-md mx-auto" style={{ color: "var(--color-mauve)", fontSize: "0.95rem", lineHeight: 1.7 }}>
            {natalDescription}
          </p>
        </section>

        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
          <span style={{ color: "var(--color-gold)", fontSize: "1.1rem" }}>☊</span>
          <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
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
                      {pl ? `Następny cykl dostępny za ${30 - (daysSinceLast || 0)} dni. Kierunek nie zmienia się z dnia na dzień.`
                        : `Next cycle available in ${30 - (daysSinceLast || 0)} days. Direction does not change overnight.`}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {session && !session.completed_at && (
          <div className="space-y-6">
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

            <p className="text-center" style={{ color: "var(--color-mauve)", fontStyle: "italic", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1rem", lineHeight: 1.8 }}>
              {STAGE_INTROS[lang][currentStage]}
            </p>

            {aiReaction && currentStage > 0 && currentStage <= 3 && (
              <div className="p-4 rounded-xl" style={{ background: "var(--color-blush)", borderLeft: "3px solid var(--color-gold)" }}>
                <p style={{ color: "var(--color-dark)", lineHeight: 1.8, textAlign: "justify", fontSize: "0.95rem" }}>{aiReaction}</p>
              </div>
            )}

            <div className="space-y-3">
              <p style={{ color: "var(--color-dark)", fontWeight: 600, lineHeight: 1.8, fontSize: "0.9rem" }}>{questions[currentStage]}</p>
              <textarea value={response} onChange={e => setResponse(e.target.value)} rows={6}
                className="w-full rounded-xl p-4 resize-none focus:outline-none"
                style={{ background: "var(--color-blush)", color: "var(--color-dark)", border: "1px solid var(--color-dusty-rose)", fontFamily: "'Cormorant Garamond', Georgia, serif", lineHeight: 1.7, fontSize: "0.95rem" }}
                placeholder={pl ? "Twoja odpowiedź..." : "Your response..."} />
              <button onClick={handleSubmit} disabled={saving || !response.trim()} className="w-full py-3 rounded-xl transition-all"
                style={{
                  background: response.trim() ? "linear-gradient(135deg, var(--color-plum), var(--color-mauve))" : "var(--color-blush)",
                  color: response.trim() ? "var(--color-cream)" : "var(--color-dusty-rose)", fontWeight: 600, fontSize: "0.95rem",
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
                {pl ? "Następny cykl za 30 dni. Kierunek wymaga cierpliwości." : "Next cycle in 30 days. Direction requires patience."}
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