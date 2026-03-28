"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

const GROUNDING_EXERCISES = [
  { id: "54321", title: "5-4-3-2-1 Senses", titlePl: "5-4-3-2-1 Zmysly", duration: "3-5 min", description: "Ground yourself through your senses.", descPl: "Uziemij sie przez zmysly.", steps: ["Take a slow, deep breath.", "Look around and name 5 things you can SEE.", "Reach out and name 4 things you can TOUCH.", "Listen carefully and name 3 things you can HEAR.", "Notice 2 things you can SMELL.", "Name 1 thing you can TASTE.", "Take another deep breath. You are here. You are safe."], stepsPl: ["Wez powolny, gleboki oddech.", "Rozejrzyj sie i nazwij 5 rzeczy ktore WIDZISZ.", "Nazwij 4 rzeczy ktorych mozesz DOTKNAC.", "Wsuchaj sie i nazwij 3 rzeczy ktore SLYSZYSZ.", "Zauważ 2 rzeczy ktore CZUJESZ zapachem.", "Nazwij 1 rzecz ktora mozesz POSMAKOWAC.", "Wez kolejny gleboki oddech. Jestes tutaj. Jestes bezpieczna."], icon: "✋" },
  { id: "breathing", title: "Box Breathing", titlePl: "Oddychanie pudelkowe", duration: "2-4 min", description: "Inhale, hold, exhale, hold - each for 4 counts.", descPl: "Wdech, wstrzymaj, wydech, wstrzymaj - kazde na 4.", steps: ["Sit comfortably and close your eyes if you wish.", "Breathe IN slowly for 4 counts.", "HOLD your breath for 4 counts.", "Breathe OUT slowly for 4 counts.", "HOLD empty for 4 counts.", "Repeat 4-6 times.", "Notice how your body feels now."], stepsPl: ["Usiadz wygodnie i zamknij oczy jesli chcesz.", "WDYCHAJ powoli liczac do 4.", "WSTRZYMAJ oddech liczac do 4.", "WYDYCHAJ powoli liczac do 4.", "WSTRZYMAJ bez powietrza liczac do 4.", "Powtorz 4-6 razy.", "Zauważ jak czuje sie teraz twoje cialo."], icon: "🌬" },
  { id: "bodyscan", title: "Quick Body Scan", titlePl: "Szybkie skanowanie ciala", duration: "3-5 min", description: "Bring gentle awareness to each part of your body.", descPl: "Skieruj lagodna uwage na kazda czesc ciala.", steps: ["Close your eyes or soften your gaze.", "Notice your feet on the ground.", "Move awareness to your legs. Release any tension.", "Notice your belly. Let it soften with each breath.", "Feel your chest and heart space. Breathe into it.", "Relax your shoulders away from your ears.", "Soften your jaw, your forehead, the space behind your eyes.", "Take a full breath. You are whole. You are here."], stepsPl: ["Zamknij oczy lub zlagodz wzrok.", "Poczuj swoje stopy na podlodze.", "Przenies uwage na nogi. Pusc napiecie.", "Poczuj brzuch. Niech sie rozluzni z kazdym oddechem.", "Poczuj klatke piersiowa. Oddychaj w nia.", "Rozluz ramiona z dala od uszu.", "Rozluz szczeke, czolo, przestrzen za oczami.", "Wez pelny oddech. Jestes cala. Jestes tutaj."], icon: "🧘" },
  { id: "rooting", title: "Rooting Visualisation", titlePl: "Wizualizacja zakorzenienia", duration: "2-3 min", description: "Imagine roots growing from your body into the earth.", descPl: "Wyobraz sobie korzenie rosnace z twojego ciala w ziemie.", steps: ["Stand or sit with your feet flat on the floor.", "Imagine roots growing from the soles of your feet.", "See them reaching down through the floor, into the earth.", "They grow deeper - through soil, stone, and water.", "Feel the earth energy rising back up through your roots.", "It fills your legs, your core, your whole body with warmth.", "You are rooted. You are held. You are supported."], stepsPl: ["Stan lub usiadz ze stopami plasko na podlodze.", "Wyobraz sobie korzenie rosnace ze stop.", "Patrz jak siegaja w dol przez podloge, w ziemie.", "Rosna glebiej - przez glebe, kamien i wode.", "Poczuj energie ziemi plynaca z powrotem przez korzenie.", "Wypelnia twoje nogi, tors, cale cialo cieplem.", "Jestes zakorzeniona. Jestes trzymana. Jestes wspierana."], icon: "🌳" },
  { id: "cold", title: "Cold Water Reset", titlePl: "Reset zimna woda", duration: "1 min", description: "A quick physiological reset using cold water.", descPl: "Szybki fizjologiczny reset przy uzyciu zimnej wody.", steps: ["Go to a sink or use a glass of cold water.", "Splash cold water on your face.", "Or hold a cold object in your hands.", "Focus completely on the sensation of cold.", "Breathe slowly as the cold brings you into the present.", "Notice: you are here, right now, in this moment."], stepsPl: ["Idz do zlewu lub uzyj szklanki zimnej wody.", "Opryskaj twarz zimna woda.", "Lub trzymaj zimny przedmiot w dloniach.", "Skup sie calkowicie na uczuciu zimna.", "Oddychaj powoli gdy zimno sprowadza cie do terazniejszosci.", "Zauważ: jestes tutaj, teraz, w tej chwili."], icon: "💧" },
];

