"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

const LETTER_EN = [
  "Dear,",
  "You're here because something brought you. A pattern you can't name. A dream that won't leave you alone. A feeling that returns every month at the same time. A question you keep circling back to.",
  "Noctua was built around one idea: you already know more about yourself than you think. You just haven't had a place to see it clearly.",
  "Your dreams carry messages. Not metaphors from a textbook, real, specific signals from the parts of you that don't get airtime during the day. The symbols that repeat, the emotions that surface at 3am, the scenarios you can't shake. They're not random. They're a language. This app helps you learn to read it.",
  "Your cycle isn't just biology. It's a rhythm that shapes how you think, what you feel, and when you have the capacity to face difficult things. Most of us were taught to push through regardless. That's not strength. That's ignoring data your body is giving you for free.",
  "The moon isn't decoration. It's a clock that cultures have used for thousands of years to time inner work. When you align your reflection with lunar phases, patterns emerge that you can't see any other way.",
  "Shadow work is the centre of everything here. Not the version that asks you to light a candle and say affirmations. The version that asks: what are you avoiding? Where are you lying to yourself? What would happen if you stopped performing?",
  "The prompts in this app are direct. They're designed to cut through the stories you tell yourself and reach what's actually underneath. Some will hit immediately. Some won't make sense until later. Some you'll want to skip, and that resistance is information too.",
  "This isn't meant to be completed. It's meant to be returned to. Your answers will change as you change. A prompt that means nothing today might crack you open in six months.",
  "Use what serves you. Ignore what doesn't. Come back when something shifts.",
  "This is your work. Not anyone else's.",
  "Welcome.",
];

const LETTER_PL = [
  "Cześć,",
  "Jesteś tu, bo coś Cię przyciągnęło. Wzorzec, którego nie umiesz nazwać. Sen, który nie daje Ci spokoju. Uczucie, które wraca co miesiąc o tej samej porze. Pytanie, do którego ciągle wracasz.",
  "Noctua powstała wokół jednej idei: wiesz o sobie więcej, niż myślisz. Po prostu nie miałaś miejsca, żeby to zobaczyć wyraźnie.",
  "Twoje sny niosą przesłania. Nie metafory z podręcznika, prawdziwe, konkretne sygnały z tych części Ciebie, które nie dostają głosu za dnia. Symbole, które się powtarzają, emocje, które wypływają o trzeciej w nocy, scenariusze, których nie możesz się pozbyć. To nie przypadek. To język. Ta aplikacja pomaga Ci się go nauczyć.",
  "Twój cykl to nie tylko biologia. To rytm, który kształtuje to, jak myślisz, co czujesz i kiedy masz siłę zmierzyć się z trudnymi rzeczami. Większość z nas nauczono przebijać się dalej bez względu na wszystko. To nie jest siła. To ignorowanie danych, które Twoje ciało daje Ci za darmo.",
  "Księżyc to nie dekoracja. To zegar, którego kultury używały od tysięcy lat do planowania pracy wewnętrznej. Kiedy synchronizujesz swoją refleksję z fazami księżyca, pojawiają się wzorce, których nie zobaczysz w żaden inny sposób.",
  "Praca z cieniem jest sercem wszystkiego tutaj. Nie ta wersja, która każe Ci zapalić świeczkę i powtarzać afirmacje. Ta, która pyta: czego unikasz? Gdzie okłamujesz siebie? Co by się stało, gdybyś przestała grać?",
  "Prompty w tej aplikacji są bezpośrednie. Zaprojektowane, żeby przebić się przez historie, które sobie opowiadasz, i dotrzeć do tego, co jest naprawdę pod spodem. Niektóre trafią od razu. Niektóre nabiorą sensu później. Niektóre będziesz chciała pominąć, i ten opór też jest informacją.",
  "To nie jest coś do ukończenia. To coś, do czego się wraca. Twoje odpowiedzi będą się zmieniać, tak jak Ty się zmieniasz. Prompt, który dziś nic nie znaczy, może Cię otworzyć za pół roku.",
  "Używaj tego, co Ci służy. Ignoruj to, co nie. Wracaj, kiedy coś się zmieni.",
  "To jest Twoja praca. Niczyja inna.",
  "Witaj.",
];

export default function LetterPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const paragraphs = language === "pl" ? LETTER_PL : LETTER_EN;

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
      <header className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/dashboard")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>← {language === "pl" ? "Wróć" : "Back"}</button>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-xl mx-auto px-8 pb-16 pt-4">
        <div className="space-y-6">
          {paragraphs.map((p, i) => (
            <p key={i}
              className="leading-relaxed transition-colors duration-500"
              style={{
                color: i === 0 ? "var(--color-dark)" : "var(--color-dark)",
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: i === 0 ? "1.75rem" : i === paragraphs.length - 1 ? "1.25rem" : "1.15rem",
                fontWeight: i === 0 ? 600 : 400,
                fontStyle: i === 0 ? "normal" : "normal",
                opacity: i === 0 ? 1 : 0.85,
                textAlign: i === 0 || i === paragraphs.length - 1 ? "left" : "justify",
              }}
            >
              {p}
            </p>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 mt-10 mb-6">
          <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
          <span className="text-xs" style={{ color: "var(--color-gold)", opacity: 0.6 }}>◇</span>
          <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
        </div>

        <p className="text-center tracking-[0.35em]"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "0.85rem",
            fontWeight: 500,
            background: "linear-gradient(135deg, #B8860B, #D4AF37, #E8C860, #D4AF37, #B8860B)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
          AGNÉLIS
        </p>
      </main>
    </div>
  );
}