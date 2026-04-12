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
    "Lilith is the part of you that was shamed into silence. Not the wound. The power that was taken. This is about finding it.",
    "You named what was rejected. Now look at how you reject it in yourself every day. The pattern is not what happened to you. It is what you do to yourself because of it.",
    "Underneath the shame there is rage. Underneath the rage there is something you wanted so badly that losing it broke something open. What was it?",
    "Reclaiming Lilith is not about becoming loud or defiant. It is about no longer apologizing for the parts of you that make other people uncomfortable. What do you reclaim?",
  ],
  pl: [
    "Lilith to ta część ciebie która została zawstydzona w ciszę. Nie rana. Moc która została zabrana. Tu chodzi o jej odnalezienie.",
    "Nazwałaś to co zostało odrzucone. Teraz popatrz jak codziennie odrzucasz to w sobie. Wzorzec to nie to co ci się przydarzyło. To co robisz sobie z tego powodu.",
    "Pod wstydem jest wściekłość. Pod wściekłością jest coś czego chciałaś tak bardzo że utrata tego coś w tobie otworzyła. Co to było?",
    "Odzyskanie Lilith to nie jest bycie głośną ani buntowniczą. To przestanie przepraszania za te części siebie które sprawiają że inni czują się niekomfortowo. Co odzyskujesz?",
  ],
};

