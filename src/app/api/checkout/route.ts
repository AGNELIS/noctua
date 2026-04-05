import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-03-31.basil" });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { productId, productName, priceGbp } = await req.json();
  if (!productId || !productName || !priceGbp) {
    return NextResponse.json({ error: "Missing product data" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "gbp",
          product_data: { name: productName },
          unit_amount: Math.round(priceGbp * 100),
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${req.nextUrl.origin}/shop/success?session_id={CHECKOUT_SESSION_ID}&product_id=${productId}`,
      cancel_url: `${req.nextUrl.origin}/shop/${productId}`,
      client_reference_id: user.id,
      metadata: { product_id: productId, user_id: user.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}