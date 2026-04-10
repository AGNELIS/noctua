import * as Astronomy from "astronomy-engine";

export type PlanetPosition = {
  planet: string;
  sign: string;
  signPl: string;
  degree: number;
  description: string;
  descriptionPl: string;
};

export type NatalChart = {
  moon: PlanetPosition;
  saturn: PlanetPosition;
  pluto: PlanetPosition;
  chiron: PlanetPosition;
  lilith: PlanetPosition;
  northNode: PlanetPosition;
  southNode: PlanetPosition;
};

const SIGNS = [
  { sign: "Aries", pl: "Baran" },
  { sign: "Taurus", pl: "Byk" },
  { sign: "Gemini", pl: "Bliźnięta" },
  { sign: "Cancer", pl: "Rak" },
  { sign: "Leo", pl: "Lew" },
  { sign: "Virgo", pl: "Panna" },
  { sign: "Libra", pl: "Waga" },
  { sign: "Scorpio", pl: "Skorpion" },
  { sign: "Sagittarius", pl: "Strzelec" },
  { sign: "Capricorn", pl: "Koziorożec" },
  { sign: "Aquarius", pl: "Wodnik" },
  { sign: "Pisces", pl: "Ryby" },
];

const PLANET_DESCRIPTIONS: Record<string, Record<string, { en: string; pl: string }>> = {
  moon: {
    Aries: { en: "Your emotional instinct is fire. You react fast, burn bright, move on. Vulnerability feels like weakness to you.", pl: "Twój instynkt emocjonalny to ogień. Reagujesz szybko, płoniesz jasno, idziesz dalej. Wrażliwość czujesz jako słabość." },
    Taurus: { en: "You need safety to feel. Stability is not boring to you, it is oxygen. When the ground shakes, everything shakes.", pl: "Potrzebujesz bezpieczeństwa żeby czuć. Stabilność to nie nuda, to tlen. Kiedy grunt się trzęsie, wszystko się trzęsie." },
    Gemini: { en: "You process emotions through words. If you cannot name it, you cannot feel it. Silence is not peace for you, it is confusion.", pl: "Przetwarzasz emocje przez słowa. Jeśli nie możesz tego nazwać, nie możesz tego poczuć. Cisza to nie spokój, to zagubienie." },
    Cancer: { en: "You feel everything. The room, the person, the unsaid thing. Your challenge is not feeling more. It is letting go of what is not yours.", pl: "Czujesz wszystko. Pokój, osobę, niewypowiedziane. Twoim wyzwaniem nie jest czucie więcej. To puszczenie tego co nie jest twoje." },
    Leo: { en: "You need to be seen to feel safe. Not admired. Seen. When you are invisible, your emotions go underground.", pl: "Musisz być widziana żeby czuć się bezpiecznie. Nie podziwiana. Widziana. Kiedy jesteś niewidzialna, twoje emocje schodzą pod ziemię." },
    Virgo: { en: "You analyse what you feel before you let yourself feel it. Control is your emotional armour. Letting it be messy is your work.", pl: "Analizujesz co czujesz zanim pozwolisz sobie to poczuć. Kontrola to twoja emocjonalna zbroja. Pozwolenie na bałagan to twoja praca." },
    Libra: { en: "You feel through others. Their pain is yours, their joy is yours. Finding your own emotional centre, separate from everyone, is the work.", pl: "Czujesz przez innych. Ich ból jest twój, ich radość jest twoja. Znalezienie własnego centrum emocjonalnego, osobnego od wszystkich, to praca." },
    Scorpio: { en: "You feel at a depth most people never reach. You know things before they happen. Your challenge is not intensity. It is trusting that you can survive softness.", pl: "Czujesz na głębokości do której większość ludzi nie dociera. Wiesz rzeczy zanim się wydarzą. Twoim wyzwaniem nie jest intensywność. To zaufanie że przeżyjesz miękkość." },
    Sagittarius: { en: "You process emotions by moving. Physically, mentally, geographically. Sitting with a feeling without escaping it is your deepest work.", pl: "Przetwarzasz emocje przez ruch. Fizycznie, mentalnie, geograficznie. Siedzenie z uczuciem bez ucieczki to twoja najgłębsza praca." },
    Capricorn: { en: "You were taught that emotions are inefficient. You function, you perform, you carry. Allowing yourself to need something is revolutionary for you.", pl: "Nauczono cię że emocje są nieefektywne. Funkcjonujesz, wykonujesz, dźwigasz. Pozwolenie sobie na potrzebowanie czegoś jest dla ciebie rewolucyjne." },
    Aquarius: { en: "You observe your emotions from a distance. You understand them intellectually before you feel them. The gap between knowing and feeling is where your work lives.", pl: "Obserwujesz swoje emocje z dystansu. Rozumiesz je intelektualnie zanim je poczujesz. Przestrzeń między wiedzą a czuciem to miejsce twojej pracy." },
    Pisces: { en: "You absorb everything. Every mood in the room, every unspoken tension. Your work is not to feel less. It is to know which feelings are yours.", pl: "Absorbujesz wszystko. Każdy nastrój w pokoju, każde niewypowiedziane napięcie. Twoja praca to nie czucie mniej. To wiedzieć które uczucia są twoje." },
  },
  saturn: {
    Aries: { en: "Your karma is around independence. You either push too hard or freeze when you need to act alone.", pl: "Twoja karma dotyczy niezależności. Albo pchasz za mocno albo zamierasz kiedy musisz działać sama." },
    Taurus: { en: "Your karma is around security and worth. You either hoard or deny yourself. Finding real value, not material, is the lesson.", pl: "Twoja karma dotyczy bezpieczeństwa i wartości. Albo gromadzisz albo sobie odmawiasz. Znalezienie prawdziwej wartości, nie materialnej, to lekcja." },
    Gemini: { en: "Your karma is around communication. You either talk too much or swallow words. Learning to say the true thing simply is the work.", pl: "Twoja karma dotyczy komunikacji. Albo mówisz za dużo albo połykasz słowa. Nauka mówienia prawdziwych rzeczy prosto to praca." },
    Cancer: { en: "Your karma is around emotional safety. You build walls or dissolve into others. Learning to be soft AND boundaried is the lesson.", pl: "Twoja karma dotyczy bezpieczeństwa emocjonalnego. Budujesz mury albo rozpuszczasz się w innych. Nauka bycia miękką I z granicami to lekcja." },
    Leo: { en: "Your karma is around visibility and authority. You either hide or perform. Learning to lead from truth, not fear, is the work.", pl: "Twoja karma dotyczy widoczności i autorytetu. Albo się chowasz albo odgrywasz rolę. Nauka przewodzenia z prawdy, nie ze strachu, to praca." },
    Virgo: { en: "Your karma is around perfection and service. You either overwork or shut down. Learning that good enough IS enough is revolutionary.", pl: "Twoja karma dotyczy perfekcji i służby. Albo się przepracowujesz albo się zamykasz. Nauka że wystarczająco dobre JEST wystarczające to rewolucja." },
    Libra: { en: "Your karma is around relationships and fairness. You either lose yourself in others or isolate. Finding balance without losing yourself is the lesson.", pl: "Twoja karma dotyczy relacji i sprawiedliwości. Albo tracisz siebie w innych albo się izolujesz. Znalezienie równowagi bez tracenia siebie to lekcja." },
    Scorpio: { en: "Your karma is around power and trust. You either control everything or surrender completely. Learning to hold power gently is the work.", pl: "Twoja karma dotyczy mocy i zaufania. Albo kontrolujesz wszystko albo poddajesz się całkowicie. Nauka trzymania mocy łagodnie to praca." },
    Sagittarius: { en: "Your karma is around truth and freedom. You either preach or flee. Learning that freedom comes from commitment, not escape, is the lesson.", pl: "Twoja karma dotyczy prawdy i wolności. Albo prawisz kazania albo uciekasz. Nauka że wolność pochodzi z zaangażowania, nie z ucieczki, to lekcja." },
    Capricorn: { en: "Your karma is around structure and achievement. You either climb relentlessly or collapse under pressure. Learning to build something that matters to YOU is the work.", pl: "Twoja karma dotyczy struktury i osiągnięć. Albo wspinasz się nieustannie albo padasz pod presją. Nauka budowania czegoś co ma znaczenie DLA CIEBIE to praca." },
    Aquarius: { en: "Your karma is around belonging and individuality. You either conform or rebel. Learning to be yourself WITHIN community is the lesson.", pl: "Twoja karma dotyczy przynależności i indywidualności. Albo się dostosujesz albo buntujesz. Nauka bycia sobą WEWNĄTRZ wspólnoty to lekcja." },
    Pisces: { en: "Your karma is around boundaries and surrender. You either absorb everything or build walls of denial. Learning to be open without drowning is the work.", pl: "Twoja karma dotyczy granic i poddania. Albo absorbujesz wszystko albo budujesz mury zaprzeczenia. Nauka bycia otwartą bez tonięcia to praca." },
  },
};

