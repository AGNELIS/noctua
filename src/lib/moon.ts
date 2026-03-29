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

export function getGreeting(lang: "en" | "pl" = "en"): string {
  const hour = new Date().getHours();
  if (lang === "pl") {
    if (hour < 6) return "Dobranoc";
    if (hour < 12) return "Dzień dobry";
    if (hour < 17) return "Dzień dobry";
    if (hour < 21) return "Dobry wieczór";
    return "Dobranoc";
  }
  if (hour < 6) return "Deep night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}
const DAILY_INSIGHTS: Record<string, { en: string; pl: string }[]> = {
  "New Moon": [
    { en: "What have you been pretending not to know?", pl: "O czym udajesz, ze nie wiesz?" },
    { en: "If you started over today, what would you not rebuild?", pl: "Gdybyś zaczynała od nowa, czego byś nie odbudowała?" },
    { en: "What decision are you postponing and why?", pl: "Jaką decyzję odkładasz i dlaczego?" },
    { en: "Who are you when nobody needs anything from you?", pl: "Kim jesteś, kiedy nikt niczego od ciebie nie potrzebuje?" },
    { en: "What are you protecting yourself from feeling?", pl: "Przed jakim uczuciem się chronisz?" },
  ],
  "Waxing Crescent": [
    { en: "What did you say you would do that you have not done?", pl: "Co obiecałaś sobie zrobić, a czego nie zrobiłaś?" },
    { en: "Where are you performing instead of being honest?", pl: "Gdzie grasz rolę zamiast być szczerą?" },
    { en: "What keeps showing up that you keep ignoring?", pl: "Co ciągle wraca, a ty to ignorujesz?" },
    { en: "Are you actually committed or just comfortable with the idea?", pl: "Naprawdę jesteś zaangażowana czy tylko podoba ci się ten pomysł?" },
    { en: "What would change if you stopped explaining yourself?", pl: "Co by się zmieniło, gdybyś przestała się tłumaczyć?" },
  ],
  "First Quarter": [
    { en: "Where are you saying yes when you mean no?", pl: "Gdzie mówisz tak, kiedy masz na myśli nie?" },
    { en: "What conflict are you avoiding right now?", pl: "Jakiego konfliktu teraz unikasz?" },
    { en: "What would you do differently if you trusted yourself?", pl: "Co zrobiłabyś inaczej, gdybyś sobie zaufała?" },
    { en: "Who are you trying to convince and why?", pl: "Kogo próbujesz przekonać i po co?" },
    { en: "What feels hard right now and what are you making it mean about you?", pl: "Co jest teraz trudne i co z tego wnosisz o sobie?" },
  ],
  "Waxing Gibbous": [
    { en: "What are you overcomplicating to avoid finishing?", pl: "Co komplikujesz, żeby nie musieć skończyć?" },
    { en: "Where are you waiting for permission you do not need?", pl: "Na czyje pozwolenie czekasz, choć go nie potrzebujesz?" },
    { en: "What would be enough for you today?", pl: "Co dzisiaj byłoby dla ciebie wystarczające?" },
    { en: "Are you adjusting or just second-guessing?", pl: "Poprawiasz czy po prostu wątpisz?" },
    { en: "What are you afraid will happen if this actually works?", pl: "Czego się boisz, jeśli to naprawdę wypali?" },
  ],
  "Full Moon": [
    { en: "What can you see now that you were not ready to see before?", pl: "Co widzisz teraz, na co wcześniej nie byłaś gotowa?" },
    { en: "What are you holding onto that is not yours?", pl: "Co trzymasz, co nie jest twoje?" },
    { en: "What did you learn this month that you did not want to learn?", pl: "Czego nauczyłaś się w tym miesiącu, choć nie chciałaś?" },
    { en: "Where have you been dishonest with yourself?", pl: "Gdzie byłaś wobec siebie nieuczciwa?" },
    { en: "What would you have to feel if you stopped being busy?", pl: "Co musiałabyś poczuć, gdybyś przestała być zajęta?" },
  ],
  "Waning Gibbous": [
    { en: "What worked and are you willing to admit it?", pl: "Co zadziałało i czy jesteś gotowa to przyznać?" },
    { en: "Where did you surprise yourself recently?", pl: "Gdzie ostatnio się zaskoczyłaś?" },
    { en: "What do you keep giving that nobody asked for?", pl: "Co ciągle dajesz, choć nikt nie prosił?" },
    { en: "What would rest actually look like if you allowed it?", pl: "Jak wyglądałby odpoczynek, gdybyś sobie na niego pozwoliła?" },
    { en: "Who do you owe an honest conversation?", pl: "Komu jesteś winna szczerą rozmowę?" },
  ],
  "Last Quarter": [
    { en: "What pattern keeps returning? That is your work.", pl: "Jaki wzorzec ciągle wraca? To jest twoja praca." },
    { en: "What are you still carrying that you already know the answer to?", pl: "Co nadal dźwigasz, choć znasz już odpowiedź?" },
    { en: "What would you stop doing if nobody was watching?", pl: "Co byś przestała robić, gdyby nikt nie patrzył?" },
    { en: "Where are you repeating something hoping for a different result?", pl: "Gdzie powtarzasz coś, licząc na inny wynik?" },
    { en: "What are you afraid to outgrow?", pl: "Z czego boisz się wyrosnąć?" },
  ],
  "Waning Crescent": [
    { en: "What do you need that you keep denying yourself?", pl: "Czego potrzebujesz, a ciągle sobie odmawiasz?" },
    { en: "When was the last time you did nothing without guilt?", pl: "Kiedy ostatnio nic nie robiłaś bez poczucia winy?" },
    { en: "What are you forcing that would work better if you left it alone?", pl: "Co forsujesz, choć lepiej byłoby to zostawić?" },
    { en: "What is your body telling you that your mind keeps overriding?", pl: "Co mówi ci ciało, a umysł to zagłusza?" },
    { en: "What would you hear if you actually got quiet?", pl: "Co byś usłyszała, gdybyś naprawdę się uciszyła?" },
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