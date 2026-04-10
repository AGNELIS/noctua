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

export function getUpcomingMoonEvents(months: number = 3, startFrom?: Date): MoonEvent[] {
  const events: MoonEvent[] = [];
  const now = startFrom || new Date();
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
    { en: "What pattern keeps returning?", pl: "Jaki wzorzec ciągle wraca?" },
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

export type Season = "spring" | "summer" | "autumn" | "winter";

export function getSeason(date: Date = new Date()): Season {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

const SEASONAL_SHADOW_PROMPTS: Record<Season, Record<string, { en: string; pl: string }[]>> = {
  spring: {
    "New Moon": [
      { en: "What new beginning are you resisting because the old version of you is still comfortable?", pl: "Jakiego nowego początku się wzbraniasz, bo stara wersja ciebie jest wygodna?" },
      { en: "What seed are you afraid to plant because you might actually have to tend it?", pl: "Jakie ziarno boisz się zasadzić, bo mogłabyś naprawdę musieć się nim zająć?" },
    ],
    "Waxing Crescent": [
      { en: "What are you nurturing out of obligation instead of desire?", pl: "Co pielęgnujesz z obowiązku zamiast z pragnienia?" },
      { en: "Where are you rushing growth instead of letting it happen?", pl: "Gdzie przyspieszasz wzrost zamiast pozwolić mu się wydarzyć?" },
    ],
    "First Quarter": [
      { en: "What decision are you avoiding that spring is asking you to make?", pl: "Jakiej decyzji unikasz, której wiosna od ciebie wymaga?" },
      { en: "What needs to be pruned so the new thing can grow?", pl: "Co trzeba przyciąć, żeby nowe mogło wyrosnąć?" },
    ],
    "Waxing Gibbous": [
      { en: "What is growing faster than you expected and what does that bring up?", pl: "Co rośnie szybciej niż się spodziewałaś i co to w tobie budzi?" },
      { en: "Are you tending what matters or just what is visible?", pl: "Dbasz o to co ważne czy tylko o to co widoczne?" },
    ],
    "Full Moon": [
      { en: "What has bloomed that you did not plant consciously?", pl: "Co zakwitło, czego świadomie nie sadziłaś?" },
      { en: "What is spring revealing about the winter you just survived?", pl: "Co wiosna ujawnia o zimie, którą właśnie przeżyłaś?" },
    ],
    "Waning Gibbous": [
      { en: "What did this growth season teach you about yourself?", pl: "Czego ten sezon wzrostu nauczył cię o tobie samej?" },
      { en: "Where did you bloom despite the conditions?", pl: "Gdzie zakwitłaś mimo warunków?" },
    ],
    "Last Quarter": [
      { en: "What spring promise do you need to release?", pl: "Jaką wiosenną obietnicę musisz puścić?" },
      { en: "What did not take root and what does that tell you?", pl: "Co się nie przyjęło i co ci to mówi?" },
    ],
    "Waning Crescent": [
      { en: "What needs quiet before the next wave of growth?", pl: "Co potrzebuje ciszy przed następną falą wzrostu?" },
      { en: "Where are you forcing spring when you still need rest?", pl: "Gdzie wymuszasz wiosnę, kiedy nadal potrzebujesz odpoczynku?" },
    ],
  },
  summer: {
    "New Moon": [
      { en: "What are you performing in the light that does not match who you are in the dark?", pl: "Co odgrywasz w świetle, co nie pasuje do tego kim jesteś w ciemności?" },
      { en: "What action are you avoiding by staying busy?", pl: "Jakiego działania unikasz, będąc ciągle zajęta?" },
    ],
    "Waxing Crescent": [
      { en: "What fire did you light that you are now afraid to tend?", pl: "Jaki ogień rozpaliłaś, którego teraz boisz się pilnować?" },
      { en: "Where is your energy going that does not match your intention?", pl: "Gdzie idzie twoja energia, a nie pasuje do twojej intencji?" },
    ],
    "First Quarter": [
      { en: "What confrontation is the heat of this season demanding from you?", pl: "Jakiej konfrontacji żar tego sezonu od ciebie wymaga?" },
      { en: "Where are you burning yourself out to prove something?", pl: "Gdzie się wypalasz, żeby coś udowodnić?" },
    ],
    "Waxing Gibbous": [
      { en: "What is at full power in your life and are you actually enjoying it?", pl: "Co jest teraz na pełnych obrotach i czy naprawdę to lubisz?" },
      { en: "What would happen if you stopped pushing and just let this summer be enough?", pl: "Co by się stało, gdybyś przestała forsować i pozwoliła temu latu wystarczyć?" },
    ],
    "Full Moon": [
      { en: "What is the longest day showing you about where your light actually falls?", pl: "Co najdłuższy dzień pokazuje ci o tym, gdzie naprawdę pada twoje światło?" },
      { en: "What have you been too exposed to feel?", pl: "Na co byłaś zbyt wystawiona, żeby to poczuć?" },
    ],
    "Waning Gibbous": [
      { en: "What harvest are you refusing to collect?", pl: "Jakie plony odmawiasz zebrania?" },
      { en: "Where did your action this season actually lead?", pl: "Dokąd naprawdę zaprowadziło cię twoje działanie w tym sezonie?" },
    ],
    "Last Quarter": [
      { en: "What did summer burn away that needed burning?", pl: "Co lato spaliło, co musiało spłonąć?" },
      { en: "What intensity are you ready to let go of?", pl: "Jakiej intensywności jesteś gotowa się pozbyć?" },
    ],
    "Waning Crescent": [
      { en: "What needs cooling down before autumn arrives?", pl: "Co musi ostygnąć zanim przyjdzie jesień?" },
      { en: "Where did you confuse heat with passion?", pl: "Gdzie pomyliłaś żar z pasją?" },
    ],
  },
  autumn: {
    "New Moon": [
      { en: "What are you harvesting that you did not consciously plant?", pl: "Co zbierasz, czego świadomie nie sadziłaś?" },
      { en: "What is falling away that you are pretending to still need?", pl: "Co odpada, a ty udajesz że nadal tego potrzebujesz?" },
    ],
    "Waxing Crescent": [
      { en: "What are you gathering for winter that is actually fear disguised as preparation?", pl: "Co gromadzisz na zimę, co jest tak naprawdę strachem przebranym za przygotowanie?" },
      { en: "What pattern from this year are you ready to name?", pl: "Jaki wzorzec z tego roku jesteś gotowa nazwać?" },
    ],
    "First Quarter": [
      { en: "What truth did this year teach you that you are still resisting?", pl: "Jakiej prawdy nauczył cię ten rok, a ty wciąż się jej opierasz?" },
      { en: "What needs to die before winter so it does not rot?", pl: "Co musi umrzeć przed zimą, żeby nie zgniło?" },
    ],
    "Waxing Gibbous": [
      { en: "What have you been carrying since spring that is no longer yours?", pl: "Co nosisz od wiosny, co już nie jest twoje?" },
      { en: "Where are you mistaking letting go for giving up?", pl: "Gdzie mylisz puszczanie z poddawaniem się?" },
    ],
    "Full Moon": [
      { en: "What does the harvest moon illuminate about what you actually built this year?", pl: "Co księżyc żniwny oświetla w tym, co naprawdę zbudowałaś w tym roku?" },
      { en: "What reflection do you keep avoiding when things get quiet?", pl: "Jakiej refleksji unikasz, kiedy robi się cicho?" },
    ],
    "Waning Gibbous": [
      { en: "What are you grateful for that also cost you something?", pl: "Za co jesteś wdzięczna, co jednocześnie cię coś kosztowało?" },
      { en: "What did you receive this year that you did not think you deserved?", pl: "Co otrzymałaś w tym roku, na co twoim zdaniem nie zasługiwałaś?" },
    ],
    "Last Quarter": [
      { en: "What leaf are you holding onto that the tree has already released?", pl: "Jaki liść trzymasz, który drzewo już puściło?" },
      { en: "What do you need to grieve before the year ends?", pl: "Co musisz opłakać zanim skończy się rok?" },
    ],
    "Waning Crescent": [
      { en: "What would deep rest look like if you actually allowed it right now?", pl: "Jak wyglądałby głęboki odpoczynek, gdybyś naprawdę sobie na niego teraz pozwoliła?" },
      { en: "What does your body know about this season that your mind keeps overriding?", pl: "Co twoje ciało wie o tym sezonie, a umysł ciągle to zagłusza?" },
    ],
  },
  winter: {
    "New Moon": [
      { en: "What are you afraid to find in the silence?", pl: "Czego boisz się znaleźć w ciszy?" },
      { en: "What would happen if you stopped doing and just existed for a while?", pl: "Co by się stało, gdybyś przestała działać i po prostu przez chwilę istniała?" },
    ],
    "Waxing Crescent": [
      { en: "What is stirring underneath that is not ready to be named yet?", pl: "Co porusza się pod spodem, co nie jest jeszcze gotowe na nazwanie?" },
      { en: "What dream keeps returning in the dark months?", pl: "Jaki sen wraca w ciemnych miesiącach?" },
    ],
    "First Quarter": [
      { en: "What are you doing to avoid the stillness winter is asking of you?", pl: "Co robisz, żeby uniknąć spokoju, którego zima od ciebie wymaga?" },
      { en: "What would you confront if there were no distractions?", pl: "Z czym byś się zmierzyła, gdyby nie było rozpraszaczy?" },
    ],
    "Waxing Gibbous": [
      { en: "What is composting inside you right now?", pl: "Co się w tobie teraz kompostuje?" },
      { en: "What inner work have you been avoiding because it requires being still?", pl: "Jakiej wewnętrznej pracy unikasz, bo wymaga bycia w bezruchu?" },
    ],
    "Full Moon": [
      { en: "What does the cold light of winter reveal about who you really are?", pl: "Co zimne światło zimy ujawnia o tym, kim naprawdę jesteś?" },
      { en: "What have you been hiding that this darkness makes impossible to ignore?", pl: "Co ukrywałaś, a ta ciemność uniemożliwia dalsze ignorowanie?" },
    ],
    "Waning Gibbous": [
      { en: "What wisdom came from this year that you almost missed?", pl: "Jaka mądrość przyszła z tego roku, którą prawie przegapiłaś?" },
      { en: "What are you ready to lay down in the dark?", pl: "Co jesteś gotowa złożyć w ciemności?" },
    ],
    "Last Quarter": [
      { en: "What are you releasing that you once thought defined you?", pl: "Co puszczasz, co kiedyś uważałaś za swoją definicję?" },
      { en: "What old story is ending in you right now?", pl: "Jaka stara historia właśnie w tobie się kończy?" },
    ],
    "Waning Crescent": [
      { en: "What does surrender feel like in your body right now?", pl: "Jak poddanie się czuje się teraz w twoim ciele?" },
      { en: "What is the deepest thing you know but have not said out loud?", pl: "Co jest najgłębszą rzeczą, którą wiesz, ale nie powiedziałaś na głos?" },
    ],
  },
};

export function getSeasonalShadowPrompt(phase: string, lang: "en" | "pl" = "en", date: Date = new Date()): string {
  const season = getSeason(date);
  const prompts = SEASONAL_SHADOW_PROMPTS[season]?.[phase] || SEASONAL_SHADOW_PROMPTS[season]?.["New Moon"] || [];
  if (prompts.length === 0) return getDailyInsight(phase, lang);
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const prompt = prompts[dayOfYear % prompts.length];
  return prompt[lang] || prompt.en;
}

export function getDailyInsight(phase: string, lang: "en" | "pl" = "en"): string {
  const insights = DAILY_INSIGHTS[phase] || DAILY_INSIGHTS["New Moon"];
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const insight = insights[dayOfYear % insights.length];
  return insight[lang] || insight.en;
}