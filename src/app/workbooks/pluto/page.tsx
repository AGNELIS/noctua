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
    "Pluto does not ask what you want to change. It asks what you refuse to let die. That is where the work is.",
    "You named what you are holding onto. Now look at how many times you have rebuilt the same thing in different forms.",
    "Underneath the need to control there is something you lost once and swore you would never lose again. What is it?",
    "Transformation is not adding something new. It is letting something old finally end. What are you ready to release?",
  ],
  pl: [
    "Pluton nie pyta co chcesz zmienić. Pyta czemu odmawiasz śmierci. Tam jest praca.",
    "Nazwałaś to czego się trzymasz. Teraz popatrz ile razy odbudowałaś tę samą rzecz w różnych formach.",
    "Pod potrzebą kontroli jest coś co kiedyś straciłaś i przysięgłaś że nigdy więcej nie stracisz. Co to jest?",
    "Transformacja to nie dodawanie czegoś nowego. To pozwolenie żeby coś starego wreszcie się skończyło. Co jesteś gotowa puścić?",
  ],
};

function buildPlutoQuestions(sign: string, lang: "en" | "pl"): string[] {
  const signQuestions: Record<string, { en: string[]; pl: string[] }> = {
    Aries: {
      en: [
        "Where do you use aggression or dominance to avoid feeling powerless? What triggers the need to fight?",
        "How many times have you destroyed something good because you could not control it? Where does this repeat?",
        "What would it mean to be powerful without being threatening? What do you think power actually is?",
        "Name one place where you will choose influence over force this week. What does that version of you look like?",
      ],
      pl: [
        "Gdzie używasz agresji lub dominacji żeby uniknąć poczucia bezsilności? Co wyzwala potrzebę walki?",
        "Ile razy zniszczyłaś coś dobrego bo nie mogłaś tego kontrolować? Gdzie to się powtarza?",
        "Co by oznaczało być silną bez bycia groźną? Czym twoim zdaniem naprawdę jest moc?",
        "Wymień jedno miejsce gdzie w tym tygodniu wybierzesz wpływ zamiast siły. Jak wygląda ta wersja ciebie?",
      ],
    },
    Taurus: {
      en: [
        "What do you possess that actually possesses you? Where does ownership become obsession?",
        "How often do you hold onto things, people or situations past the point where they serve you? What are you stockpiling against?",
        "What loss are you most afraid of? Not the thing itself. The feeling of losing it.",
        "Release one attachment this week that you keep for security, not joy. What shifts?",
      ],
      pl: [
        "Co posiadasz co tak naprawdę posiada ciebie? Gdzie posiadanie staje się obsesją?",
        "Jak często trzymasz się rzeczy, ludzi lub sytuacji po punkcie w którym ci służą? Przeciwko czemu gromadzisz?",
        "Jakiej straty boisz się najbardziej? Nie samej rzeczy. Uczucia utraty.",
        "Puść w tym tygodniu jedno przywiązanie które trzymasz dla bezpieczeństwa nie dla radości. Co się zmienia?",
      ],
    },
    Gemini: {
      en: [
        "Where do you use information as power? When did knowing something give you control over a situation or person?",
        "How often do you manipulate through words, framing or selective truth? Where is this pattern?",
        "What truth are you avoiding by staying in your head? What would happen if you said the unsayable thing?",
        "Say one thing this week that you normally edit. The raw version. What does honesty without strategy feel like?",
      ],
      pl: [
        "Gdzie używasz informacji jako władzy? Kiedy wiedza o czymś dawała ci kontrolę nad sytuacją lub osobą?",
        "Jak często manipulujesz przez słowa, ramowanie lub selektywną prawdę? Gdzie jest ten wzorzec?",
        "Jakiej prawdy unikasz zostając w głowie? Co by się stało gdybyś powiedziała to co niewypowiadalne?",
        "Powiedz w tym tygodniu jedną rzecz którą normalnie edytujesz. Surową wersję. Jak czujesz się szczerość bez strategii?",
      ],
    },
    Cancer: {
      en: [
        "Where does your nurturing have strings attached? When does care become a way to bind someone to you?",
        "How often do you use emotional vulnerability as leverage? Where does protection become possession?",
        "What would it feel like to love without needing to be needed? Who are you without the role of caretaker?",
        "Let someone take care of themselves this week without intervening. What fear comes up?",
      ],
      pl: [
        "Gdzie twoje opiekowanie się ma ukryte warunki? Kiedy troska staje się sposobem na przywiązanie kogoś do siebie?",
        "Jak często używasz emocjonalnej wrażliwości jako dźwigni? Gdzie ochrona staje się posiadaniem?",
        "Jak by się czuło kochać bez potrzeby bycia potrzebną? Kim jesteś bez roli opiekunki?",
        "Pozwól komuś w tym tygodniu zaopiekować się sobą bez interweniowania. Jaki lęk się pojawia?",
      ],
    },
    Leo: {
      en: [
        "Where does your need to be special mask a fear of being ordinary? When did you last feel invisible and what did you do?",
        "How often do you control how others perceive you? Where does your image management exhaust you?",
        "What would it mean to be seen exactly as you are, including the parts that are not impressive? What do you hide?",
        "Show up this week without performing. No charm, no strategy. What happens when you stop managing the impression?",
      ],
      pl: [
        "Gdzie twoja potrzeba bycia wyjątkową maskuje lęk przed byciem zwyczajną? Kiedy ostatnio czułaś się niewidzialna i co zrobiłaś?",
        "Jak często kontrolujesz jak inni cię postrzegają? Gdzie zarządzanie wizerunkiem cię wyczerpuje?",
        "Co by oznaczało być widzianą dokładnie taką jaką jesteś włącznie z częściami które nie robią wrażenia? Co ukrywasz?",
        "Pojaw się w tym tygodniu bez występowania. Bez uroku, bez strategii. Co się dzieje kiedy przestajesz zarządzać wrażeniem?",
      ],
    },
    Virgo: {
      en: [
        "Where do you use criticism or analysis to maintain control? When does helpfulness become a way to feel superior?",
        "How often do you fix others to avoid fixing yourself? Where does this pattern drain you?",
        "What mess inside you are you organizing around instead of sitting with? What would it feel like to stop fixing?",
        "Let one thing be broken this week. Do not analyze it. Do not improve it. What happens to your anxiety?",
      ],
      pl: [
        "Gdzie używasz krytyki lub analizy żeby utrzymać kontrolę? Kiedy pomocność staje się sposobem na poczucie wyższości?",
        "Jak często naprawiasz innych żeby uniknąć naprawiania siebie? Gdzie ten wzorzec cię wyczerpuje?",
        "Jaki bałagan w środku organizujesz zamiast z nim usiąść? Jak by się czuło przestać naprawiać?",
        "Zostaw w tym tygodniu jedną rzecz zepsutą. Nie analizuj jej. Nie ulepszaj. Co się dzieje z twoim lękiem?",
      ],
    },
    Libra: {
      en: [
        "Where do you use charm or diplomacy to manipulate an outcome? When is your niceness actually strategic?",
        "How often do you sacrifice truth for harmony? Where has avoiding conflict created a bigger one?",
        "What would happen if people saw your real anger, jealousy or hunger? What do you think they would do?",
        "Have one honest confrontation this week that you would normally smooth over. What power do you reclaim?",
      ],
      pl: [
        "Gdzie używasz uroku lub dyplomacji żeby manipulować wynikiem? Kiedy twoja miłość jest tak naprawdę strategiczna?",
        "Jak często poświęcasz prawdę na rzecz harmonii? Gdzie unikanie konfliktu stworzyło większy?",
        "Co by się stało gdyby ludzie zobaczyli twoją prawdziwą złość, zazdrość lub głód? Co twoim zdaniem by zrobili?",
        "Przeprowadź w tym tygodniu jedną szczerą konfrontację którą normalnie byś wygładziła. Jaką moc odzyskujesz?",
      ],
    },
    Scorpio: {
      en: [
        "Where is your intensity a weapon? When do you use depth as a way to destabilize others or keep them close?",
        "How often do you test people to see if they will stay? Where does your fear of betrayal create the very thing you fear?",
        "What would it feel like to trust completely knowing you might be hurt? What is the cost of never trusting?",
        "Trust someone this week with something you normally protect. Not as a test. As a choice. What happens?",
      ],
      pl: [
        "Gdzie twoja intensywność jest bronią? Kiedy używasz głębi żeby zdestabilizować innych lub trzymać ich blisko?",
        "Jak często testujesz ludzi żeby zobaczyć czy zostaną? Gdzie twój lęk przed zdradą tworzy dokładnie to czego się boisz?",
        "Jak by się czuło zaufać całkowicie wiedząc że możesz zostać zraniona? Jaki jest koszt nigdy nie ufania?",
        "Zaufaj komuś w tym tygodniu z czymś co normalnie chronisz. Nie jako test. Jako wybór. Co się dzieje?",
      ],
    },
    Sagittarius: {
      en: [
        "Where do you use truth or righteousness as a weapon? When does your honesty become cruelty?",
        "How often do you impose your worldview on others disguised as sharing wisdom? Where does this push people away?",
        "What would it mean to hold your truth without needing everyone to agree? What are you actually preaching to yourself?",
        "Listen to someone this week whose worldview you disagree with. Without correcting them. What do you learn about your own rigidity?",
      ],
      pl: [
        "Gdzie używasz prawdy lub sprawiedliwości jako broni? Kiedy twoja szczerość staje się okrucieństwem?",
        "Jak często narzucasz innym swój światopogląd pod przykrywką dzielenia się mądrością? Gdzie to odpycha ludzi?",
        "Co by oznaczało trzymać swoją prawdę bez potrzeby żeby wszyscy się zgadzali? Co tak naprawdę głosisz sobie samej?",
        "Wysłuchaj w tym tygodniu kogoś z kim się nie zgadzasz. Bez poprawiania. Czego uczysz się o własnej sztywności?",
      ],
    },
    Capricorn: {
      en: [
        "Where has your ambition become ruthless? When did climbing stop being about purpose and start being about never feeling small again?",
        "How many people have you left behind on the way up? Where does your drive cost you connection?",
        "What would it feel like to be at the bottom again? What is the feeling you are building your entire life to avoid?",
        "Do something this week that puts you in a position of zero authority. What comes up when you have no rank?",
      ],
      pl: [
        "Gdzie twoja ambicja stała się bezwzględna? Kiedy wspinanie się przestało być o celu a zaczęło być o tym żeby nigdy więcej nie czuć się małą?",
        "Ile ludzi zostawiłaś za sobą po drodze w górę? Gdzie twój napęd kosztuje cię bliskość?",
        "Jak by się czuło być znowu na dole? Jakie jest to uczucie od którego budujesz całe życie żeby go uniknąć?",
        "Zrób w tym tygodniu coś co postawi cię w pozycji zerowego autorytetu. Co się pojawia kiedy nie masz rangi?",
      ],
    },
    Aquarius: {
      en: [
        "Where do you use detachment as control? When does your refusal to be emotional become a way to dominate?",
        "How often do you manipulate through withdrawal? Where does your independence punish others?",
        "What would it feel like to be completely emotionally dependent on someone? What is the catastrophe you imagine?",
        "Need someone openly this week. Not as an experiment. As truth. What is hard about that?",
      ],
      pl: [
        "Gdzie używasz dystansu jako kontroli? Kiedy twoja odmowa bycia emocjonalną staje się sposobem na dominację?",
        "Jak często manipulujesz przez wycofanie? Gdzie twoja niezależność karze innych?",
        "Jak by się czuło być całkowicie emocjonalnie zależną od kogoś? Jaką katastrofę sobie wyobrażasz?",
        "Potrzebuj kogoś otwarcie w tym tygodniu. Nie jako eksperyment. Jako prawda. Co jest w tym trudnego?",
      ],
    },
    Pisces: {
      en: [
        "Where do you use victimhood or martyrdom as a form of power? When does your suffering become a way to control others?",
        "How often do you disappear instead of confronting? Where does your passivity mask rage?",
        "What would it feel like to be angry without guilt? What power have you given away by being the one who always understands?",
        "Claim one boundary this week without apologizing for it. Not gently. Clearly. What changes in how people treat you?",
      ],
      pl: [
        "Gdzie używasz pozycji ofiary lub męczennicy jako formy władzy? Kiedy twoje cierpienie staje się sposobem na kontrolowanie innych?",
        "Jak często znikasz zamiast konfrontować? Gdzie twoja pasywność maskuje wściekłość?",
        "Jak by się czuło złościć się bez poczucia winy? Jaką moc oddałaś będąc tą która zawsze rozumie?",
        "Postaw w tym tygodniu jedną granicę bez przepraszania za nią. Nie łagodnie. Jasno. Co się zmienia w tym jak ludzie cię traktują?",
      ],
    },
  };

  const questions = signQuestions[sign] || signQuestions.Aries;
  return lang === "pl" ? questions.pl : questions.en;
}