function buildLilithQuestions(sign: string, lang: "en" | "pl"): string[] {
  const signQuestions: Record<string, { en: string[]; pl: string[] }> = {
    Aries: {
      en: [
        "Where were you shamed for being too aggressive, too direct or too much? When did you learn to soften yourself?",
        "How often do you hold back your raw impulse to act because you were taught it was dangerous or unattractive? Where does this cost you?",
        "What power did you lose when you learned to be polite instead of honest? What would the uncensored version of you say right now?",
        "Do one thing this week the way your instinct tells you to, before the filter kicks in. What do you reclaim?",
      ],
      pl: [
        "Gdzie zawstydzono cię za bycie zbyt agresywną, zbyt bezpośrednią lub za dużo? Kiedy nauczyłaś się łagodzić siebie?",
        "Jak często wstrzymujesz surowy impuls do działania bo nauczono cię że jest niebezpieczny lub nieatrakcyjny? Gdzie to cię kosztuje?",
        "Jaką moc straciłaś kiedy nauczyłaś się być grzeczna zamiast szczera? Co powiedziałaby niecenzurowana wersja ciebie teraz?",
        "Zrób w tym tygodniu jedną rzecz tak jak mówi ci instynkt zanim włączy się filtr. Co odzyskujesz?",
      ],
    },
    Taurus: {
      en: [
        "Where were you shamed for your desires, your body or your appetite? When did you learn that wanting was dangerous?",
        "How often do you deny yourself pleasure or comfort because you were taught it was selfish or excessive? Where does this pattern live?",
        "What would it feel like to want without guilt? What part of your sensuality was taken from you and by whom?",
        "Indulge in something this week that you normally deny yourself. Not as rebellion. As reclamation. What shifts?",
      ],
      pl: [
        "Gdzie zawstydzono cię za twoje pragnienia, ciało lub apetyt? Kiedy nauczyłaś się że chcenie jest niebezpieczne?",
        "Jak często odmawiasz sobie przyjemności lub komfortu bo nauczono cię że to egoistyczne lub nadmierne? Gdzie ten wzorzec żyje?",
        "Jak by się czuło chcieć bez poczucia winy? Jaka część twojej zmysłowości została ci zabrana i przez kogo?",
        "Oddaj się w tym tygodniu czemuś czego normalnie sobie odmawiasz. Nie jako bunt. Jako odzyskanie. Co się zmienia?",
      ],
    },
    Gemini: {
      en: [
        "Where were you shamed for what you knew, what you said or how your mind works? When did you learn to dumb yourself down?",
        "How often do you censor your real thoughts because you were told they were too sharp, too much or too dangerous? Where does this silence you?",
        "What truth do you carry that nobody wants to hear? What power lives in the things you are not allowed to say?",
        "Speak one unsoftened truth this week. Not cruelly. Clearly. What do you reclaim by refusing to edit yourself?",
      ],
      pl: [
        "Gdzie zawstydzono cię za to co wiedziałaś, co mówiłaś lub jak działa twój umysł? Kiedy nauczyłaś się udawać głupszą?",
        "Jak często cenzurujesz prawdziwe myśli bo powiedziano ci że są zbyt ostre, za dużo lub zbyt niebezpieczne? Gdzie to cię ucisza?",
        "Jaką prawdę nosisz której nikt nie chce słyszeć? Jaka moc żyje w rzeczach których nie wolno ci mówić?",
        "Powiedz w tym tygodniu jedną niezłagodzoną prawdę. Nie okrutnie. Jasno. Co odzyskujesz odmawiając edytowania siebie?",
      ],
    },
    Cancer: {
      en: [
        "Where were you shamed for your emotional needs or your need for closeness? When did you learn that needing was weakness?",
        "How often do you pretend you do not need anyone because vulnerability was punished? Where does this isolation repeat?",
        "What would it feel like to need openly without earning it first? What was taken from you when you were taught to be strong?",
        "Ask for comfort this week without justifying why you need it. What do you reclaim by allowing yourself to be soft?",
      ],
      pl: [
        "Gdzie zawstydzono cię za potrzeby emocjonalne lub potrzebę bliskości? Kiedy nauczyłaś się że potrzebowanie to słabość?",
        "Jak często udajesz że nikogo nie potrzebujesz bo bezbronność była karana? Gdzie ta izolacja się powtarza?",
        "Jak by się czuło potrzebować otwarcie bez wcześniejszego zasługiwania? Co ci zabrano kiedy nauczono cię być silną?",
        "Poproś w tym tygodniu o pocieszenie bez uzasadniania dlaczego go potrzebujesz. Co odzyskujesz pozwalając sobie być miękką?",
      ],
    },
    Leo: {
      en: [
        "Where were you shamed for wanting attention, recognition or admiration? When did you learn that being seen was vain?",
        "How often do you minimize your talent, your beauty or your presence because someone told you it was too much? Where does this dim you?",
        "What would it feel like to shine without apology? What power was taken when you were taught to make yourself smaller?",
        "Take up visible space this week without shrinking. Not for applause. Because you exist. What do you reclaim?",
      ],
      pl: [
        "Gdzie zawstydzono cię za chęć uwagi, uznania lub podziwu? Kiedy nauczyłaś się że bycie widzianą to próżność?",
        "Jak często minimalizujesz swój talent, urodę lub obecność bo ktoś powiedział ci że to za dużo? Gdzie to cię przygasza?",
        "Jak by się czuło świecić bez przepraszania? Jaka moc została zabrana kiedy nauczono cię robić się mniejszą?",
        "Zajmij w tym tygodniu widoczne miejsce bez kurczenia się. Nie dla oklasków. Bo istniejesz. Co odzyskujesz?",
      ],
    },
    Virgo: {
      en: [
        "Where were you shamed for not being good enough, clean enough or useful enough? When did you learn that your value is conditional?",
        "How often do you punish yourself for imperfection because someone taught you that flaws mean failure? Where does this self-attack repeat?",
        "What would it feel like to be messy and still worthy? What part of you was rejected because it was not productive?",
        "Leave something deliberately imperfect this week and refuse to apologize for it. What power lives in the mess?",
      ],
      pl: [
        "Gdzie zawstydzono cię za niebycie wystarczająco dobrą, czystą lub użyteczną? Kiedy nauczyłaś się że twoja wartość jest warunkowa?",
        "Jak często karzesz siebie za niedoskonałość bo ktoś nauczył cię że wady oznaczają porażkę? Gdzie ten autoatak się powtarza?",
        "Jak by się czuło być bałaganiarską i nadal wartościową? Jaka część ciebie została odrzucona bo nie była produktywna?",
        "Zostaw w tym tygodniu coś celowo niedoskonałe i odmów przepraszania za to. Jaka moc żyje w bałaganie?",
      ],
    },
    Libra: {
      en: [
        "Where were you shamed for being difficult, confrontational or not agreeable enough? When did you learn that conflict means abandonment?",
        "How often do you betray your own anger to keep the peace? Where does your niceness protect everyone but you?",
        "What would it feel like to be disliked and still whole? What part of your power did you sacrifice at the altar of being pleasant?",
        "Disagree openly this week without smoothing it over. What do you reclaim when you stop performing harmony?",
      ],
      pl: [
        "Gdzie zawstydzono cię za bycie trudną, konfrontacyjną lub niewystarczająco ugodową? Kiedy nauczyłaś się że konflikt oznacza porzucenie?",
        "Jak często zdradzasz własną złość żeby utrzymać spokój? Gdzie twoja miłość chroni wszystkich oprócz ciebie?",
        "Jak by się czuło być nielubianą i nadal całą? Jaką część mocy poświęciłaś na ołtarzu bycia miłą?",
        "Nie zgódź się w tym tygodniu otwarcie bez wygładzania. Co odzyskujesz kiedy przestajesz grać harmonię?",
      ],
    },
    Scorpio: {
      en: [
        "Where were you shamed for your intensity, your darkness or your knowing? When did you learn that depth is threatening?",
        "How often do you hide what you really see because people could not handle it? Where does this suppression poison you?",
        "What would it feel like to be fully dark and fully accepted? What power lives in the parts of you that frighten others?",
        "Let your intensity out this week in one situation where you normally contain it. What do you reclaim?",
      ],
      pl: [
        "Gdzie zawstydzono cię za twoją intensywność, ciemność lub wiedzenie? Kiedy nauczyłaś się że głębia jest groźna?",
        "Jak często ukrywasz to co naprawdę widzisz bo ludzie nie daliby rady? Gdzie to tłumienie cię zatruwa?",
        "Jak by się czuło być w pełni ciemną i w pełni zaakceptowaną? Jaka moc żyje w częściach ciebie które przerażają innych?",
        "Wypuść swoją intensywność w tym tygodniu w jednej sytuacji w której normalnie ją powstrzymujesz. Co odzyskujesz?",
      ],
    },
    Sagittarius: {
      en: [
        "Where were you shamed for your wildness, your beliefs or your refusal to conform? When did you learn to tone down your fire?",
        "How often do you suppress your real opinions or your desire for freedom because they made someone uncomfortable? Where does this cage you?",
        "What would it feel like to believe what you believe without needing validation? What truth were you punished for speaking?",
        "Express one wild or unpopular belief this week without defending it. What do you reclaim when you stop explaining yourself?",
      ],
      pl: [
        "Gdzie zawstydzono cię za twoją dzikość, przekonania lub odmowę dostosowania się? Kiedy nauczyłaś się wyciszać swój ogień?",
        "Jak często tłumisz prawdziwe opinie lub pragnienie wolności bo kogoś to niepokoiło? Gdzie to cię zamyka w klatce?",
        "Jak by się czuło wierzyć w to w co wierzysz bez potrzeby walidacji? Za jaką prawdę zostałaś ukarana?",
        "Wyraź w tym tygodniu jedno dzikie lub niepopularne przekonanie bez bronienia go. Co odzyskujesz kiedy przestajesz się tłumaczyć?",
      ],
    },
    Capricorn: {
      en: [
        "Where were you shamed for your ambition, your hunger for power or your refusal to be small? When did you learn that female ambition is threatening?",
        "How often do you downplay your drive or let others take credit because visible success was punished? Where does this pattern hold you back?",
        "What would it feel like to want power openly without guilt? What were you taught about women who want too much?",
        "Claim credit for something you achieved this week. Out loud. Without deflecting. What do you reclaim?",
      ],
      pl: [
        "Gdzie zawstydzono cię za ambicję, głód władzy lub odmowę bycia małą? Kiedy nauczyłaś się że kobieca ambicja jest groźna?",
        "Jak często umniejszasz swój napęd lub pozwalasz innym brać zasługi bo widoczny sukces był karany? Gdzie ten wzorzec cię powstrzymuje?",
        "Jak by się czuło chcieć władzy otwarcie bez poczucia winy? Czego nauczono cię o kobietach które chcą za dużo?",
        "Przypisz sobie zasługi za coś co osiągnęłaś w tym tygodniu. Na głos. Bez odwracania uwagi. Co odzyskujesz?",
      ],
    },
    Aquarius: {
      en: [
        "Where were you shamed for being too strange, too independent or too ahead of your time? When did you learn that not fitting in means something is wrong with you?",
        "How often do you perform normalcy to avoid rejection even though it costs you your authenticity? Where does this compromise drain you?",
        "What would it feel like to be completely yourself without anyone understanding you? What part of your genius was exiled?",
        "Be fully yourself in one social situation this week without translating for others. What do you reclaim?",
      ],
      pl: [
        "Gdzie zawstydzono cię za bycie zbyt dziwną, zbyt niezależną lub zbyt wyprzedzającą swoje czasy? Kiedy nauczyłaś się że niepasowanie oznacza że coś jest z tobą nie tak?",
        "Jak często udajesz normalność żeby uniknąć odrzucenia choć kosztuje cię to autentyczność? Gdzie ten kompromis cię wyczerpuje?",
        "Jak by się czuło być całkowicie sobą bez tego żeby ktokolwiek cię rozumiał? Jaka część twojej genialności została wygnana?",
        "Bądź w pełni sobą w jednej sytuacji społecznej w tym tygodniu bez tłumaczenia się innym. Co odzyskujesz?",
      ],
    },
    Pisces: {
      en: [
        "Where were you shamed for your sensitivity, your intuition or your inner world? When did you learn that feeling deeply is weakness?",
        "How often do you dismiss your own knowing because you were told it was irrational, dramatic or too much? Where does this betray you?",
        "What would it feel like to trust your intuition completely even when nobody else sees what you see? What gift was shamed out of you?",
        "Follow one intuitive impulse this week without rationalizing it. What do you reclaim when you trust what you feel?",
      ],
      pl: [
        "Gdzie zawstydzono cię za wrażliwość, intuicję lub wewnętrzny świat? Kiedy nauczyłaś się że głębokie czucie to słabość?",
        "Jak często odrzucasz własne wiedzenie bo powiedziano ci że jest irracjonalne, dramatyczne lub za dużo? Gdzie to cię zdradza?",
        "Jak by się czuło ufać intuicji całkowicie nawet kiedy nikt inny nie widzi tego co ty? Jaki dar został z ciebie zawstydzony?",
        "Podążaj w tym tygodniu za jednym intuicyjnym impulsem bez racjonalizowania go. Co odzyskujesz kiedy ufasz temu co czujesz?",
      ],
    },
  };

  const questions = signQuestions[sign] || signQuestions.Aries;
  return lang === "pl" ? questions.pl : questions.en;
}

