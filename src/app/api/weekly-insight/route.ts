import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { gatherWorkbookContext } from "@/lib/workbook-context";
import { NOCTUA_VOICE_SYSTEM_PROMPT } from "@/lib/noctua-voice";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_premium, preferred_language")
    .eq("id", user.id)
    .single();

  if (!profile?.is_premium) {
    // Check for purchased credit
    const { data: product } = await supabase.from("shop_products").select("id").eq("name", "First Reflection").single();
    if (product) {
      const { data: credit } = await supabase.from("user_purchases").select("id").eq("user_id", user.id).eq("product_id", product.id).is("used_at", null).limit(1);
      if (credit && credit.length > 0) {
        // Will mark as used after generation
      } else {
        return NextResponse.json({ error: "Premium or purchase required" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Premium required" }, { status: 403 });
    }
  }

  const lang = profile?.preferred_language === "pl" ? "pl" : "en";

  // Check for cached insight this week
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const { data: cached } = await supabase
    .from("weekly_insights")
    .select("insight_text")
    .eq("user_id", user.id)
    .gte("created_at", startOfWeek.toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (cached) {
    return NextResponse.json({ insight: cached.insight_text, cached: true });
  }

  // Gather data from last 7 days
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: journals } = await supabase
    .from("journal_entries")
    .select("content, mood, entry_date")
    .eq("user_id", user.id)
    .gte("entry_date", weekAgo.split("T")[0])
    .order("entry_date", { ascending: false });

  const { data: dreams } = await supabase
    .from("dream_entries")
    .select("title, content, emotional_tone, symbols, dream_date, created_at")
    .eq("user_id", user.id)
    .gte("created_at", weekAgo)
    .order("created_at", { ascending: false });

  const { data: shadowEntries } = await supabase
    .from("shadow_work_entries")
    .select("prompt, response, emotions, created_at")
    .eq("user_id", user.id)
    .gte("created_at", weekAgo)
    .order("created_at", { ascending: false });

  if ((!journals || journals.length === 0) && (!dreams || dreams.length === 0) && (!shadowEntries || shadowEntries.length === 0)) {
    return NextResponse.json({
      insight: lang === "pl"
        ? "Za mało danych z tego tygodnia. Pisz dziennik, zapisuj sny, pracuj z cieniem. Wtedy będę miała co ci powiedzieć."
        : "Not enough data from this week. Journal, record dreams, do shadow work. Then I will have something to tell you.",
      cached: false,
      noData: true,
    });
  }

  const journalSummary = (journals || []).map(j => `[${j.entry_date}] Mood: ${(j.mood || []).join(", ")}. Wrote: "${(j.content || "").slice(0, 800)}"`).join("\n\n");
  const dreamSummary = (dreams || []).map(d => `[${d.dream_date || d.created_at?.slice(0, 10) || "unknown date"}] Dream "${d.title || "Untitled"}". Emotions: ${(d.emotional_tone || []).join(", ")}. Symbols: ${(d.symbols || []).join(", ")}. Content: "${(d.content || "").slice(0, 800)}"`).join("\n\n");
  const shadowSummary = (shadowEntries || []).map(s => `[${s.created_at?.slice(0, 10) || "unknown date"}] Prompt: "${s.prompt}". She wrote: "${(s.response || "").slice(0, 800)}". Emotions: ${(s.emotions || []).join(", ")}`).join("\n\n");

  // Workbook context: self-work + planetary workbooks (via shared helper)
  const workbookInsights = await gatherWorkbookContext(user.id, supabase);

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

  const prompt = `This is a weekly reading. You are looking at the specific material she put down this week and reflecting it back to her.

Write in ${lang === "pl" ? "Polish" : "English"}.

What she wrote this week:

Journal entries:
${journalSummary || "None this week."}

Dreams:
${dreamSummary || "None this week."}

Shadow work:
${shadowSummary || "None this week."}

${workbookInsights ? `\n${workbookInsights}\n` : ""}
${patternContext ? `\nPatterns Noctua has noticed earlier:\n${patternContext}\nIf any of these show up in this week's material, reference them concretely, using what she wrote this week.\n` : ""}

Total entries across her time in the app: ${totalEntries || 0}.

How to write this reading:

Quote or paraphrase her own specific words. When something matters, name when she wrote it. "On [date] you wrote X" is stronger than "you mentioned a feeling." Use the dates that appear in square brackets in the data above.

Name two or three things that appeared together. Not interpretations. Observations of what co-occurred. "On the same day you wrote X, you also dreamed Y."

When you connect to patterns Noctua noticed before, anchor it in this week's actual material, not in abstractions.

Do not philosophise. Do not write aphorisms. Do not say things like "sometimes what is absent is most meaningful" or "silence speaks louder than words." No poetry. No wellness-speak.

Do not diagnose. Do not tell her what her pattern means. Name what happened, using her own language. She draws conclusions herself.

Three or four short flowing paragraphs. Under 350 words. No headings, no lists, no markdown, no em dashes.

The last line is short and concrete. It names something specific from this week that stays with her. Not a command, not a call to action, not an aphorism. A single observation about what she actually wrote or dreamed or worked on this week.`;

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
        max_tokens: 800,
        system: NOCTUA_VOICE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text || "";
    const insightText = rawText
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/—/g, ", ")
      .replace(/–/g, ", ")
      .replace(/ - /g, ", ")
      .replace(/#{1,3}\s/g, "");

    // Save to DB
    await supabase.from("weekly_insights").insert({
      user_id: user.id,
      insight_text: insightText,
      week_start: startOfWeek.toISOString().split("T")[0],
    });

    // Use credit if not premium
    if (!profile?.is_premium) {
      const { data: product } = await supabase.from("shop_products").select("id").eq("name", "First Reflection").single();
      if (product) {
        const { data: credit } = await supabase.from("user_purchases").select("id").eq("user_id", user.id).eq("product_id", product.id).is("used_at", null).limit(1);
        if (credit && credit.length > 0) {
          await supabase.from("user_purchases").update({ used_at: new Date().toISOString() }).eq("id", credit[0].id);
        }
      }
    }

    return NextResponse.json({ insight: insightText, cached: false });
  } catch (err) {
    console.error("Weekly insight error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}