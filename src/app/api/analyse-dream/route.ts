import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const PREMIUM_MONTHLY_LIMIT = 5;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { dreamId, language: userLang } = await req.json();
  const lang = userLang === "pl" ? "pl" : "en";
  if (!dreamId) {
    return NextResponse.json({ error: "Missing dreamId" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("dream_analyses")
    .select("analysis_text, reflection_response")
    .eq("dream_entry_id", dreamId)
    .single();

  if (existing) {
    return NextResponse.json({ analysis: existing.analysis_text, reflection: existing.reflection_response || null, cached: true });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_premium, is_admin")
    .eq("id", user.id)
    .single();
  const isPremium = profile?.is_premium || false;
  const isAdmin = profile?.is_admin || false;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count } = await supabase
    .from("dream_analyses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth);

  const usedThisMonth = count || 0;

  if (!isAdmin && isPremium && usedThisMonth >= PREMIUM_MONTHLY_LIMIT) {
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
  } else if (!isAdmin && !isPremium) {
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

  // Cross-referencing: workbook insights + phase
  const { data: workbookData } = await supabase
    .from("workbook_progress")
    .select("workbook_type, responses, completed_at")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(5);

  const workbookContext = (workbookData || []).map(w => {
    const responses = w.responses || [];
    const lastResponse = responses[responses.length - 1];
    if (lastResponse?.ai_reaction) return `${w.workbook_type} workbook: "${lastResponse.ai_reaction.substring(0, 150)}"`;
    return null;
  }).filter(Boolean).join(" | ");

  const { count: totalEntries } = await supabase
    .from("journal_entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const phase = (totalEntries || 0) <= 15 ? "discovery" : (totalEntries || 0) <= 40 ? "deepening" : "integration";

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const sectionHeadings = lang === "pl"
    ? { overview: "Co mówi ten sen", symbols: "Symbole i archetypy", shadow: "Praca z cieniem", lunar: "Połączenie z księżycem", reflection: "Pytanie na koniec" }
    : { overview: "What this dream is saying", symbols: "Symbols and archetypes", shadow: "Shadow work insight", lunar: "Lunar connection", reflection: "Reflection prompt" };

  const prompt = `You are a Jungian dream analyst and shadow work guide for the app "Noctua" by AGNÉLIS. You write the way a wise, direct woman would speak to another woman. No spiritual bypassing. No generic wellness tone. Warm but honest. Poetic but precise. You see what others miss.

Your voice: short sentences. Direct observations. Questions that cut through. You never decorate, never soften what needs to be said. You write like someone who has done this work herself.

Write entirely in ${lang === "pl" ? "Polish" : "English"}.

Structure your response with these exact section headings on their own line in Title Case, not uppercase:

${sectionHeadings.overview}
2 to 3 sentences. What is this dream actually about? Not the surface. The thing underneath.

${sectionHeadings.symbols}
What do these symbols mean in this person's context? Connect to Jungian archetypes only where it genuinely fits. Do not force connections.

${sectionHeadings.shadow}
What is this dream revealing that the dreamer is not seeing in waking life? Use their recent journal entries for context. Be specific. Name the pattern.

${sectionHeadings.lunar}
How does the current lunar energy connect to what is surfacing in this dream?

${sectionHeadings.reflection}
One question. Make it the kind that stays with someone for days.

Dream title: ${dream.title || "Untitled"}
Dream content: ${dream.content}
Emotional tone: ${(dream.emotional_tone || []).join(", ") || "not specified"}
Symbols noted: ${(dream.symbols || []).join(", ") || "none"}
Lucidity: ${dream.lucidity || "not rated"}/5
Recurring: ${dream.is_recurring ? "Yes" : "No"}

Recent journal context:
${journalContext}
${workbookContext ? `\nInsights from self-work (workbooks):\n${workbookContext}` : ""}
Phase: ${phase} (${totalEntries || 0} journal entries). ${phase === "discovery" ? "Early in self-work. Name things simply." : phase === "deepening" ? "Seeing patterns. Be more direct. Reference what repeats." : "Experienced. Do not explain what she already sees. Push integration."}
${workbookContext ? "If you see connections between the dream and patterns from her workbooks, name them naturally. Do not force it." : ""}

CRITICAL FORMATTING RULES:
Keep the response under 500 words. Do NOT use any markdown formatting. No asterisks. No bold. No bullet points. Never use dashes, hyphens, em dashes or en dashes anywhere in the text. Use commas and full stops only. Write section headings in Title Case on their own line. Never use the word "Droga" or "Dear" or any greeting.`;
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
      .replace(/—/g, ", ")
      .replace(/–/g, ", ")
      .replace(/ - /g, ", ")
      .replace(/#{1,3}\s/g, "");

    await supabase.from("dream_analyses").insert({
      user_id: user.id,
      dream_entry_id: dreamId,
      analysis_text: analysisText,
    });

    // Mark one credit as used (for non-premium or over-limit premium)
    const { data: productData } = await supabase.from("shop_products").select("id").eq("name", "Dream AI Analysis").single();
    if (productData) {
      const { data: unusedCredit } = await supabase
        .from("user_purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productData.id)
        .is("used_at", null)
        .limit(1);
      if (unusedCredit && unusedCredit.length > 0) {
        await supabase.from("user_purchases")
          .update({ used_at: new Date().toISOString() })
          .eq("id", unusedCredit[0].id);
      }
    }

    return NextResponse.json({ analysis: analysisText, cached: false });
  } catch (err) {
    console.error("Analysis error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}