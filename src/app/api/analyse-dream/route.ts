import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const PREMIUM_MONTHLY_LIMIT = 5;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { dreamId } = await req.json();
  if (!dreamId) {
    return NextResponse.json({ error: "Missing dreamId" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("dream_analyses")
    .select("analysis_text")
    .eq("dream_entry_id", dreamId)
    .single();

  if (existing) {
    return NextResponse.json({ analysis: existing.analysis_text, cached: true });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_premium")
    .eq("id", user.id)
    .single();

  const isPremium = profile?.is_premium || false;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count } = await supabase
    .from("dream_analyses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth);

  const usedThisMonth = count || 0;

  if (isPremium && usedThisMonth >= PREMIUM_MONTHLY_LIMIT) {
    const { data: credits } = await supabase
      .from("user_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", (await supabase.from("shop_products").select("id").eq("name", "Dream AI Analysis").single()).data?.id)
      .is("used_at", null);

    if (!credits || credits.length === 0) {
      return NextResponse.json({
        error: "limit_reached",
        message: "You have used all 5 analyses this month. You can buy additional analyses in the shop.",
        used: usedThisMonth,
        limit: PREMIUM_MONTHLY_LIMIT,
        canBuy: true,
        buyPrice: 1.49,
      }, { status: 403 });
    }
  } else if (!isPremium) {
    const { data: credits } = await supabase
      .from("user_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", (await supabase.from("shop_products").select("id").eq("name", "Dream AI Analysis").single()).data?.id)
      .is("used_at", null);

    if (!credits || credits.length === 0) {
      return NextResponse.json({
        error: "no_access",
        message: "Dream analysis is available for premium subscribers or as a single purchase in the shop.",
        canBuy: true,
        buyPrice: 2.99,
      }, { status: 403 });
    }
  }

  const { data: dream } = await supabase
    .from("dream_entries")
    .select("title, content, emotional_tone, symbols, lucidity, is_recurring")
    .eq("id", dreamId)
    .single();

  if (!dream) {
    return NextResponse.json({ error: "Dream not found" }, { status: 404 });
  }

  const { data: journalEntries } = await supabase
    .from("journal_entries")
    .select("content, mood, entry_date")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false })
    .limit(5);

  const journalContext = journalEntries && journalEntries.length > 0
    ? journalEntries.map(e => `[${e.entry_date}] Mood: ${(e.mood || []).join(", ")}. ${e.content.slice(0, 150)}`).join("\n")
    : "No recent journal entries.";

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const prompt = `You are a Jungian dream analyst and shadow work guide for the app "Noctua". Analyse this dream with warmth, depth, and poetic sensitivity.

Structure your response in these sections (use these exact headings on their own line in UPPERCASE):

OVERVIEW
A brief 2-3 sentence summary of the dream's core message.

SYMBOLS AND ARCHETYPES
Analyse the key symbols present. Connect them to Jungian archetypes where relevant.

SHADOW WORK INSIGHT
What might this dream be revealing about the dreamer's unconscious? Consider their recent journal entries for context.

LUNAR CONNECTION
How might the current lunar energy relate to this dream's themes?

REFLECTION PROMPT
End with one powerful journaling question.

Dream title: ${dream.title || "Untitled"}
Dream content: ${dream.content}
Emotional tone: ${(dream.emotional_tone || []).join(", ") || "not specified"}
Symbols noted: ${(dream.symbols || []).join(", ") || "none"}
Lucidity: ${dream.lucidity || "not rated"}/5
Recurring: ${dream.is_recurring ? "Yes" : "No"}

Recent journal context:
${journalContext}

Keep the response under 500 words. Write in English. Be insightful but accessible.
IMPORTANT: Do NOT use any markdown formatting. No asterisks, no bold, no bullet points, no dashes, no em-dashes. Use plain text only with simple punctuation. Write section headings in UPPERCASE on their own line.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Claude API error:", err);
      return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text || "No analysis generated.";
    const analysisText = rawText
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/—/g, " - ")
      .replace(/–/g, " - ")
      .replace(/#{1,3}\s/g, "");

    await supabase.from("dream_analyses").insert({
      user_id: user.id,
      dream_entry_id: dreamId,
      analysis_text: analysisText,
    });

    return NextResponse.json({ analysis: analysisText, cached: false });
  } catch (err) {
    console.error("Analysis error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}