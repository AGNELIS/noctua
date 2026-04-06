import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-03-31.basil" });
const COUPON_ID = "17F9yhm4";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Check if already has a code
  const { data: existing } = await supabase.from("referral_rewards")
    .select("stripe_promo_code")
    .eq("user_id", user.id)
    .eq("reward_type", "badge")
    .not("stripe_promo_code", "is", null)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ code: existing[0].stripe_promo_code });
  }

  // Verify 20 active referrals
  const { count } = await supabase.from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", user.id)
    .eq("status", "completed");

  if (!count || count < 20) {
    return NextResponse.json({ error: "Not enough referrals" }, { status: 400 });
  }

  // Generate unique promo code
  try {
    const promoCode = await (stripe.promotionCodes as any).create({
      coupon: COUPON_ID,
      max_redemptions: 1,
      metadata: { user_id: user.id },
    });

    // Save to database
    await supabase.from("referral_rewards")
      .update({ stripe_promo_code: promoCode.code })
      .eq("user_id", user.id)
      .eq("reward_type", "badge");

    return NextResponse.json({ code: promoCode.code });
  } catch (err) {
    console.error("Promo code error:", err);
    return NextResponse.json({ error: "Failed to generate code" }, { status: 500 });
  }
}