import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-03-31.basil" });

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: rews } = await supabase
    .from("referral_rewards")
    .select("reward_type, stripe_promo_code")
    .eq("user_id", user.id)
    .not("stripe_promo_code", "is", null);

  const result: Record<string, { code: string; redeemed: boolean }> = {};

  for (const r of rews || []) {
    if (!r.stripe_promo_code) continue;
    try {
      const list = await stripe.promotionCodes.list({ code: r.stripe_promo_code, limit: 1 });
      const pc = list.data[0];
      if (!pc) {
        result[r.reward_type] = { code: r.stripe_promo_code, redeemed: true };
        continue;
      }
      const redeemed = !pc.active || (pc.max_redemptions !== null && pc.times_redeemed >= pc.max_redemptions);
      result[r.reward_type] = { code: r.stripe_promo_code, redeemed };
    } catch (err) {
      console.error("Stripe promo check error:", err);
      result[r.reward_type] = { code: r.stripe_promo_code, redeemed: false };
    }
  }

  return NextResponse.json(result);
}