// Simple moon phase calculator based on lunar cycle (29.53 days)
// No external API needed — pure math

const LUNAR_CYCLE = 29.53058867;

// Reference new moon: January 6, 2000 18:14 UTC
const KNOWN_NEW_MOON = new Date("2000-01-06T18:14:00Z").getTime();

export type MoonPhaseInfo = {
  phase: string;
  emoji: string;
  illumination: number;
  daysIntoCycle: number;
  description: string;
};

export function getMoonPhase(date: Date = new Date()): MoonPhaseInfo {
  const diffMs = date.getTime() - KNOWN_NEW_MOON;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const daysIntoCycle = ((diffDays % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE;

  // Calculate illumination (0 to 1 and back to 0)
  const illumination =
    daysIntoCycle <= LUNAR_CYCLE / 2
      ? (daysIntoCycle / (LUNAR_CYCLE / 2)) * 100
      : ((LUNAR_CYCLE - daysIntoCycle) / (LUNAR_CYCLE / 2)) * 100;

  // Determine phase name
  if (daysIntoCycle < 1.85) {
    return {
      phase: "New Moon",
      emoji: "🌑",
      illumination: Math.round(illumination),
      daysIntoCycle: Math.round(daysIntoCycle * 10) / 10,
      description: "A time for new beginnings. Set intentions in the dark.",
    };
  } else if (daysIntoCycle < 7.38) {
    return {
      phase: "Waxing Crescent",
      emoji: "🌒",
      illumination: Math.round(illumination),
      daysIntoCycle: Math.round(daysIntoCycle * 10) / 10,
      description: "Your intentions take root. Nurture what you've planted.",
    };
  } else if (daysIntoCycle < 9.23) {
    return {
      phase: "First Quarter",
      emoji: "🌓",
      illumination: Math.round(illumination),
      daysIntoCycle: Math.round(daysIntoCycle * 10) / 10,
      description: "A crossroads. Make decisions and take action.",
    };
  } else if (daysIntoCycle < 14.77) {
    return {
      phase: "Waxing Gibbous",
      emoji: "🌔",
      illumination: Math.round(illumination),
      daysIntoCycle: Math.round(daysIntoCycle * 10) / 10,
      description: "Refine and adjust. Trust the process unfolding.",
    };
  } else if (daysIntoCycle < 16.61) {
    return {
      phase: "Full Moon",
      emoji: "🌕",
      illumination: Math.round(illumination),
      daysIntoCycle: Math.round(daysIntoCycle * 10) / 10,
      description:
        "Illumination and release. See what the light reveals.",
    };
  } else if (daysIntoCycle < 22.15) {
    return {
      phase: "Waning Gibbous",
      emoji: "🌖",
      illumination: Math.round(illumination),
      daysIntoCycle: Math.round(daysIntoCycle * 10) / 10,
      description: "Gratitude and sharing. Give back what you've received.",
    };
  } else if (daysIntoCycle < 24.0) {
    return {
      phase: "Last Quarter",
      emoji: "🌗",
      illumination: Math.round(illumination),
      daysIntoCycle: Math.round(daysIntoCycle * 10) / 10,
      description: "Release and forgive. Let go of what no longer serves you.",
    };
  } else {
    return {
      phase: "Waning Crescent",
      emoji: "🌘",
      illumination: Math.round(illumination),
      daysIntoCycle: Math.round(daysIntoCycle * 10) / 10,
      description: "Rest and surrender. The dark holds wisdom.",
    };
  }
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Deep night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}
const DAILY_INSIGHTS: Record<string, { en: string; pl: string }[]> = {
  "New Moon": [
    { en: "What have you been pretending not to know?", pl: "O czym udajesz, ze nie wiesz?" },
    { en: "If you started over today, what would you not rebuild?", pl: "Gdybys zaczynala od nowa, czego bys nie odbudowala?" },
    { en: "What decision are you postponing and why?", pl: "Jaka decyzje odkladasz i dlaczego?" },
    { en: "Who are you when nobody needs anything from you?", pl: "Kim jestes, kiedy nikt niczego od ciebie nie potrzebuje?" },
    { en: "What are you protecting yourself from feeling?", pl: "Przed jakim uczuciem sie chronisz?" },
  ],
  "Waxing Crescent": [
    { en: "What did you say you would do that you have not done?", pl: "Co obiecalas sobie zrobic, a czego nie zrobilas?" },
    { en: "Where are you performing instead of being honest?", pl: "Gdzie grasz role zamiast byc szczera?" },
    { en: "What keeps showing up that you keep ignoring?", pl: "Co ciagle wraca, a ty to ignorujesz?" },
    { en: "Are you actually committed or just comfortable with the idea?", pl: "Naprawde jestes zaangazowana czy tylko podoba ci sie ten pomysl?" },
    { en: "What would change if you stopped explaining yourself?", pl: "Co by sie zmienilo, gdybys przestala sie tlumaczyc?" },
  ],
  "First Quarter": [
    { en: "Where are you saying yes when you mean no?", pl: "Gdzie mowisz tak, kiedy masz na mysli nie?" },
    { en: "What conflict are you avoiding right now?", pl: "Jakiego konfliktu teraz unikasz?" },
    { en: "What would you do differently if you trusted yourself?", pl: "Co zrobilabys inaczej, gdybys sobie zaufala?" },
    { en: "Who are you trying to convince and why?", pl: "Kogo probujsz przekonac i po co?" },
    { en: "What feels hard right now and what are you making it mean about you?", pl: "Co jest teraz trudne i co z tego wnosisz o sobie?" },
  ],
  "Waxing Gibbous": [
    { en: "What are you overcomplicating to avoid finishing?", pl: "Co komplikujesz, zeby nie musiec skonczyc?" },
    { en: "Where are you waiting for permission you do not need?", pl: "Na czyje pozwolenie czekasz, choc go nie potrzebujesz?" },
    { en: "What would be enough for you today?", pl: "Co dzisiaj byloby dla ciebie wystarczajace?" },
    { en: "Are you adjusting or just second-guessing?", pl: "Poprawiasz czy po prostu watpisz?" },
    { en: "What are you afraid will happen if this actually works?", pl: "Czego sie boisz, jesli to naprawde wypadnie?" },
  ],
  "Full Moon": [
    { en: "What can you see now that you were not ready to see before?", pl: "Co widzisz teraz, na co wczesniej nie bylas gotowa?" },
    { en: "What are you holding onto that is not yours?", pl: "Co trzymasz, co nie jest twoje?" },
    { en: "What did you learn this month that you did not want to learn?", pl: "Czego nauczylas sie w tym miesiacu, choc nie chcialas?" },
    { en: "Where have you been dishonest with yourself?", pl: "Gdzie bylas wobec siebie nieuczciwa?" },
    { en: "What would you have to feel if you stopped being busy?", pl: "Co musialbys poczuc, gdybys przestala byc zajeta?" },
  ],
  "Waning Gibbous": [
    { en: "What worked and are you willing to admit it?", pl: "Co zadzialalo i czy jestes gotowa to przyznac?" },
    { en: "Where did you surprise yourself recently?", pl: "Gdzie ostatnio sie zaskoczyl?" },
    { en: "What do you keep giving that nobody asked for?", pl: "Co ciagle dajesz, choc nikt nie prosil?" },
    { en: "What would rest actually look like if you allowed it?", pl: "Jak wygladlby odpoczynek, gdybys sobie na niego pozwolila?" },
    { en: "Who do you owe an honest conversation?", pl: "Komu jestes winna szczera rozmowe?" },
  ],
  "Last Quarter": [
    { en: "What pattern keeps returning? That is your work.", pl: "Jaki wzorzec ciagle wraca? To jest twoja praca." },
    { en: "What are you still carrying that you already know the answer to?", pl: "Co nadal dzwigasz, choc znasz juz odpowiedz?" },
    { en: "What would you stop doing if nobody was watching?", pl: "Co bys przestala robic, gdyby nikt nie patrzyl?" },
    { en: "Where are you repeating something hoping for a different result?", pl: "Gdzie powtarzasz cos, liczac na inny wynik?" },
    { en: "What are you afraid to outgrow?", pl: "Z czego boisz sie wyrosnac?" },
  ],
  "Waning Crescent": [
    { en: "What do you need that you keep denying yourself?", pl: "Czego potrzebujesz, a ciagle sobie odmawiasz?" },
    { en: "When was the last time you did nothing without guilt?", pl: "Kiedy ostatnio nic nie robilas bez poczucia winy?" },
    { en: "What are you forcing that would work better if you left it alone?", pl: "Co forsujsz, choc lepiej byloby to zostawic?" },
    { en: "What is your body telling you that your mind keeps overriding?", pl: "Co mowi ci cialo, a umysl to zaglusaz?" },
    { en: "What would you hear if you actually got quiet?", pl: "Co bys uslyszala, gdybys naprawde sie uciszyla?" },
  ],
};

export function getDailyInsight(phase: string, lang: "en" | "pl" = "en"): string {
  const insights = DAILY_INSIGHTS[phase] || DAILY_INSIGHTS["New Moon"];
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const insight = insights[dayOfYear % insights.length];
  return insight[lang] || insight.en;
}