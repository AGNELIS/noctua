"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const GROUNDING_EXERCISES = [
  {
    id: "54321",
    title: "5-4-3-2-1 Senses",
    duration: "3-5 min",
    description: "Ground yourself through your senses.",
    steps: [
      "Take a slow, deep breath.",
      "Look around and name 5 things you can SEE.",
      "Reach out and name 4 things you can TOUCH.",
      "Listen carefully and name 3 things you can HEAR.",
      "Notice 2 things you can SMELL.",
      "Name 1 thing you can TASTE.",
      "Take another deep breath. You are here. You are safe.",
    ],
    icon: "✋",
  },
  {
    id: "breathing",
    title: "Box Breathing",
    duration: "2-4 min",
    description: "Inhale, hold, exhale, hold — each for 4 counts.",
    steps: [
      "Sit comfortably and close your eyes if you wish.",
      "Breathe IN slowly for 4 counts.",
      "HOLD your breath for 4 counts.",
      "Breathe OUT slowly for 4 counts.",
      "HOLD empty for 4 counts.",
      "Repeat 4-6 times.",
      "Notice how your body feels now.",
    ],
    icon: "🌬",
  },
  {
    id: "bodyscan",
    title: "Quick Body Scan",
    duration: "3-5 min",
    description: "Bring gentle awareness to each part of your body.",
    steps: [
      "Close your eyes or soften your gaze.",
      "Notice your feet on the ground.",
      "Move awareness to your legs. Release any tension.",
      "Notice your belly. Let it soften with each breath.",
      "Feel your chest and heart space. Breathe into it.",
      "Relax your shoulders away from your ears.",
      "Soften your jaw, your forehead, the space behind your eyes.",
      "Take a full breath. You are whole. You are here.",
    ],
    icon: "🧘",
  },
  {
    id: "rooting",
    title: "Rooting Visualisation",
    duration: "2-3 min",
    description: "Imagine roots growing from your body into the earth.",
    steps: [
      "Stand or sit with your feet flat on the floor.",
      "Imagine roots growing from the soles of your feet.",
      "See them reaching down through the floor, into the earth.",
      "They grow deeper — through soil, stone, and water.",
      "Feel the earth energy rising back up through your roots.",
      "It fills your legs, your core, your whole body with warmth.",
      "You are rooted. You are held. You are supported.",
    ],
    icon: "🌳",
  },
  {
    id: "cold",
    title: "Cold Water Reset",
    duration: "1 min",
    description: "A quick physiological reset using cold water.",
    steps: [
      "Go to a sink or use a glass of cold water.",
      "Splash cold water on your face.",
      "Or hold a cold object in your hands.",
      "Focus completely on the sensation of cold.",
      "Breathe slowly as the cold brings you into the present.",
      "Notice: you are here, right now, in this moment.",
    ],
    icon: "💧",
  },
];

const CRISIS_RESOURCES = [
  { name: "Samaritans (UK)", phone: "116 123", description: "24/7 emotional support, free to call", url: "https://www.samaritans.org" },
  { name: "Crisis Text Line", phone: "Text SHOUT to 85258", description: "Free 24/7 text support (UK)", url: "https://giveusashout.org" },
  { name: "988 Lifeline (US)", phone: "988", description: "24/7 call or text support", url: "https://988lifeline.org" },
  { name: "Mind", phone: "0300 123 3393", description: "Mental health support (UK)", url: "https://www.mind.org.uk" },
];

