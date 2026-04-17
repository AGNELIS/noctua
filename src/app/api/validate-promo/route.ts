import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-03-31.basil" });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { promoCode, context, productId } = await req.json();

  if (!promoCode || typeof promoCode !== "string") {
    return NextResponse.json({ valid: false, error: "Missing promo code" }, { status: 400 });
  }
  if (!["premium", "shop"].includes(context)) {
    return NextResponse.json({ valid: false, error: "Invalid context" }, { status: 400 });
  }

  try {
    const promos = await (stripe.promotionCodes as any).list({ code: promoCode, limit: 1 });
    const promo = promos.data[0];

    if (!promo) {
      return NextResponse.json({ valid: false, error: "Code not found" }, { status: 404 });
    }
    if (!promo.active) {
      return NextResponse.json({ valid: false, error: "Code already used or inactive" }, { status: 400 });
    }
    if (promo.metadata?.user_id !== user.id) {
      return NextResponse.json({ valid: false, error: "This code is not assigned to you" }, { status: 403 });
    }

    const rewardType = promo.metadata?.reward_type;

    if (context === "premium") {
      if (rewardType !== "premium_discount_30") {
        return NextResponse.json({ valid: false, error: "This code is not valid for Premium subscription" }, { status: 400 });
      }
    } else if (context === "shop") {
      if (rewardType !== "workbook_discount_30") {
        return NextResponse.json({ valid: false, error: "This code is not valid for shop products" }, { status: 400 });
      }
      if (!productId) {
        return NextResponse.json({ valid: false, error: "Missing product ID" }, { status: 400 });
      }
      const { data: product } = await supabase
        .from("shop_products")
        .select("category")
        .eq("id", productId)
        .single();
      if (!product) {
        return NextResponse.json({ valid: false, error: "Product not found" }, { status: 404 });
      }
      if (product.category !== "self_work") {
        return NextResponse.json({ valid: false, error: "This code only works for Self Work workbooks" }, { status: 400 });
      }
    }

    return NextResponse.json({
      valid: true,
      discount_percent: promo.coupon.percent_off,
      promotion_code_id: promo.id,
      code: promo.code,
    });
  } catch (err) {
    console.error("Validate promo error:", err);
    return NextResponse.json({ valid: false, error: "Validation failed" }, { status: 500 });
  }
}