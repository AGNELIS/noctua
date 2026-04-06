"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

const EXERCISE_ICONS: Record<string, React.ReactNode> = {
  "54321": <SunIcon size={32} />,
  "breathing": <CloudIcon size={32} />,
  "bodyscan": <BodyIcon size={32} />,
  "rooting": <LeafIcon size={32} />,
  "cold": <DropIcon size={32} />,
};
import { SunIcon, CloudIcon, BodyIcon, LeafIcon, DropIcon } from "@/components/NoctuaIcons";

const GROUNDING_EXERCISES = [
  { id: "54321", title: "5-4-3-2-1 Senses", titlePl: "5-4-3-2-1 Zmysły", duration: "3-5 min", description: "Ground yourself through your senses.", descPl: "Uziemij się przez zmysły.", steps: ["Take a slow, deep breath.", "Look around and name 5 things you can SEE.", "Reach out and name 4 things you can TOUCH.", "Listen carefully and name 3 things you can HEAR.", "Notice 2 things you can SMELL.", "Name 1 thing you can TASTE.", "Take another deep breath. You are here. You are safe."], stepsPl: ["Weź powolny, głęboki oddech.", "Rozejrzyj się i nazwij 5 rzeczy które WIDZISZ.", "Nazwij 4 rzeczy których możesz DOTKNĄĆ.", "Wsłuchaj się i nazwij 3 rzeczy które SŁYSZYSZ.", "Zauważ 2 rzeczy które CZUJESZ zapachem.", "Nazwij 1 rzecz którą możesz POSMAKOWAĆ.", "Weź kolejny głęboki oddech. Jesteś tutaj. Jesteś bezpieczna."], icon: "✋" },
  { id: "breathing", title: "Box Breathing", titlePl: "Oddychanie pudełkowe", duration: "2-4 min", description: "Inhale, hold, exhale, hold - each for 4 counts.", descPl: "Wdech, wstrzymaj, wydech, wstrzymaj - każde na 4.", steps: ["Sit comfortably and close your eyes if you wish.", "Breathe IN slowly for 4 counts.", "HOLD your breath for 4 counts.", "Breathe OUT slowly for 4 counts.", "HOLD empty for 4 counts.", "Repeat 4-6 times.", "Notice how your body feels now."], stepsPl: ["Usiądź wygodnie i zamknij oczy jeśli chcesz.", "WDYCHAJ powoli licząc do 4.", "WSTRZYMAJ oddech licząc do 4.", "WYDYCHAJ powoli licząc do 4.", "WSTRZYMAJ bez powietrza licząc do 4.", "Powtórz 4-6 razy.", "Zauważ jak czuje się teraz Twoje ciało."], icon: "🌬" },
  { id: "bodyscan", title: "Quick Body Scan", titlePl: "Szybkie skanowanie ciała", duration: "3-5 min", description: "Bring gentle awareness to each part of your body.", descPl: "Skieruj łagodną uwagę na każdą część ciała.", steps: ["Close your eyes or soften your gaze.", "Notice your feet on the ground.", "Move awareness to your legs. Release any tension.", "Notice your belly. Let it soften with each breath.", "Feel your chest and heart space. Breathe into it.", "Relax your shoulders away from your ears.", "Soften your jaw, your forehead, the space behind your eyes.", "Take a full breath. You are whole. You are here."], stepsPl: ["Zamknij oczy lub złagodź wzrok.", "Poczuj swoje stopy na podłodze.", "Przenieś uwagę na nogi. Puść napięcie.", "Poczuj brzuch. Niech się rozluźni z każdym oddechem.", "Poczuj klatkę piersiową. Oddychaj w nią.", "Rozluźnij ramiona z dala od uszu.", "Rozluźnij szczękę, czoło, przestrzeń za oczami.", "Weź pełny oddech. Jesteś cała. Jesteś tutaj."], icon: "🧘" },
  { id: "rooting", title: "Rooting Visualisation", titlePl: "Wizualizacja zakorzenienia", duration: "2-3 min", description: "Imagine roots growing from your body into the Earth.", descPl: "Wyobraź sobie korzenie rosnące z Twojego ciała w Ziemię.", steps: ["Stand or sit with your feet flat on the floor.", "Imagine roots growing from the soles of your feet.", "See them reaching down through the floor, into the Earth.", "They grow deeper - through soil, stone, and water.", "Feel the Earth energy rising back up through your roots.", "It fills your legs, your core, your whole body with warmth.", "You are rooted. You are held. You are supported."], stepsPl: ["Stań lub usiądź ze stopami płasko na podłodze.", "Wyobraź sobie korzenie rosnące ze stóp.", "Patrz jak sięgają w dół przez podłogę, w Ziemię.", "Rosną głębiej - przez glebę, kamień i wodę.", "Poczuj energię Ziemi płynącą z powrotem przez korzenie.", "Wypełnia Twoje nogi, tors, całe ciało ciepłem.", "Jesteś zakorzeniona. Jesteś trzymana. Jesteś wspierana."], icon: "🌳" },
  { id: "cold", title: "Cold Water Reset", titlePl: "Reset zimną wodą", duration: "1 min", description: "A quick physiological reset using cold water.", descPl: "Szybki fizjologiczny reset przy użyciu zimnej wody.", steps: ["Go to a sink or use a glass of cold water.", "Splash cold water on your face.", "Or hold a cold object in your hands.", "Focus completely on the sensation of cold.", "Breathe slowly as the cold brings you into the present.", "Notice: you are here, right now, in this moment."], stepsPl: ["Idź do zlewu lub użyj szklanki zimnej wody.", "Opryskaj twarz zimną wodą.", "Lub trzymaj zimny przedmiot w dłoniach.", "Skup się całkowicie na uczuciu zimna.", "Oddychaj powoli gdy zimno sprowadza Cię do teraźniejszości.", "Zauważ: jesteś tutaj, teraz, w tej chwili."], icon: "💧" },
];