export default function GroundingPage() {
  const router = useRouter();
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const exercise = GROUNDING_EXERCISES.find((e) => e.id === activeExercise);

  const nextStep = () => {
    if (exercise && currentStep < exercise.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setActiveExercise(null);
      setCurrentStep(0);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(to bottom, #f0f5f0, #eaf0ea, #e4ebe4)" }}>
      <header className="flex items-center justify-between px-6 py-5">
        <button onClick={() => router.push("/dashboard")} className="text-xs tracking-wide" style={{ color: "#7a8a6a" }}>← Back</button>
        <h1 className="text-sm tracking-[0.35em] uppercase font-light" style={{ color: "#4a6040" }}>Grounding</h1>
        <div className="w-12" />
      </header>
      <main className="max-w-xl mx-auto px-6 pb-12 space-y-6">
        <p className="text-center text-sm leading-relaxed italic" style={{ color: "#6a7a5a" }}>&ldquo;You are safe in this moment. These tools are here to help you return to yourself.&rdquo;</p>
        {exercise ? (
          <section className="rounded-2xl border p-6 space-y-6" style={{ background: "rgba(255,255,255,0.6)", borderColor: "rgba(120,160,100,0.3)" }}>
            <div className="text-center space-y-2">
              <span className="text-3xl">{exercise.icon}</span>
              <h2 className="text-lg font-medium" style={{ color: "#3a4a30" }}>{exercise.title}</h2>
              <p className="text-xs" style={{ color: "#7a8a6a" }}>Step {currentStep + 1} of {exercise.steps.length}</p>
            </div>
            <div className="w-full h-1 rounded-full" style={{ background: "rgba(120,160,100,0.15)" }}>
              <div className="h-1 rounded-full transition-all duration-500" style={{ width: `${((currentStep + 1) / exercise.steps.length) * 100}%`, background: "rgba(100,140,80,0.4)" }} />
            </div>
            <p className="text-center text-base leading-relaxed min-h-[4rem] flex items-center justify-center" style={{ color: "#3a4a30" }}>{exercise.steps[currentStep]}</p>
            <div className="flex justify-center gap-3">
              {currentStep > 0 && (<button onClick={() => setCurrentStep(currentStep - 1)} className="px-5 py-2.5 rounded-xl text-sm border" style={{ borderColor: "rgba(120,160,100,0.3)", color: "#4a6040" }}>← Previous</button>)}
              <button onClick={nextStep} className="px-5 py-2.5 rounded-xl text-sm text-white" style={{ background: "#4a6040" }}>{currentStep === exercise.steps.length - 1 ? "✓ Finish" : "Next →"}</button>
            </div>
            <button onClick={() => { setActiveExercise(null); setCurrentStep(0); }} className="block mx-auto text-xs" style={{ color: "#7a8a6a" }}>Exit exercise</button>
          </section>
        ) : (
          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-xs tracking-widest uppercase text-center" style={{ color: "#7a8a6a" }}>Grounding Exercises</h2>
              {GROUNDING_EXERCISES.map((ex) => (
                <button key={ex.id} onClick={() => { setActiveExercise(ex.id); setCurrentStep(0); }} className="w-full text-left p-4 rounded-2xl border hover:scale-[1.01] transition-all" style={{ background: "rgba(255,255,255,0.5)", borderColor: "rgba(120,160,100,0.25)" }}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{ex.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium" style={{ color: "#3a4a30" }}>{ex.title}</h3>
                        <span className="text-xs" style={{ color: "#7a8a6a" }}>{ex.duration}</span>
                      </div>
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: "#5a6a4a" }}>{ex.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </section>
            <section className="space-y-3">
              <div className="text-center py-3 px-4 rounded-xl" style={{ background: "rgba(120,160,100,0.12)" }}>
                <p className="text-sm font-medium" style={{ color: "#3a4a30" }}>Need to talk to someone?</p>
              </div>
              <p className="text-xs text-center leading-relaxed" style={{ color: "#5a6a4a" }}>You are not alone. These services are confidential and available when you need them.</p>
              {CRISIS_RESOURCES.map((r) => (
                <div key={r.name} onClick={() => window.open(r.url, "_blank")} className="cursor-pointer p-4 rounded-2xl border hover:scale-[1.01] transition-all" style={{ background: "rgba(255,255,255,0.5)", borderColor: "rgba(120,160,100,0.25)" }}>
                  <h3 className="text-sm font-medium" style={{ color: "#3a4a30" }}>{r.name}</h3>
                  <p className="text-base font-medium mt-1" style={{ color: "#4a6040" }}>{r.phone}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#7a8a6a" }}>{r.description}</p>
                </div>
              ))}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}