function getEclipticLongitude(body: Astronomy.Body, date: Astronomy.FlexibleDateTime): number {
  const astroDate = Astronomy.MakeTime(date);
  const equator = Astronomy.Equator(body, astroDate, new Astronomy.Observer(0, 0, 0), true, true);
  const ecliptic = Astronomy.Ecliptic(equator.vec);
  let lon = ecliptic.elon;
  if (lon < 0) lon += 360;
  return lon;
}

function lonToSign(lon: number): { sign: string; signPl: string; degree: number } {
  const index = Math.floor(lon / 30) % 12;
  const degree = Math.round((lon % 30) * 10) / 10;
  return { sign: SIGNS[index].sign, signPl: SIGNS[index].pl, degree };
}

// Chiron lookup table (approximate, changes sign every 2-8 years)
const CHIRON_SIGNS: { start: string; end: string; sign: string }[] = [
  { start: "1960-01-01", end: "1968-04-01", sign: "Pisces" },
  { start: "1968-04-01", end: "1977-05-01", sign: "Aries" },
  { start: "1977-05-01", end: "1984-06-01", sign: "Taurus" },
  { start: "1984-06-01", end: "1988-07-01", sign: "Gemini" },
  { start: "1988-07-01", end: "1991-07-01", sign: "Cancer" },
  { start: "1991-07-01", end: "1993-09-01", sign: "Leo" },
  { start: "1993-09-01", end: "1995-09-01", sign: "Virgo" },
  { start: "1995-09-01", end: "1997-10-01", sign: "Libra" },
  { start: "1997-10-01", end: "1999-12-01", sign: "Scorpio" },
  { start: "1999-12-01", end: "2001-12-01", sign: "Sagittarius" },
  { start: "2001-12-01", end: "2005-02-01", sign: "Capricorn" },
  { start: "2005-02-01", end: "2010-04-01", sign: "Aquarius" },
  { start: "2010-04-01", end: "2018-04-01", sign: "Pisces" },
  { start: "2018-04-01", end: "2027-06-01", sign: "Aries" },
  { start: "2027-06-01", end: "2034-01-01", sign: "Taurus" },
];

