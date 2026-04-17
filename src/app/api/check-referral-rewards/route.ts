import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const THRESHOLDS = [
  {
    threshold: 3,
    reward_type: "dream_analysis_1",
    title_en: "Reward unlocked: free dream analysis",
    title_pl: "Nagroda odblokowana: darmowy odczyt snu",
    body_en: "3 friends joined Noctua. You earned 1 free dream reading.",
    body_pl: "3 osoby dołączyły do Noctua. Otrzymujesz 1 darmową analizę snu AI.",
    link: "/referral",
  },
  {
    threshold: 5,
    reward_type: "theme_moonstone",
    title_en: "Exclusive theme unlocked: Moonstone",
    title_pl: "Ekskluzywny motyw odblokowany: Moonstone",
    body_en: "5 friends joined. You unlocked the Moonstone theme, not available in the shop.",
    body_pl: "5 osób dołączyło. Odblokowałaś motyw Moonstone, niedostępny w sklepie.",
    link: "/referral",
  },
  {
    threshold: 10,
    reward_type: "workbook_discount_30",
    title_en: "Reward unlocked: 30% off any workbook + 2 dream analyses",
    title_pl: "Nagroda odblokowana: 30% zniżki na workbook + 2 analizy snów",
    body_en: "10 friends joined. You earned 30% off any workbook and 2 extra dream analyses. Get your code on the Referral page and use it in the shop.",
    body_pl: "10 osób dołączyło. Otrzymujesz 30% zniżki na dowolny workbook i 2 dodatkowe analizy snów. Pobierz kod na stronie Zaproszeń i użyj go w sklepie.",
    link: "/referral",
  },
  {
    threshold: 15,
    reward_type: "theme_velvet_night",
    title_en: "Exclusive theme unlocked: Velvet Night",
    title_pl: "Ekskluzywny motyw odblokowany: Velvet Night",
    body_en: "15 friends joined. You unlocked the Velvet Night theme, not available in the shop.",
    body_pl: "15 osób dołączyło. Odblokowałaś motyw Velvet Night, niedostępny w sklepie.",
    link: "/referral",
  },
  {
    threshold: 20,
    reward_type: "premium_discount_30",
    title_en: "Reward unlocked: 30% off Premium + 3 dream analyses",
    title_pl: "Nagroda odblokowana: 30% zniżki na Premium + 3 analizy snów",
    body_en: "20 friends joined. You earned 30% off Premium and 3 extra dream analyses. Get your code on the Referral page and apply it when subscribing.",
    body_pl: "20 osób dołączyło. Otrzymujesz 30% zniżki na Premium i 3 dodatkowe analizy snów. Pobierz kod na stronie Zaproszeń i użyj go przy subskrypcji.",
    link: "/referral",
  },
  {
    threshold: 30,
    reward_type: "theme_obsidian_rose",
    title_en: "Exclusive theme unlocked: Obsidian Rose + Ambassador status",
    title_pl: "Ekskluzywny motyw odblokowany: Obsidian Rose + status Ambasadorki",
    body_en: "30 friends joined. You unlocked Obsidian Rose and earned Ambassador status. You now have the complete exclusive collection.",
    body_pl: "30 osób dołączyło. Odblokowałaś Obsidian Rose i otrzymałaś status Ambasadorki. Masz kompletną ekskluzywną kolekcję.",
    link: "/referral",
  },
  {
    threshold: 50,
    reward_type: "unlimited_dreams",
    title_en: "Lifetime reward: unlimited dream analyses",
    title_pl: "Nagroda dożywotnia: nieograniczone analizy snów",
    body_en: "50 friends joined Noctua. You have earned unlimited AI dream analyses for life. No limits. Ever.",
    body_pl: "50 osób dołączyło do Noctua. Otrzymujesz nieograniczone analizy snów AI na zawsze. Bez limitów. Na zawsze.",
    link: "/referral",
  },
];

export async function POST(req: NextRequest) {
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { count } = await supabase
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", user.id)
    .eq("status", "completed");

  const completed = count || 0;

  const { data: existingRewards } = await supabase
    .from("referral_rewards")
    .select("reward_type")
    .eq("user_id", user.id);

  const existingTypes = new Set((existingRewards || []).map(r => r.reward_type));
  const newRewards: string[] = [];

  for (const t of THRESHOLDS) {
    if (completed >= t.threshold && !existingTypes.has(t.reward_type)) {
      const { error: rewardErr } = await supabase.from("referral_rewards").insert({
        user_id: user.id,
        reward_type: t.reward_type,
        is_used: false,
      });
      if (rewardErr) console.error("Reward insert error:", rewardErr);

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

      // Notify admin when someone reaches 50 referrals
      if (t.threshold === 50) {
        const serviceSupabase = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { data: admins } = await serviceSupabase
          .from("profiles")
          .select("id")
          .eq("is_admin", true);

        const { data: referrerProfile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .single();

        const userName = referrerProfile?.display_name || user.email || "Unknown user";

        if (admins) {
          for (const admin of admins) {
            await serviceSupabase.from("notifications").insert({
              user_id: admin.id,
              type: "admin_alert",
              title_en: "Someone reached 50 referrals!",
              title_pl: "Ktoś osiągnął 50 referrali!",
              body_en: `${userName} has reached 50 completed referrals and earned unlimited dream analyses. Consider reaching out personally.`,
              body_pl: `${userName} osiągnęła 50 ukończonych referrali i otrzymała nieograniczone analizy snów. Rozważ osobisty kontakt.`,
              link: "/owl-panel",
            });
          }
        }
      }
    }
  }

  return NextResponse.json({ completed, newRewards });
}