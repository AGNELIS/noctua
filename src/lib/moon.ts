// Accurate moon phase calculator using astronomy-engine
import * as Astronomy from "astronomy-engine";

export type MoonPhaseInfo = {
  phase: string;
  emoji: string;
  illumination: number;
  daysIntoCycle: number;
  description: string;
};

export type MoonEvent = {
  date: Date;
  type: "new_moon" | "first_quarter" | "full_moon" | "last_quarter" | "lunar_eclipse";
  label: string;
  labelPl: string;
};

export function getMoonPhase(date: Date = new Date()): MoonPhaseInfo {
  const astroDate = Astronomy.MakeTime(date);
  const phaseAngle = Astronomy.MoonPhase(astroDate);
  const illum = Astronomy.Illumination(Astronomy.Body.Moon, astroDate);
  const illumination = Math.round(illum.phase_fraction * 100);

  const LUNAR_CYCLE = 29.53;
  const daysIntoCycle = Math.round((phaseAngle / 360) * LUNAR_CYCLE * 10) / 10;

  if (phaseAngle < 22.5) {
    return { phase: "New Moon", emoji: "🌑", illumination, daysIntoCycle, description: "A time for new beginnings. Set intentions in the dark." };
  } else if (phaseAngle < 90) {
    return { phase: "Waxing Crescent", emoji: "🌒", illumination, daysIntoCycle, description: "Your intentions take root. Nurture what you've planted." };
  } else if (phaseAngle < 112.5) {
    return { phase: "First Quarter", emoji: "🌓", illumination, daysIntoCycle, description: "A crossroads. Make decisions and take action." };
  } else if (phaseAngle < 180) {
    return { phase: "Waxing Gibbous", emoji: "🌔", illumination, daysIntoCycle, description: "Refine and adjust. Trust the process unfolding." };
  } else if (phaseAngle < 202.5) {
    return { phase: "Full Moon", emoji: "🌕", illumination, daysIntoCycle, description: "Illumination and release. See what the light reveals." };
  } else if (phaseAngle < 270) {
    return { phase: "Waning Gibbous", emoji: "🌖", illumination, daysIntoCycle, description: "Gratitude and sharing. Give back what you've received." };
  } else if (phaseAngle < 292.5) {
    return { phase: "Last Quarter", emoji: "🌗", illumination, daysIntoCycle, description: "Release and forgive. Let go of what no longer serves you." };
  } else {
    return { phase: "Waning Crescent", emoji: "🌘", illumination, daysIntoCycle, description: "Rest and surrender. The dark holds wisdom." };
  }
}

export type MoonSignInfo = {
  sign: string;
  signPl: string;
  element: string;
  elementPl: string;
};

export function getMoonSign(date: Date = new Date()): MoonSignInfo {
  const astroDate = Astronomy.MakeTime(date);
  const equator = Astronomy.Equator(Astronomy.Body.Moon, astroDate, new Astronomy.Observer(51.5, 0, 0), true, true);
  const ecliptic = Astronomy.Ecliptic(equator.vec);
  let lon = ecliptic.elon;
  if (lon < 0) lon += 360;

  const signs: { sign: string; signPl: string; element: string; elementPl: string }[] = [
    { sign: "Aries", signPl: "Baran", element: "Fire", elementPl: "Ogień" },
    { sign: "Taurus", signPl: "Byk", element: "Earth", elementPl: "Ziemia" },
    { sign: "Gemini", signPl: "Bliźnięta", element: "Air", elementPl: "Powietrze" },
    { sign: "Cancer", signPl: "Rak", element: "Water", elementPl: "Woda" },
    { sign: "Leo", signPl: "Lew", element: "Fire", elementPl: "Ogień" },
    { sign: "Virgo", signPl: "Panna", element: "Earth", elementPl: "Ziemia" },
    { sign: "Libra", signPl: "Waga", element: "Air", elementPl: "Powietrze" },
    { sign: "Scorpio", signPl: "Skorpion", element: "Water", elementPl: "Woda" },
    { sign: "Sagittarius", signPl: "Strzelec", element: "Fire", elementPl: "Ogień" },
    { sign: "Capricorn", signPl: "Koziorożec", element: "Earth", elementPl: "Ziemia" },
    { sign: "Aquarius", signPl: "Wodnik", element: "Air", elementPl: "Powietrze" },
    { sign: "Pisces", signPl: "Ryby", element: "Water", elementPl: "Woda" },
  ];

  const index = Math.floor(lon / 30) % 12;
  return signs[index];
}

export function getUpcomingMoonEvents(months: number = 3): MoonEvent[] {
  const events: MoonEvent[] = [];
  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + months);

  let searchDate = Astronomy.MakeTime(now);
  const endTime = Astronomy.MakeTime(end);

  const phases = [
    { target: 0, type: "new_moon" as const, label: "New Moon", labelPl: "Nów" },
    { target: 90, type: "first_quarter" as const, label: "First Quarter", labelPl: "Pierwsza kwadra" },
    { target: 180, type: "full_moon" as const, label: "Full Moon", labelPl: "Pełnia" },
    { target: 270, type: "last_quarter" as const, label: "Last Quarter", labelPl: "Ostatnia kwadra" },
  ];

  for (const p of phases) {
    let s = Astronomy.MakeTime(now);
    for (let i = 0; i < months * 2; i++) {
      const result = Astronomy.SearchMoonPhase(p.target, s, 40);
      if (result && result.date.getTime() < end.getTime()) {
        events.push({ date: result.date, type: p.type, label: p.label, labelPl: p.labelPl });
        s = Astronomy.MakeTime(new Date(result.date.getTime() + 24 * 60 * 60 * 1000));
      } else {
        break;
      }
    }
  }

  let eclipseSearch = Astronomy.SearchLunarEclipse(Astronomy.MakeTime(now));
  while (eclipseSearch.peak.date.getTime() < end.getTime()) {
    if (eclipseSearch.kind !== "penumbral") {
      events.push({
        date: eclipseSearch.peak.date,
        type: "lunar_eclipse",
        label: `Lunar Eclipse (${eclipseSearch.kind})`,
        labelPl: `Zaćmienie Księżyca (${eclipseSearch.kind === "total" ? "całkowite" : "częściowe"})`,
      });
    }
    eclipseSearch = Astronomy.NextLunarEclipse(eclipseSearch.peak);
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
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