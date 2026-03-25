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
const DAILY_INSIGHTS: Record<string, string[]> = {
  "New Moon": [
    "What have you been pretending not to know?",
    "If you started over today, what would you not rebuild?",
    "What decision are you postponing and why?",
    "Who are you when nobody needs anything from you?",
    "What are you protecting yourself from feeling?",
  ],
  "Waxing Crescent": [
    "What did you say you would do that you have not done?",
    "Where are you performing instead of being honest?",
    "What keeps showing up that you keep ignoring?",
    "Are you actually committed or just comfortable with the idea?",
    "What would change if you stopped explaining yourself?",
  ],
  "First Quarter": [
    "Where are you saying yes when you mean no?",
    "What conflict are you avoiding right now?",
    "What would you do differently if you trusted yourself?",
    "Who are you trying to convince and why?",
    "What feels hard right now and what are you making it mean about you?",
  ],
  "Waxing Gibbous": [
    "What are you overcomplicating to avoid finishing?",
    "Where are you waiting for permission you do not need?",
    "What would be enough for you today?",
    "Are you adjusting or just second-guessing?",
    "What are you afraid will happen if this actually works?",
  ],
  "Full Moon": [
    "What can you see now that you were not ready to see before?",
    "What are you holding onto that is not yours?",
    "What did you learn this month that you did not want to learn?",
    "Where have you been dishonest with yourself?",
    "What would you have to feel if you stopped being busy?",
  ],
  "Waning Gibbous": [
    "What worked and are you willing to admit it?",
    "Where did you surprise yourself recently?",
    "What do you keep giving that nobody asked for?",
    "What would rest actually look like if you allowed it?",
    "Who do you owe an honest conversation?",
  ],
  "Last Quarter": [
    "What pattern keeps returning? That is your work.",
    "What are you still carrying that you already know the answer to?",
    "What would you stop doing if nobody was watching?",
    "Where are you repeating something hoping for a different result?",
    "What are you afraid to outgrow?",
  ],
  "Waning Crescent": [
    "What do you need that you keep denying yourself?",
    "When was the last time you did nothing without guilt?",
    "What are you forcing that would work better if you left it alone?",
    "What is your body telling you that your mind keeps overriding?",
    "What would you hear if you actually got quiet?",
  ],
};

export function getDailyInsight(phase: string): string {
  const insights = DAILY_INSIGHTS[phase] || DAILY_INSIGHTS["New Moon"];
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return insights[dayOfYear % insights.length];
}