const CRISIS_RESOURCES = [
  { name: "Samaritans (UK)", phone: "116 123", description: "24/7 emotional support, free to call", descPl: "Calodobowe wsparcie emocjonalne, bezplatne", url: "https://www.samaritans.org" },
  { name: "Crisis Text Line", phone: "Text SHOUT to 85258", description: "Free 24/7 text support (UK)", descPl: "Bezplatne wsparcie SMS 24/7 (UK)", url: "https://giveusashout.org" },
  { name: "988 Lifeline (US)", phone: "988", description: "24/7 call or text support", descPl: "Calodobowe wsparcie telefoniczne i SMS", url: "https://988lifeline.org" },
  { name: "Mind", phone: "0300 123 3393", description: "Mental health support (UK)", descPl: "Wsparcie zdrowia psychicznego (UK)", url: "https://www.mind.org.uk" },
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
    <div className="min-h-screen transition-colors duration-500" style={{ backgroundColor: "var(--color-cream)" }}>
      <header className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/dashboard")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>← {t("back")}</button>
          <div className="w-12" />
        </div>
        <h1 className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3" style={{ color: "var(--color-plum)", fontFamily: "'Antic Didone', Georgia, serif", fontWeight: 700 }}>{t("grounding_title")}</h1>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-12 space-y-6">
        <p className="text-center text-sm leading-relaxed italic" style={{ color: "var(--color-mauve)" }}>
          &ldquo;{language === "pl" ? "Jestes bezpieczna w tej chwili. Te narzedzia sa tu zeby pomoc ci wrocic do siebie." : "You are safe in this moment. These tools are here to help you return to yourself."}&rdquo;
        </p>

        {exercise ? (
          <section className="rounded-2xl border p-6 space-y-6 transition-colors duration-500" style={{ background: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
            <div className="text-center space-y-2">
              <span className="text-3xl">{exercise.icon}</span>
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
            <button onClick={() => { setActiveExercise(null); setCurrentStep(0); }} className="block mx-auto text-xs" style={{ color: "var(--color-mauve)" }}>{language === "pl" ? "Zakoncz cwiczenie" : "Exit exercise"}</button>
          </section>
        ) : (
          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-xs tracking-widest uppercase text-center" style={{ color: "var(--color-mauve)" }}>{language === "pl" ? "Cwiczenia uziemiajace" : "Grounding Exercises"}</h2>
              {GROUNDING_EXERCISES.map((ex) => (
                <button key={ex.id} onClick={() => { setActiveExercise(ex.id); setCurrentStep(0); }}
                  className="w-full text-left p-4 rounded-2xl border hover:scale-[1.01] transition-all"
                  style={{ background: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{ex.icon}</span>
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
                <p className="text-xs mt-1" style={{ color: "var(--color-mauve)" }}>{showResources ? (language === "pl" ? "Kliknij aby ukryc" : "Tap to hide") : (language === "pl" ? "Kliknij aby zobaczyc zasoby wsparcia" : "Tap to see support resources")}</p>
              </button>
              {showResources && (
                <div className="space-y-2">
                  <p className="text-xs text-center leading-relaxed" style={{ color: "var(--color-mauve)" }}>{language === "pl" ? "Nie jestes sama. Te serwisy sa poufne i dostepne kiedy ich potrzebujesz." : "You are not alone. These services are confidential and available when you need them."}</p>
                  {CRISIS_RESOURCES.map((r) => (
                    <div key={r.name} onClick={() => window.open(r.url, "_blank")}
                      className="cursor-pointer p-4 rounded-2xl border hover:scale-[1.01] transition-all"
                      style={{ background: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
                      <h3 className="text-sm font-medium" style={{ color: "var(--color-dark)" }}>{r.name}</h3>
                      <p className="text-base font-medium mt-1" style={{ color: "var(--color-plum)" }}>{r.phone}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-mauve)" }}>{language === "pl" ? r.descPl : r.description}</p>
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