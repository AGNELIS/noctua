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