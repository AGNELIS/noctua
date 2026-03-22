import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const MONTHLY_FREE_LIMIT = 1;

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

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count } = await supabase
    .from("dream_analyses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth);

  const isPremium = false;

  if (!isPremium && (count || 0) >= MONTHLY_FREE_LIMIT) {
    return NextResponse.json({
      error: "limit_reached",
      message: "You have used your free analysis this month.",
      used: count,
      limit: MONTHLY_FREE_LIMIT,
    }, { status: 403 });
  }

  const { data: dream } = await supabase
    .from("dream_entries")
    .select("title, content, emotional_tone, symbols, lucidity, is_recurring")
    .eq("id", dreamId)
    .single();

  if (!dream) {
    return NextResponse.json({ error: "Dream not found" }, { status: 404 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const prompt = `You are a Jungian dream analyst and shadow work guide for the app "Noctua". Analyse this dream with warmth, depth, and poetic sensitivity.

Structure your response in these sections (use these exact headings):

**Overview**
A brief 2-3 sentence summary of the dream's core message.

**Symbols & Archetypes**
Analyse the key symbols present. Connect them to Jungian archetypes where relevant.

**Shadow Work Insight**
What might this dream be revealing about the dreamer's unconscious?

**Lunar Connection**
How might the current lunar energy relate to this dream's themes?

**Reflection Prompt**
End with one powerful journaling question.

Dream title: ${dream.title || "Untitled"}
Dream content: ${dream.content}
Emotional tone: ${(dream.emotional_tone || []).join(", ") || "not specified"}
Symbols noted: ${(dream.symbols || []).join(", ") || "none"}
Lucidity: ${dream.lucidity || "not rated"}/5
Recurring: ${dream.is_recurring ? "Yes" : "No"}

Keep the response under 500 words. Write in English. Be insightful but accessible.`;

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
    const analysisText = data.content?.[0]?.text || "No analysis generated.";

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