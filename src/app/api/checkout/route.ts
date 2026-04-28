import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { countEntries, type EntryGateConfig } from "@/lib/entry-gate";
import { getEffectivePerms } from "@/lib/effective-perms";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-03-31.basil" });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { productId, productName, priceGbp, promoCode } = await req.json();
  if (!productId || !productName || !priceGbp) {
    return NextResponse.json({ error: "Missing product data" }, { status: 400 });
  }

  // Server-side entry gate check
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, is_premium, admin_test_mode")
    .eq("id", user.id)
    .single();
  const { isAdmin } = getEffectivePerms(profile);

  const { data: gateProduct } = await supabase
    .from("shop_products")
    .select("entry_gate, entry_gate_type, entry_gate_scope")
    .eq("id", productId)
    .single();

  if (gateProduct && gateProduct.entry_gate && !isAdmin) {
    const config: EntryGateConfig = {
      entry_gate: gateProduct.entry_gate,
      entry_gate_type: gateProduct.entry_gate_type,
      entry_gate_scope: gateProduct.entry_gate_scope,
    };
    const status = await countEntries(user.id, productId, config, supabase);
    if (status.blocked) {
      return NextResponse.json(
        { error: "entry_gate_not_met", entries_total: status.entries_total, entries_required: status.entries_required },
        { status: 403 }
      );
    }
  }

  // Block purchase if user already owns this product
  // Two cases:
  //   1. Consumable products (report/interpretation): block if there's an unused credit
  //   2. Permanent products (theme/self_work/depth_work/symbol_pack): block if any purchase exists
  // Admin bypasses both checks for testing
  if (!isAdmin) {
    const { data: productCategory } = await supabase
      .from("shop_products")
      .select("category")
      .eq("id", productId)
      .single();

    const category = productCategory?.category;
    const isConsumable = category === "report" || category === "interpretation";
    const isPermanent = category === "theme" || category === "self_work" || category === "depth_work" || category === "symbol_pack";

    if (isConsumable) {
      const { data: unusedCredit } = await supabase
        .from("user_purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .is("used_at", null)
        .limit(1);

      if (unusedCredit && unusedCredit.length > 0) {
        return NextResponse.json(
          { error: "already_owns", message: "You already have an unused credit for this product. Use it before buying another." },
          { status: 400 }
        );
      }
    }

    if (isPermanent) {
      const { data: existingPurchase } = await supabase
        .from("user_purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .limit(1);

      if (existingPurchase && existingPurchase.length > 0) {
        return NextResponse.json(
          { error: "already_owns", message: "You already own this product." },
          { status: 400 }
        );
      }
    }
  }

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
      if (promo.metadata?.reward_type !== "workbook_discount_30") {
        return NextResponse.json({ error: "This code is not valid for shop products" }, { status: 400 });
      }
      const { data: product } = await supabase
        .from("shop_products")
        .select("category")
        .eq("id", productId)
        .single();
      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      if (product.category !== "self_work") {
        return NextResponse.json({ error: "This code only works for Self Work workbooks" }, { status: 400 });
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
    };
    if (promotionCodeId) {
      sessionParams.discounts = [{ promotion_code: promotionCodeId }];
    } else {
      sessionParams.allow_promotion_codes = false;
    }
    const session = await stripe.checkout.sessions.create(sessionParams);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}