// Black Moon Lilith lookup (approximate, ~9 month per sign)
const LILITH_CYCLE_DAYS = 3232; // ~8.85 years full cycle
function getLilithSign(date: Date): string {
  const ref = new Date("2000-01-01");
  const days = (date.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24);
  const cyclePos = ((days % LILITH_CYCLE_DAYS) + LILITH_CYCLE_DAYS) % LILITH_CYCLE_DAYS;
  const signIndex = Math.floor((cyclePos / LILITH_CYCLE_DAYS) * 12) % 12;
  return SIGNS[signIndex].sign;
}

// North Node lookup (approximate, ~18.6 year cycle, retrograde)
const NODE_SIGNS: { start: string; end: string; sign: string }[] = [
  { start: "1962-08-01", end: "1964-02-01", sign: "Leo" },
  { start: "1964-02-01", end: "1965-08-01", sign: "Cancer" },
  { start: "1965-08-01", end: "1967-02-01", sign: "Gemini" },
  { start: "1967-02-01", end: "1968-08-01", sign: "Taurus" },
  { start: "1968-08-01", end: "1970-04-01", sign: "Aries" },
  { start: "1970-04-01", end: "1971-11-01", sign: "Pisces" },
  { start: "1971-11-01", end: "1973-07-01", sign: "Aquarius" },
  { start: "1973-07-01", end: "1975-01-01", sign: "Capricorn" },
  { start: "1975-01-01", end: "1976-07-01", sign: "Sagittarius" },
  { start: "1976-07-01", end: "1978-01-01", sign: "Scorpio" },
  { start: "1978-01-01", end: "1979-07-01", sign: "Libra" },
  { start: "1979-07-01", end: "1981-01-01", sign: "Virgo" },
  { start: "1981-01-01", end: "1982-09-01", sign: "Leo" },
  { start: "1982-09-01", end: "1984-03-01", sign: "Cancer" },
  { start: "1984-03-01", end: "1985-09-01", sign: "Gemini" },
  { start: "1985-09-01", end: "1987-04-01", sign: "Taurus" },
  { start: "1987-04-01", end: "1988-12-01", sign: "Aries" },
  { start: "1988-12-01", end: "1990-08-01", sign: "Pisces" },
  { start: "1990-08-01", end: "1992-02-01", sign: "Aquarius" },
  { start: "1992-02-01", end: "1993-08-01", sign: "Capricorn" },
  { start: "1993-08-01", end: "1995-02-01", sign: "Sagittarius" },
  { start: "1995-02-01", end: "1996-08-01", sign: "Scorpio" },
  { start: "1996-08-01", end: "1998-01-01", sign: "Libra" },
  { start: "1998-01-01", end: "1999-10-01", sign: "Virgo" },
  { start: "1999-10-01", end: "2001-04-01", sign: "Leo" },
  { start: "2001-04-01", end: "2002-10-01", sign: "Cancer" },
  { start: "2002-10-01", end: "2004-04-01", sign: "Gemini" },
  { start: "2004-04-01", end: "2005-12-01", sign: "Taurus" },
  { start: "2005-12-01", end: "2007-06-01", sign: "Aries" },
  { start: "2007-06-01", end: "2009-01-01", sign: "Pisces" },
  { start: "2009-01-01", end: "2009-08-01", sign: "Aquarius" },
  { start: "2009-08-01", end: "2011-03-01", sign: "Capricorn" },
  { start: "2011-03-01", end: "2012-09-01", sign: "Sagittarius" },
  { start: "2012-09-01", end: "2014-02-01", sign: "Scorpio" },
  { start: "2014-02-01", end: "2015-11-01", sign: "Libra" },
  { start: "2015-11-01", end: "2017-05-01", sign: "Virgo" },
  { start: "2017-05-01", end: "2018-11-01", sign: "Leo" },
  { start: "2018-11-01", end: "2020-05-01", sign: "Cancer" },
  { start: "2020-05-01", end: "2022-01-01", sign: "Gemini" },
  { start: "2022-01-01", end: "2023-07-01", sign: "Taurus" },
  { start: "2023-07-01", end: "2025-01-01", sign: "Aries" },
  { start: "2025-01-01", end: "2026-07-01", sign: "Pisces" },
  { start: "2026-07-01", end: "2028-01-01", sign: "Aquarius" },
];

