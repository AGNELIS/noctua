import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-03-31.basil" });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const productId = session.metadata?.product_id;
      const sessionId = session.id;

      if (userId && productId) {
        const { data: product } = await supabase.from("shop_products")
          .select("is_consumable").eq("id", productId).single();
        const isConsumable = !!product?.is_consumable;

        // Idempotency check: skip if this exact Stripe session was already processed
        // Protects against Stripe webhook retries causing duplicate inserts
        const { data: alreadyProcessed } = await supabase.from("user_purchases")
          .select("id").eq("stripe_session_id", sessionId).limit(1);

        if (alreadyProcessed && alreadyProcessed.length > 0) {
          console.log(`Webhook: session ${sessionId} already processed, skipping insert`);
        } else if (isConsumable) {
          // Insert credit for consumables (each unique purchase = new credit)
          await supabase.from("user_purchases").insert({
            user_id: userId,
            product_id: productId,
            stripe_session_id: sessionId,
          });
        } else {
          // For permanent products, only insert if user does not already own
          const { data: existing } = await supabase.from("user_purchases")
            .select("id").eq("user_id", userId).eq("product_id", productId).limit(1);
          if (!existing || existing.length === 0) {
            await supabase.from("user_purchases").insert({
              user_id: userId,
              product_id: productId,
              stripe_session_id: sessionId,
            });
          }
        }

        // If bundle purchased, unlock all included products
        const { data: purchasedProduct } = await supabase.from("shop_products").select("name").eq("id", productId).single();
        if (purchasedProduct?.name === "Depth Work Bundle") {
          const bundleProducts = ["Moon Workbook", "Saturn Workbook", "Pluto Workbook", "Chiron Workbook", "Lilith Workbook", "Lunar Nodes Workbook"];
          for (const name of bundleProducts) {
            const { data: prod } = await supabase.from("shop_products").select("id").eq("name", name).single();
            if (prod) {
              const { data: alreadyOwned } = await supabase.from("user_purchases").select("id").eq("user_id", userId).eq("product_id", prod.id).limit(1);
              if (!alreadyOwned || alreadyOwned.length === 0) {
                await supabase.from("user_purchases").insert({ user_id: userId, product_id: prod.id, stripe_session_id: sessionId });
              }
            }
          }
        }
      }

      // If subscription, save to profiles
      if (session.mode === "subscription" && userId) {
        await supabase.from("profiles")
          .update({ is_premium: true, stripe_customer_id: session.customer as string })
          .eq("id", userId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      await supabase.from("profiles")
        .update({ is_premium: false })
        .eq("stripe_customer_id", customerId);
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const isActive = sub.status === "active" || sub.status === "trialing";
      await supabase.from("profiles")
        .update({ is_premium: isActive })
        .eq("stripe_customer_id", customerId);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      console.log(`Payment failed for customer: ${customerId}`);
      // Could send notification or flag account
      break;
    }

    case "checkout.session.expired": {
      console.log("Checkout session expired:", event.data.object);
      break;
    }
  }

  return NextResponse.json({ received: true });
}