import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-03-31.basil" });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ verified: false, reason: "not_authenticated" }, { status: 401 });
  }

  const { sessionId, expectedMode } = await req.json();

  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json({ verified: false, reason: "missing_session_id" }, { status: 400 });
  }
  if (expectedMode !== "subscription" && expectedMode !== "payment") {
    return NextResponse.json({ verified: false, reason: "invalid_mode" }, { status: 400 });
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    console.error("Stripe session retrieve failed:", err);
    return NextResponse.json({ verified: false, reason: "session_not_found" }, { status: 404 });
  }

  if (session.client_reference_id !== user.id) {
    console.error("Session ownership mismatch", {
      sessionId,
      sessionUserId: session.client_reference_id,
      requestUserId: user.id,
    });
    return NextResponse.json({ verified: false, reason: "ownership_mismatch" }, { status: 403 });
  }

  if (session.mode !== expectedMode) {
    return NextResponse.json({ verified: false, reason: "mode_mismatch" }, { status: 400 });
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json({ verified: false, reason: "not_paid" }, { status: 402 });
  }

  if (expectedMode === "payment") {
    const productId = session.metadata?.product_id;
    if (!productId) {
      return NextResponse.json({ verified: false, reason: "missing_product_metadata" }, { status: 500 });
    }
    return NextResponse.json({ verified: true, productId });
  }

  return NextResponse.json({ verified: true });
}