export default function LilithWorkbookPage() {
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

    const { data: profile } = await supabase.from("profiles").select("birth_date, birth_time, birth_city, is_premium, is_admin").eq("id", user.id).single();
    if (!profile?.birth_date) { router.push("/onboarding"); return; }

    if (!profile.is_admin) {
      const { data: lilithProduct } = await supabase.from("shop_products").select("id").eq("name", "Lilith Workbook").single();
      const { data: bundleProduct } = await supabase.from("shop_products").select("id").eq("name", "Depth Work Bundle").single();
      const productIds = [lilithProduct?.id, bundleProduct?.id].filter(Boolean);
      const { data: purchases } = await supabase.from("user_purchases").select("id").eq("user_id", user.id).in("product_id", productIds);
      if ((purchases || []).length === 0 && !profile.is_premium) { router.push("/shop"); return; }
    }

    const chart = calculateNatalChart(profile.birth_date, profile.birth_time, profile.birth_city);
    setNatalSign(chart.lilith.sign);
    setNatalDescription(pl ? chart.lilith.descriptionPl : chart.lilith.description);
    setQuestions(buildLilithQuestions(chart.lilith.sign, lang));

    const { data: sessions } = await supabase
      .from("workbook_progress").select("*").eq("user_id", user.id).eq("workbook_type", "lilith")
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
      user_id: user.id, workbook_type: "lilith", cycle_number: pastSessions.length + 1, responses: [],
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
        body: JSON.stringify({ stage: currentStage + 1, response: response.trim(), planet: "lilith", natalSign, language: lang }),
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
        {pl ? "Szukam tego co odrzuciłaś..." : "Finding what was rejected..."}
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
        <div className="text-center space-y-2">
          <button onClick={() => router.back()} className="text-sm" style={{ color: "var(--color-mauve)" }}>{pl ? "← Wróć" : "← Back"}</button>
          <h1 className="text-2xl" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: "var(--color-dark)", fontWeight: 700 }}>
            {pl ? "Zeszyt Lilith" : "Lilith Workbook"}
          </h1>
          {natalSign && (
            <p className="text-sm" style={{ color: "var(--color-plum)", fontWeight: 600 }}>{pl ? `Lilith w ${natalSign}` : `Lilith in ${natalSign}`}</p>
          )}
          <p className="text-xs leading-relaxed" style={{ color: "var(--color-mauve)" }}>{natalDescription}</p>
        </div>

        {!session && (
          <div className="space-y-4">
            {pastSessions.length === 0 ? (
              <div className="text-center space-y-4">
                <p className="text-sm" style={{ color: "var(--color-mauve)", fontStyle: "italic", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  {pl ? "Pierwszy cykl. Cztery pytania. Bądź szczera." : "First cycle. Four questions. Be honest."}
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
                      {pl ? `Następny cykl dostępny za ${30 - (daysSinceLast || 0)} dni. To co odrzucone nie spieszy się żeby wrócić. Ale wraca.`
                        : `Next cycle available in ${30 - (daysSinceLast || 0)} days. What was rejected does not rush to return. But it returns.`}
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
              <p className="text-sm" style={{ color: "var(--color-dark)", fontWeight: 600, lineHeight: 1.6 }}>{questions[currentStage]}</p>
              <textarea value={response} onChange={e => setResponse(e.target.value)} rows={6}
                className="w-full rounded-xl p-4 text-sm resize-none focus:outline-none"
                style={{ background: "var(--color-blush)", color: "var(--color-dark)", border: "1px solid var(--color-dusty-rose)", fontFamily: "'Cormorant Garamond', Georgia, serif", lineHeight: 1.7 }}
                placeholder={pl ? "Pisz szczerze..." : "Write honestly..."} />
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
                {pl ? "Następny cykl za 30 dni. To co odrzucone wraca kiedy jest gotowe." : "Next cycle in 30 days. What was rejected returns when it is ready."}
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