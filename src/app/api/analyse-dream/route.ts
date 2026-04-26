import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { gatherWorkbookContext } from "@/lib/workbook-context";
import { getUserMemory } from "@/lib/memory-context";

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

  // Tier 50 bypass: check if user has unlimited_dreams reward
  const { data: unlimitedReward } = await supabase
    .from("referral_rewards")
    .select("id")
    .eq("user_id", user.id)
    .eq("reward_type", "unlimited_dreams")
    .maybeSingle();
  const hasUnlimited = !!unlimitedReward;

  if (!isAdmin && !hasUnlimited && isPremium && usedThisMonth >= PREMIUM_MONTHLY_LIMIT) {
    const { data: credits } = await supabase
      .from("user_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", (await supabase.from("shop_products").select("id").eq("name", "Dream Reading").single()).data?.id)
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
  } else if (!isAdmin && !hasUnlimited && !isPremium) {
    const { data: credits } = await supabase
      .from("user_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", (await supabase.from("shop_products").select("id").eq("name", "Dream Reading").single()).data?.id)
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

  // Workbook context: self-work + planetary workbooks (via shared helper)
  const workbookContext = await gatherWorkbookContext(user.id, supabase);

  // Cumulative memory snapshot (Noctua's continuous knowledge of this user)
  const memory = await getUserMemory(user.id, supabase);
  const memoryContext = memory.lastSnapshotContent
    ? `CONTINUITY FROM HER CUMULATIVE MEMORY:
This is what Noctua has already seen about her across ${memory.lastSnapshotNumber} previous snapshot${memory.lastSnapshotNumber === 1 ? "" : "s"} of her inner work, including how dreams have been weaving through her life. Treat this as what you already know. If symbols from this dream returned from earlier dreams or shadow work, name that. If something has shifted, name that. Do not repeat the snapshot, build on it.

${memory.lastSnapshotContent}

`
    : "";

  const { data: patternData } = await supabase
    .from("user_patterns")
    .select("pattern_type, description, keywords, frequency")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("frequency", { ascending: false })
    .limit(6);

  const patternContext = (patternData || []).length > 0
    ? (patternData || []).map(p => `[${p.pattern_type}, seen ${p.frequency}x] ${p.description}`).join(" | ")
    : "";

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

  const prompt = `You are a dream reader for the app "Noctua" by AGNÉLIS. You write the way a wise, direct woman would speak to another woman. No spiritual bypassing. No generic wellness tone. Warm but honest. You write like someone who has done this work herself.

Your voice: full sentences that carry information, not fragments. Direct observations. Questions that cut through. You never decorate, never soften what needs to be said.

Write entirely in ${lang === "pl" ? "Polish" : "English"}.

${memoryContext}CRITICAL VOICE RULES:
Never name cycle phases by clinical label. No "follicular", no "luteal", no "folikularna", no "lutealna". Speak of the body as she would: "when you were bleeding", "as your energy was returning", "the inward time".
Never quote energy scores as numbers. No "energy level 4 of 5". Instead: "a day when energy was present", "the low-energy days".
Never quote exact dates. Speak in rhythm: "at the beginning of the month", "within the same week", "pod koniec miesiąca". Sequence and frequency matter, specific calendar dates do not.
Never invent atmosphere you cannot see in the data. You see what she wrote, what symbols she tagged, what emotions she named. You do not see how she wrote, whether she paused, her tone. Do not write "you wrote briefly", "you held back". Stay with what is on the page.
Write in correct Polish grammar and spelling. If you quote or paraphrase a word from her entries, preserve its exact form (for example: do not write "mania" when she wrote "mama").

Structure your response with these exact section headings on their own line in Title Case, not uppercase:

${sectionHeadings.overview}
2 to 3 sentences. What is this dream actually about? Not the surface. The thing underneath.

${sectionHeadings.symbols}
What do these symbols mean in her context? If symbols here echo what is in her cumulative memory or recent material, name that connection plainly. Do not force archetypal labels.

${sectionHeadings.shadow}
What is this dream showing her that she is not yet seeing in waking life? Be specific. Name where this pattern lives in her writing or where it does not.

${sectionHeadings.lunar}
Where she is in her body's rhythm and how this dream meets that rhythm. Without clinical names. Without numbers.

${sectionHeadings.reflection}
One question. Make it the kind that stays with her for days.

Dream title: ${dream.title || "Untitled"}
Dream content: ${dream.content}
Emotional tone: ${(dream.emotional_tone || []).join(", ") || "not specified"}
Symbols noted: ${(dream.symbols || []).join(", ") || "none"}
Recurring: ${dream.is_recurring ? "Yes" : "No"}

Recent journal context:
${journalContext}
${workbookContext ? `\nInsights from self-work (workbooks):\n${workbookContext}` : ""}
${patternContext ? `\nKnown patterns Noctua has identified earlier:\n${patternContext}\nIf a pattern connects to this dream, weave it in. Do not list patterns.` : ""}

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
    const { data: productData } = await supabase.from("shop_products").select("id").eq("name", "Dream Reading").single();
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