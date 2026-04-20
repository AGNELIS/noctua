import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { gatherWorkbookContext } from "@/lib/workbook-context";

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
    const { data: product } = await supabase.from("shop_products").select("id").eq("name", "Weekly Insight").single();
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
    .select("title, content, emotional_tone, symbols")
    .eq("user_id", user.id)
    .gte("created_at", weekAgo)
    .order("created_at", { ascending: false });

  const { data: shadowEntries } = await supabase
    .from("shadow_work_entries")
    .select("prompt, response, emotions")
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

  const journalSummary = (journals || []).map(j => `[${j.entry_date}] Mood: ${(j.mood || []).join(", ")}. ${j.content.slice(0, 120)}`).join("\n");
  const dreamSummary = (dreams || []).map(d => `Dream: ${d.title || "Untitled"}. Emotions: ${(d.emotional_tone || []).join(", ")}. Symbols: ${(d.symbols || []).join(", ")}`).join("\n");
  const shadowSummary = (shadowEntries || []).map(s => `Prompt: ${s.prompt}. Response: ${s.response.slice(0, 100)}. Emotions: ${(s.emotions || []).join(", ")}`).join("\n");

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

  const prompt = `You are the insight engine for "Noctua" by AGNÉLIS. You write the way a wise, direct woman speaks to another woman. No spiritual bypassing. No generic wellness. Warm but honest. You see what others miss.

Write entirely in ${lang === "pl" ? "Polish" : "English"}.

Generate a weekly insight for this person. This is not a summary. This is a reading. You are telling them what you see.

Structure (no headings, just flowing text, 3 to 5 paragraphs):
Paragraph 1: What this week was really about (the theme underneath the surface)
Paragraph 2: The pattern you noticed (something recurring, something they might not see)
Paragraph 3: The tension (what they are doing vs what they actually need)
Paragraph 4 (optional): One observation that might be uncomfortable but true
Last line: One sentence. Direct. Something that stays.

Journal entries this week:
${journalSummary || "None"}

Dreams this week:
${dreamSummary || "None"}

Shadow work this week:
${shadowSummary || "None"}
${workbookInsights ? `\nRecent workbook insights:\n${workbookInsights}` : ""}
Phase: ${phase} (${totalEntries || 0} total entries). ${phase === "discovery" ? "Early in self-work. Be gentle but clear." : phase === "deepening" ? "Seeing patterns. Be direct. Name what repeats across journal, dreams and workbooks." : "Experienced. Do not summarize. Challenge. Connect dots she has not connected yet."}
${workbookInsights ? "If patterns from workbooks connect to this week's journal or dreams, name the connection naturally." : ""}
${patternContext ? `\nKnown patterns Noctua has identified over time:\n${patternContext}\nIf these patterns are visible in this week's data, reference them. Show her that Noctua sees the thread across weeks. Do not list patterns. Weave them in.` : ""}

CRITICAL FORMATTING RULES:
Under 300 words. No markdown. No asterisks. No bold. No bullet points. No dashes or em dashes. Use commas and full stops only. Never use "Dear" or "Droga" or any greeting. No section headings.`;

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
      const { data: product } = await supabase.from("shop_products").select("id").eq("name", "Weekly Insight").single();
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