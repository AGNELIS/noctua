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
    Aries: { en: "You react before you think. Emotions hit you like a reflex and you act on them immediately. The hard part for you is staying with a feeling instead of doing something about it.", pl: "Reagujesz zanim pomyślisz. Emocje uderzają jak odruch i od razu na nie działasz. Trudne dla ciebie jest zostanie z uczuciem zamiast robienia czegoś z nim." },
    Taurus: { en: "You need stability to function emotionally. When your environment is chaotic, you shut down. You hold onto things, people, situations longer than you should because change feels threatening.", pl: "Potrzebujesz stabilności żeby funkcjonować emocjonalnie. Kiedy otoczenie jest chaotyczne, zamykasz się. Trzymasz się rzeczy, ludzi, sytuacji dłużej niż powinnaś bo zmiana wydaje się zagrożeniem." },
    Gemini: { en: "You think your feelings instead of feeling them. You can explain exactly what is wrong but that does not mean you have actually processed it. Silence makes you anxious.", pl: "Myślisz swoje uczucia zamiast je czuć. Potrafisz dokładnie wyjaśnić co jest nie tak ale to nie znaczy że to przepracowałaś. Cisza wywołuje w tobie niepokój." },
    Cancer: { en: "You absorb the emotional state of everyone around you. You know what others need before they say it. The problem is you often cannot tell which emotions are yours and which you picked up from someone else.", pl: "Absorbujesz stan emocjonalny każdego wokół siebie. Wiesz czego inni potrzebują zanim to powiedzą. Problem w tym że często nie potrafisz odróżnić które emocje są twoje a które wzięłaś od kogoś." },
    Leo: { en: "You need acknowledgement. Not applause, just someone noticing. When you feel unseen your emotions turn inward and become resentment or withdrawal. You give a lot but you need something back.", pl: "Potrzebujesz uznania. Nie oklasków, po prostu żeby ktoś zauważył. Kiedy czujesz się niezauważona, emocje kierujesz do wewnątrz i zamieniają się w żal albo wycofanie. Dużo dajesz ale potrzebujesz czegoś w zamian." },
    Virgo: { en: "You manage emotions by analysing them. You break feelings into pieces, categorise them, try to solve them. The part you avoid is sitting with something that has no solution.", pl: "Zarządzasz emocjami analizując je. Rozbijasz uczucia na części, kategoryzujesz, próbujesz rozwiązać. To czego unikasz to siedzenie z czymś co nie ma rozwiązania." },
    Libra: { en: "You adjust yourself to keep the peace. You feel what others feel and mirror it back. The cost is you often do not know what YOU actually feel when you are alone.", pl: "Dostosujesz się żeby utrzymać spokój. Czujesz co inni czują i odbijasz to z powrotem. Koszt jest taki że często nie wiesz co TY właściwie czujesz kiedy jesteś sama." },
    Scorpio: { en: "You feel intensely and you know it. You pick up on things other people miss entirely. What is hard for you is not the depth of your emotions. It is allowing yourself to be seen in them.", pl: "Czujesz intensywnie i wiesz o tym. Wyłapujesz rzeczy których inni w ogóle nie zauważają. To co jest dla ciebie trudne to nie głębokość emocji. To pozwolenie żeby ktoś cię w nich zobaczył." },
    Sagittarius: { en: "When emotions get heavy you move. New city, new project, new perspective. Anything to avoid sitting still with what you feel. Your pattern is replacing processing with motion.", pl: "Kiedy emocje robią się ciężkie, ruszasz się. Nowe miasto, nowy projekt, nowa perspektywa. Cokolwiek żeby uniknąć siedzenia w miejscu z tym co czujesz. Twój wzorzec to zastępowanie przetwarzania ruchem." },
    Capricorn: { en: "You treat emotions as something to manage, not feel. You function under pressure better than most people but that is because you learned early that falling apart was not an option.", pl: "Traktujesz emocje jako coś do zarządzania, nie do czucia. Funkcjonujesz pod presją lepiej niż większość ludzi ale to dlatego że wcześnie nauczyłaś się że rozpadanie się nie wchodzi w grę." },
    Aquarius: { en: "You understand emotions conceptually but experiencing them is different. You can describe exactly what you feel and why but there is a gap between the description and the actual feeling.", pl: "Rozumiesz emocje konceptualnie ale doświadczanie ich to co innego. Potrafisz dokładnie opisać co czujesz i dlaczego ale jest luka między opisem a faktycznym czuciem." },
    Pisces: { en: "You feel everything around you. Other people's moods, the atmosphere in a room, tension that nobody mentioned. The real question for you is not what you feel but which of those feelings actually belong to you.", pl: "Czujesz wszystko wokół siebie. Nastroje innych ludzi, atmosferę w pokoju, napięcie o którym nikt nie wspomniał. Prawdziwe pytanie dla ciebie to nie co czujesz ale które z tych uczuć faktycznie należą do ciebie." },
  },
  saturn: {
    Aries: { en: "You struggle with acting on your own authority. Either you push through everything by force or you freeze when nobody tells you what to do.", pl: "Masz problem z działaniem z własnego autorytetu. Albo przebijasz się przez wszystko siłą albo zamierasz kiedy nikt ci nie mówi co robić." },
    Taurus: { en: "Your pattern is around money, security and self worth. You either hold too tight to what you have or convince yourself you do not need anything.", pl: "Twój wzorzec dotyczy pieniędzy, bezpieczeństwa i poczucia własnej wartości. Albo trzymasz się za mocno tego co masz albo przekonujesz siebie że niczego nie potrzebujesz." },
    Gemini: { en: "You overthink what you want to say. Either you talk around the point or go silent when it matters. Saying the simple true thing without editing it is what you are learning.", pl: "Za dużo myślisz o tym co chcesz powiedzieć. Albo mówisz dookoła albo milkniesz kiedy to ważne. Mówienie prostej prawdy bez redagowania to czego się uczysz." },
    Cancer: { en: "Emotional closeness is complicated for you. You either build walls to protect yourself or lose your boundaries completely. Neither extreme works.", pl: "Emocjonalna bliskość jest dla ciebie skomplikowana. Albo budujesz mury żeby się chronić albo tracisz granice całkowicie. Żadna skrajność nie działa." },
    Leo: { en: "Being visible is hard for you. You either hide from attention or overcompensate by performing. What you are learning is how to show up as yourself without a script.", pl: "Bycie widoczną jest dla ciebie trudne. Albo chowasz się przed uwagą albo nadkompensujesz odgrywając rolę. Uczysz się jak pojawiać się jako ty bez scenariusza." },
    Virgo: { en: "You hold yourself to standards nobody asked for. Either everything has to be perfect or you do not start at all. What you are working on is accepting that done is better than flawless.", pl: "Stawiasz sobie wymagania o które nikt nie prosił. Albo wszystko musi być idealne albo w ogóle nie zaczynasz. Pracujesz nad zaakceptowaniem że zrobione jest lepsze niż bezbłędne." },
    Libra: { en: "Relationships are where your hardest lessons show up. You either disappear into another person or avoid closeness altogether. Finding yourself inside a relationship is the work.", pl: "Relacje to miejsce gdzie pojawiają się twoje najtrudniejsze lekcje. Albo znikasz w drugiej osobie albo unikasz bliskości w ogóle. Znajdowanie siebie wewnątrz relacji to praca." },
    Scorpio: { en: "Control is your default. You either grip everything tightly or test people to see if they will stay. What you are learning is that trust is not something you verify. It is something you practice.", pl: "Kontrola to twoje domyślne ustawienie. Albo trzymasz wszystko mocno albo testujesz ludzi czy zostaną. Uczysz się że zaufanie to nie coś co weryfikujesz. To coś co ćwiczysz." },
    Sagittarius: { en: "You confuse movement with freedom. You leave situations before they get heavy, change plans when things get real. What you are learning is that staying can be more freeing than going.", pl: "Mylisz ruch z wolnością. Wychodzisz z sytuacji zanim zrobią się ciężkie, zmieniasz plany kiedy robi się poważnie. Uczysz się że zostanie może być bardziej wyzwalające niż wyjście." },
    Capricorn: { en: "You measure yourself by what you achieve. When you are not producing you feel worthless. What you are learning is that you are not your output.", pl: "Mierzysz siebie tym co osiągasz. Kiedy nie produkujesz czujesz się bezwartościowa. Uczysz się że nie jesteś swoim wynikiem." },
    Aquarius: { en: "You want to belong but on your own terms. Either you go along with the group and resent it or you stand apart and feel isolated. What you are learning is how to be different without being alone.", pl: "Chcesz przynależeć ale na swoich warunkach. Albo idziesz z grupą i masz o to żal albo stoisz z boku i czujesz się odizolowana. Uczysz się jak być inna nie będąc samotna." },
    Pisces: { en: "You take on other people's problems as your own. Either you absorb everything or you shut everyone out to protect yourself. What you are learning is how to stay open without taking responsibility for things that are not yours.", pl: "Bierzesz problemy innych ludzi jako swoje. Albo absorbujesz wszystko albo zamykasz wszystkich żeby się chronić. Uczysz się jak być otwartą bez brania odpowiedzialności za rzeczy które nie są twoje." },
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
  const rawTime = birthTime || "12:00";
  const timeParts = rawTime.split(":");
  const cleanTime = timeParts[0] + ":" + timeParts[1];
  const date = new Date(birthDate + "T" + cleanTime + ":00Z");

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