export default function PlutoWorkbookPage() {
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

    const { data: profile } = await supabase.from("profiles").select("birth_date, birth_time, birth_city, is_premium, is_admin, admin_test_mode").eq("id", user.id).single();
    const { isAdmin, isPremium } = getEffectivePerms(profile);
    if (!profile?.birth_date) { router.push("/onboarding"); return; }

    if (!isAdmin) {
      const { data: plutoProduct } = await supabase.from("shop_products").select("id").eq("name", "Pluto Workbook").single();
      const { data: bundleProduct } = await supabase.from("shop_products").select("id").eq("name", "Depth Work Bundle").single();
      const productIds = [plutoProduct?.id, bundleProduct?.id].filter(Boolean);
      const { data: purchases } = await supabase.from("user_purchases").select("id").eq("user_id", user.id).in("product_id", productIds);
      if ((purchases || []).length === 0 && !isPremium) { router.push("/shop"); return; }
    }

    const chart = calculateNatalChart(profile.birth_date, profile.birth_time, profile.birth_city);
    setNatalSign(chart.pluto.sign);
    setNatalSignPl(chart.pluto.signPl);
    setNatalDescription(pl ? chart.pluto.descriptionPl : chart.pluto.description);
    setQuestions(buildPlutoQuestions(chart.pluto.sign, lang));

    const { data: sessions } = await supabase
      .from("workbook_progress").select("*").eq("user_id", user.id).eq("workbook_type", "pluto")
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
      user_id: user.id, workbook_type: "pluto", cycle_number: pastSessions.length + 1, responses: [],
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
        body: JSON.stringify({ stage: currentStage + 1, response: response.trim(), planet: "pluto", natalSign, language: lang }),
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
    if (currentStage === 3) { try { fetch("/api/extract-patterns", { method: "POST" }); } catch {} }
    setSaving(false);
  };

  const nextStage = () => { setCurrentStage(currentStage + 1); setAiReaction(null); };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-cream)" }}>
      <p style={{ color: "var(--color-mauve)", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
        {pl ? "Zagłębiam się..." : "Going deeper..."}
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
        <div>
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
              ← {pl ? "Wróć" : "Back"}
            </button>
            <div className="w-12" />
          </div>
          <h1 className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3"
            style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>
            {pl ? "Zeszyt Plutona" : "Pluto Workbook"}
          </h1>
        </div>

        <section className="text-center space-y-2">
          <p className="text-xs tracking-[0.2em] uppercase" style={{ color: "var(--color-gold)", fontWeight: 600 }}>
            {pl ? "Twój Pluton" : "Your Pluto"}
          </p>
          <p className="text-2xl" style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>
            {pl ? `Pluton w ${natalSignPl || natalSign}` : `Pluto in ${natalSign}`}
          </p>
          <p className="leading-relaxed max-w-md mx-auto" style={{ color: "var(--color-mauve)", fontSize: "0.95rem", lineHeight: 1.7 }}>
            {natalDescription}
          </p>
        </section>

        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
          <span style={{ color: "var(--color-gold)", fontSize: "1.1rem" }}>♇</span>
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
                      {pl ? `Następny cykl dostępny za ${30 - (daysSinceLast || 0)} dni. Pluton działa powoli. Pozwól sobie na to.`
                        : `Next cycle available in ${30 - (daysSinceLast || 0)} days. Pluto works slowly. Let it.`}
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
                {pl ? "Następny cykl za 30 dni. Transformacja wymaga czasu." : "Next cycle in 30 days. Transformation takes time."}
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