const CRISIS_RESOURCES_EN = [
  { name: "Samaritans (UK)", phone: "116 123", description: "24/7 emotional support, free to call", url: "https://www.samaritans.org" },
  { name: "Crisis Text Line", phone: "Text SHOUT to 85258", description: "Free 24/7 text support (UK)", url: "https://giveusashout.org" },
  { name: "988 Lifeline (US)", phone: "988", description: "24/7 call or text support", url: "https://988lifeline.org" },
  { name: "Mind", phone: "0300 123 3393", description: "Mental health support (UK)", url: "https://www.mind.org.uk" },
];

const CRISIS_RESOURCES_PL = [
  { name: "Centrum Wsparcia", phone: "800 70 2222", description: "Bezpłatna pomoc kryzysowa 24/7", url: "https://centrumwsparcia.pl" },
  { name: "Telefon Zaufania", phone: "116 123", description: "Wsparcie emocjonalne (EU)", url: "https://116sos.pl" },
  { name: "Telefon dla Dzieci i Młodzieży", phone: "116 111", description: "Pomoc dla młodych osób", url: "https://116111.pl" },
  { name: "Fundacja ITAKA", phone: "801 002 801", description: "Pomoc w sytuacjach kryzysowych", url: "https://www.itaka.org.pl" },
];

