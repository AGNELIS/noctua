import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const CYCLE_1_THRESHOLDS = [
  {
    threshold: 3,
    reward_type: "dream_analysis",
    title_en: "Reward unlocked: free dream analysis",
    title_pl: "Nagroda odblokowana: darmowa analiza snu",
    body_en: "3 friends joined. You earned a free AI dream analysis.",
    body_pl: "3 osoby dołączyły. Otrzymujesz darmową analizę snu AI.",
    link: "/referral",
  },
  {
    threshold: 10,
    reward_type: "monthly_report",
    title_en: "Reward unlocked: free monthly reading",
    title_pl: "Nagroda odblokowana: darmowy odczyt miesięczny",
    body_en: "10 friends joined. Your free monthly reading is ready.",
    body_pl: "10 osób dołączyło. Twój darmowy odczyt miesięczny czeka.",
    link: "/referral",
  },
  {
    threshold: 20,
    reward_type: "badge",
    title_en: "Ambassador status unlocked",
    title_pl: "Status Ambasadorki odblokowany",
    body_en: "20 friends joined. You are now an Ambassador with 30% off Premium.",
    body_pl: "20 osób dołączyło. Jesteś Ambasadorką z 30% zniżki na Premium.",
    link: "/referral",
  },
];

const CYCLE_2_THRESHOLDS = [
  {
    threshold: 5,
    reward_type: "personal_letter",
    title_en: "Reward unlocked: personal letter from AGNÉLIS",
    title_pl: "Nagroda odblokowana: osobisty list od AGNÉLIS",
    body_en: "A letter written for you based on your entire journey.",
    body_pl: "List napisany dla Ciebie na podstawie całej Twojej podróży.",
    link: "/referral",
  },
  {
    threshold: 10,
    reward_type: "exclusive_theme",
    title_en: "Reward unlocked: exclusive animated theme",
    title_pl: "Nagroda odblokowana: ekskluzywny animowany motyw",
    body_en: "Choose from themes not available in the shop.",
    body_pl: "Wybierz spośród motywów niedostępnych w sklepie.",
    link: "/referral/themes",
  },
  {
    threshold: 15,
    reward_type: "deep_reading",
    title_en: "Reward unlocked: deep reading",
    title_pl: "Nagroda odblokowana: głęboki odczyt",
    body_en: "A multi-month panorama of your patterns.",
    body_pl: "Panorama Twoich wzorców z wielu miesięcy.",
    link: "/referral",
  },
  {
    threshold: 20,
    reward_type: "shadow_mirror",
    title_en: "Reward unlocked: shadow mirror",
    title_pl: "Nagroda odblokowana: lustro cienia",
    body_en: "Your complete shadow work journey reflected back to you.",
    body_pl: "Cała Twoja podróż z pracą z cieniem odbita jak w lustrze.",
    link: "/referral",
  },
];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { count } = await supabase
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", user.id)
    .eq("status", "completed");

  const completed = count || 0;
  const cycleNumber = Math.floor(completed / 20);
  const isFirstCycle = cycleNumber === 0;
  const thresholds = isFirstCycle ? CYCLE_1_THRESHOLDS : CYCLE_2_THRESHOLDS;
  const cycleCount = isFirstCycle ? completed : completed % 20;

  const { data: existingRewards } = await supabase
    .from("referral_rewards")
    .select("reward_type")
    .eq("user_id", user.id);

  const existingTypes = new Set((existingRewards || []).map(r => r.reward_type));
  const newRewards: string[] = [];

  for (const t of thresholds) {
    if (cycleCount >= t.threshold && !existingTypes.has(t.reward_type)) {
      await supabase.from("referral_rewards").insert({
        user_id: user.id,
        reward_type: t.reward_type,
        is_used: false,
      });

      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "referral_reward",
        title_en: t.title_en,
        title_pl: t.title_pl,
        body_en: t.body_en,
        body_pl: t.body_pl,
        link: t.link,
      });

      newRewards.push(t.reward_type);
    }
  }

  return NextResponse.json({ completed, newRewards });
}