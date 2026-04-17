import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-03-31.basil" });
const COUPON_ID = "17F9yhm4";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { reward_type } = await req.json();
  if (!["workbook_discount_30", "premium_discount_30"].includes(reward_type)) {
    return NextResponse.json({ error: "Invalid reward type" }, { status: 400 });
  }

  // Check if already has a code for this reward type
  const { data: existing } = await supabase.from("referral_rewards")
    .select("stripe_promo_code")
    .eq("user_id", user.id)
    .eq("reward_type", reward_type)
    .not("stripe_promo_code", "is", null)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ code: existing[0].stripe_promo_code });
  }

  // Verify reward exists and is earned
  const { data: reward } = await supabase.from("referral_rewards")
    .select("id")
    .eq("user_id", user.id)
    .eq("reward_type", reward_type)
    .single();

  if (!reward) {
    return NextResponse.json({ error: "Reward not earned yet" }, { status: 400 });
  }

  // Generate unique promo code
  try {
    const promoCode = await (stripe.promotionCodes as any).create({
      coupon: COUPON_ID,
      max_redemptions: 1,
      metadata: { user_id: user.id, reward_type },
    });

    await supabase.from("referral_rewards")
      .update({ stripe_promo_code: promoCode.code })
      .eq("user_id", user.id)
      .eq("reward_type", reward_type);

    return NextResponse.json({ code: promoCode.code });
  } catch (err) {
    console.error("Promo code error:", err);
    return NextResponse.json({ error: "Failed to generate code" }, { status: 500 });
  }
}