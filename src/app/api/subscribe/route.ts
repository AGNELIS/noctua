import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-03-31.basil" });

const PRICES: Record<string, string> = {
  monthly: "price_1TIsJERQuxrJoBK1v0gNlYY2",
  yearly: "price_1TIsJpRQuxrJoBK1HYc4rURx",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { plan, promoCode } = await req.json();
  const priceId = PRICES[plan];
  if (!priceId) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  let promotionCodeId: string | null = null;

  if (promoCode) {
    try {
      const promos = await (stripe.promotionCodes as any).list({ code: promoCode, limit: 1 });
      const promo = promos.data[0];
      if (!promo) {
        return NextResponse.json({ error: "Code not found" }, { status: 404 });
      }
      if (!promo.active) {
        return NextResponse.json({ error: "Code already used or inactive" }, { status: 400 });
      }
      if (promo.metadata?.user_id !== user.id) {
        return NextResponse.json({ error: "This code is not assigned to you" }, { status: 403 });
      }
      if (promo.metadata?.reward_type !== "premium_discount_30") {
        return NextResponse.json({ error: "This code is not valid for Premium subscription" }, { status: 400 });
      }
      promotionCodeId = promo.id;
    } catch (err) {
      console.error("Promo validation error:", err);
      return NextResponse.json({ error: "Promo code validation failed" }, { status: 500 });
    }
  }

  try {
    const sessionParams: any = {
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${req.nextUrl.origin}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/premium`,
      client_reference_id: user.id,
      metadata: { user_id: user.id, plan },
      allow_promotion_codes: false,
    };
    if (promotionCodeId) {
      sessionParams.discounts = [{ promotion_code: promotionCodeId }];
    }
    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe subscribe error:", err);
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
  }
}