export default function GroundingPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showResources, setShowResources] = useState(false);
  const exercise = GROUNDING_EXERCISES.find((e) => e.id === activeExercise);

  const nextStep = () => {
    if (exercise && currentStep < exercise.steps.length - 1) setCurrentStep(currentStep + 1);
    else { setActiveExercise(null); setCurrentStep(0); }
  };

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
      <header className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/dashboard")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>← {t("back")}</button>
          <div className="w-12" />
        </div>
        <h1 className="text-2xl md:text-3xl tracking-[0.25em] uppercase text-center mt-3" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>{t("grounding_title")}</h1>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-12 space-y-6">
        <p className="text-center text-lg md:text-xl leading-relaxed italic" style={{ color: "var(--color-mauve)", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          &ldquo;{language === "pl" ? "Jesteś bezpieczna w tej chwili. Te narzędzia są tu, żeby pomóc Ci wrócić do siebie." : "You are safe in this moment. These tools are here to help you return to yourself."}&rdquo;
        </p>

        {exercise ? (
          <section className="rounded-2xl border p-6 space-y-6 transition-colors duration-500" style={{ background: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
            <div className="text-center space-y-2">
              <span>{EXERCISE_ICONS[exercise.id] || exercise.icon}</span>
              <h2 className="text-lg font-medium" style={{ color: "var(--color-dark)" }}>{language === "pl" ? exercise.titlePl : exercise.title}</h2>
              <p className="text-xs" style={{ color: "var(--color-mauve)" }}>{language === "pl" ? `Krok ${currentStep + 1} z ${exercise.steps.length}` : `Step ${currentStep + 1} of ${exercise.steps.length}`}</p>
            </div>
            <div className="w-full h-1 rounded-full" style={{ background: "var(--color-dusty-rose)" }}>
              <div className="h-1 rounded-full transition-all duration-500" style={{ width: `${((currentStep + 1) / exercise.steps.length) * 100}%`, background: "var(--color-mauve)" }} />
            </div>
            <p className="text-center text-base leading-relaxed min-h-[4rem] flex items-center justify-center" style={{ color: "var(--color-dark)" }}>{language === "pl" ? exercise.stepsPl[currentStep] : exercise.steps[currentStep]}</p>
            <div className="flex justify-center gap-3">
              {currentStep > 0 && (
                <button onClick={() => setCurrentStep(currentStep - 1)} className="px-5 py-2.5 rounded-xl text-sm border" style={{ borderColor: "var(--color-dusty-rose)", color: "var(--color-plum)" }}>{language === "pl" ? "← Wstecz" : "← Previous"}</button>
              )}
              <button onClick={nextStep} className="px-5 py-2.5 rounded-xl text-sm" style={{ background: "var(--color-plum)", color: "var(--color-cream)" }}>
                {currentStep === exercise.steps.length - 1 ? (language === "pl" ? "✓ Koniec" : "✓ Finish") : (language === "pl" ? "Dalej →" : "Next →")}
              </button>
            </div>
            <button onClick={() => { setActiveExercise(null); setCurrentStep(0); }} className="block mx-auto text-xs" style={{ color: "var(--color-mauve)" }}>{language === "pl" ? "Zakończ ćwiczenie" : "Exit exercise"}</button>
          </section>
        ) : (
          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-sm tracking-widest uppercase text-center" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>{language === "pl" ? "Ćwiczenia uziemiające" : "Grounding Exercises"}</h2>
              {GROUNDING_EXERCISES.map((ex) => (
                <button key={ex.id} onClick={() => { setActiveExercise(ex.id); setCurrentStep(0); }}
                  className="w-full text-left p-4 rounded-2xl border hover:scale-[1.01] transition-all"
                  style={{ background: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
                  <div className="flex items-start gap-3">
                    <span>{EXERCISE_ICONS[ex.id] || ex.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium" style={{ color: "var(--color-dark)" }}>{language === "pl" ? ex.titlePl : ex.title}</h3>
                        <span className="text-xs" style={{ color: "var(--color-mauve)" }}>{ex.duration}</span>
                      </div>
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--color-mauve)" }}>{language === "pl" ? ex.descPl : ex.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </section>

            <section className="space-y-3">
              <button onClick={() => setShowResources(!showResources)}
                className="w-full text-center py-4 px-4 rounded-xl transition-all"
                style={{ background: "var(--color-blush)", border: "1px solid var(--color-dusty-rose)" }}>
                <p className="text-base font-medium" style={{ color: "var(--color-dark)" }}>{t("grounding_need_help")}</p>
                <p className="text-xs mt-1" style={{ color: "var(--color-mauve)" }}>{showResources ? (language === "pl" ? "Kliknij, aby ukryć" : "Tap to hide") : (language === "pl" ? "Kliknij, aby zobaczyć zasoby wsparcia" : "Tap to see support resources")}</p>
              </button>
              {showResources && (
                <div className="space-y-2">
                  <p className="text-xs text-center leading-relaxed" style={{ color: "var(--color-mauve)" }}>{language === "pl" ? "Nie jesteś sama. Te serwisy są poufne i dostępne, kiedy ich potrzebujesz." : "You are not alone. These services are confidential and available when you need them."}</p>
                  {(language === "pl" ? CRISIS_RESOURCES_PL : CRISIS_RESOURCES_EN).map((r: { name: string; phone: string; description: string; url: string }) => (
                    <div key={r.name} onClick={() => window.open(r.url, "_blank")}
                      className="cursor-pointer p-4 rounded-2xl border hover:scale-[1.01] transition-all"
                      style={{ background: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
                      <h3 className="text-sm font-medium" style={{ color: "var(--color-dark)" }}>{r.name}</h3>
                      <p className="text-base font-medium mt-1" style={{ color: "var(--color-plum)" }}>{r.phone}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-mauve)" }}>{r.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}