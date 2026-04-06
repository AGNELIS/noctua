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

  try {
    const sessionParams: any = {
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${req.nextUrl.origin}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/premium`,
      client_reference_id: user.id,
      metadata: { user_id: user.id, plan },
    };
    if (promoCode) {
      sessionParams.discounts = [{ promotion_code: promoCode }];
    } else {
      sessionParams.allow_promotion_codes = true;
    }
    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe subscribe error:", err);
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
  }
}