function lookupSign(date: Date, table: { start: string; end: string; sign: string }[]): string {
  const d = date.toISOString().split("T")[0];
  for (const entry of table) {
    if (d >= entry.start && d < entry.end) return entry.sign;
  }
  return "Aries"; // fallback
}

function getOppositeSign(sign: string): string {
  const idx = SIGNS.findIndex(s => s.sign === sign);
  return SIGNS[(idx + 6) % 12].sign;
}

function getDescription(planet: string, sign: string): { en: string; pl: string } {
  const desc = PLANET_DESCRIPTIONS[planet]?.[sign];
  if (desc) return desc;
  return {
    en: `Your ${planet} is in ${sign}. This placement shapes how you experience ${planet === "saturn" ? "structure and responsibility" : planet === "chiron" ? "wounding and healing" : planet === "lilith" ? "rejected power" : "transformation"}.`,
    pl: `Twój ${planet} jest w znaku ${sign}. To umiejscowienie kształtuje jak doświadczasz ${planet === "saturn" ? "struktury i odpowiedzialności" : planet === "chiron" ? "ran i uzdrawiania" : planet === "lilith" ? "odrzuconej mocy" : "transformacji"}.`,
  };
}

export function calculateNatalChart(birthDate: string, birthTime: string | null, birthCity: string | null): NatalChart {
  const time = birthTime || "12:00";
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date(birthDate + "T" + time + ":00Z");

  // Moon (astronomy-engine)
  const moonLon = getEclipticLongitude(Astronomy.Body.Moon, date);
  const moonSign = lonToSign(moonLon);
  const moonDesc = getDescription("moon", moonSign.sign);

  // Saturn (astronomy-engine)
  const saturnLon = getEclipticLongitude(Astronomy.Body.Saturn, date);
  const saturnSign = lonToSign(saturnLon);
  const saturnDesc = getDescription("saturn", saturnSign.sign);

  // Pluto (astronomy-engine)
  const plutoLon = getEclipticLongitude(Astronomy.Body.Pluto, date);
  const plutoSign = lonToSign(plutoLon);
  const plutoDesc = getDescription("pluto", plutoSign.sign);

  // Chiron (lookup table)
  const chironSignName = lookupSign(date, CHIRON_SIGNS);
  const chironSignData = SIGNS.find(s => s.sign === chironSignName) || SIGNS[0];
  const chironDesc = getDescription("chiron", chironSignName);

  // Lilith (calculated approximation)
  const lilithSignName = getLilithSign(date);
  const lilithSignData = SIGNS.find(s => s.sign === lilithSignName) || SIGNS[0];
  const lilithDesc = getDescription("lilith", lilithSignName);

  // North Node (lookup table)
  const northNodeSignName = lookupSign(date, NODE_SIGNS);
  const northNodeSignData = SIGNS.find(s => s.sign === northNodeSignName) || SIGNS[0];
  const southNodeSignName = getOppositeSign(northNodeSignName);
  const southNodeSignData = SIGNS.find(s => s.sign === southNodeSignName) || SIGNS[0];

  return {
    moon: { planet: "Moon", sign: moonSign.sign, signPl: moonSign.signPl, degree: moonSign.degree, description: moonDesc.en, descriptionPl: moonDesc.pl },
    saturn: { planet: "Saturn", sign: saturnSign.sign, signPl: saturnSign.signPl, degree: saturnSign.degree, description: saturnDesc.en, descriptionPl: saturnDesc.pl },
    pluto: { planet: "Pluto", sign: plutoSign.sign, signPl: plutoSign.signPl, degree: plutoSign.degree, description: plutoDesc.en, descriptionPl: plutoDesc.pl },
    chiron: { planet: "Chiron", sign: chironSignName, signPl: chironSignData.pl, degree: 0, description: chironDesc.en, descriptionPl: chironDesc.pl },
    lilith: { planet: "Lilith", sign: lilithSignName, signPl: lilithSignData.pl, degree: 0, description: lilithDesc.en, descriptionPl: lilithDesc.pl },
    northNode: { planet: "North Node", sign: northNodeSignName, signPl: northNodeSignData.pl, degree: 0, description: `Your direction of growth points toward ${northNodeSignName} qualities.`, descriptionPl: `Twój kierunek rozwoju wskazuje na cechy ${northNodeSignData.pl}.` },
    southNode: { planet: "South Node", sign: southNodeSignName, signPl: southNodeSignData.pl, degree: 0, description: `Your comfort zone and past patterns live in ${southNodeSignName}.`, descriptionPl: `Twoja strefa komfortu i stare wzorce żyją w ${southNodeSignData.pl}.` },
  };
}

export function getUserPhase(totalEntries: number): "discovery" | "deepening" | "integration" {
  if (totalEntries <= 15) return "discovery";
  if (totalEntries <= 40) return "deepening";
  return "integration";
}