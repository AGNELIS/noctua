import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { language: userLang } = await req.json();
  const lang = userLang === "pl" ? "pl" : "en";

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Check cache
  const { data: cached } = await supabase
    .from("smart_reports")
    .select("report_text, report_data")
    .eq("user_id", user.id)
    .eq("report_month", monthKey)
    .eq("language", lang)
    .single();

  if (cached) {
    return NextResponse.json({ report: cached.report_text, data: cached.report_data, cached: true });
  }

  // Gather data
  const { data: journalData } = await supabase
    .from("journal_entries")
    .select("content, mood, created_at")
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth)
    .order("created_at", { ascending: false });

  const { data: dreamData } = await supabase
    .from("dream_entries")
    .select("content, symbols, emotional_tone, is_recurring, created_at")
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth)
    .order("created_at", { ascending: false });

  const { data: shadowData } = await supabase
    .from("shadow_work_entries")
    .select("prompt, response, emotions, created_at")
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth)
    .order("created_at", { ascending: false });

  const { data: cycleData } = await supabase
    .from("cycle_entries")
    .select("cycle_phase, symptoms, energy_level, entry_date")
    .eq("user_id", user.id)
    .gte("entry_date", startOfMonth.slice(0, 10))
    .order("entry_date", { ascending: false });

  const totalEntries = (journalData?.length || 0) + (dreamData?.length || 0) + (shadowData?.length || 0) + (cycleData?.length || 0);

  if (totalEntries < 5) {
    return NextResponse.json({
      error: "not_enough_data",
      message: lang === "pl"
        ? "Za mało danych z tego miesiąca. Potrzebuję minimum 5 wpisów łącznie."
        : "Not enough data this month. I need at least 5 entries total.",
      counts: {
        journal: journalData?.length || 0,
        dreams: dreamData?.length || 0,
        shadow: shadowData?.length || 0,
        cycle: cycleData?.length || 0,
      },
    }, { status: 400 });
  }

  // Build context
  const journalSummary = journalData?.map(e => `[${new Date(e.created_at).toLocaleDateString()}] Mood: ${e.mood || "none"}. ${(e.content || "").slice(0, 200)}`).join("\n") || "No journal entries.";

  const dreamSummary = dreamData?.map(d => `Symbols: ${(d.symbols as string[] || []).join(", ")}. Tone: ${(d.emotional_tone as string[] || []).join(", ")}. Recurring: ${d.is_recurring ? "yes" : "no"}. ${(d.content || "").slice(0, 150)}`).join("\n") || "No dreams.";

  const shadowSummary = shadowData?.map(s => `Emotions: ${(s.emotions as string[] || []).join(", ")}. ${(s.response || "").slice(0, 150)}`).join("\n") || "No shadow work.";

  const cycleSummary = cycleData?.map(c => `${c.entry_date}: Phase: ${c.cycle_phase || "none"}, Energy: ${c.energy_level || "?"}/5, Symptoms: ${(c.symptoms as string[] || []).join(", ")}`).join("\n") || "No cycle data.";

  // Count patterns
  const moodCounts: Record<string, number> = {};
  journalData?.forEach(e => { if (e.mood) moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1; });

  const emotionCounts: Record<string, number> = {};
  shadowData?.forEach(e => { (e.emotions as string[] || []).forEach((em: string) => { emotionCounts[em] = (emotionCounts[em] || 0) + 1; }); });

  const symbolCounts: Record<string, number> = {};
  dreamData?.forEach(d => { (d.symbols as string[] || []).forEach((s: string) => { symbolCounts[s] = (symbolCounts[s] || 0) + 1; }); });

  const topMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const topEmotions = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const topSymbols = Object.entries(symbolCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const reportData = {
    month: monthKey,
    counts: { journal: journalData?.length || 0, dreams: dreamData?.length || 0, shadow: shadowData?.length || 0, cycle: cycleData?.length || 0 },
    topMoods, topEmotions, topSymbols,
  };

  const sectionHeadings = lang === "pl"
    ? { overview: "CO WIDZĘ W TYM MIESIĄCU", patterns: "WZORCE", tension: "NAPIĘCIE", timing: "CZAS I RYTM" }
    : { overview: "WHAT I SEE THIS MONTH", patterns: "PATTERNS", tension: "TENSION", timing: "TIMING AND RHYTHM" };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

  const prompt = `You are a personal insight analyst for the app "Noctua" by AGNÉLIS. You read people, not data. You write the way a wise, direct woman would write a personal letter to another woman. No spiritual bypassing. No generic wellness language. Warm but honest. You see what others miss.

Write entirely in ${lang === "pl" ? "Polish" : "English"}.

This is a monthly personal report. Not a summary. Not a list. A reading. You are telling this woman what you see in her patterns this month. Be specific. Be direct. Name what she is avoiding.

Structure your response with these exact section headings on their own line in UPPERCASE:

${sectionHeadings.overview}
3 to 4 sentences. What is the overall story of this month? What is she going through underneath the surface? This is the most important part. Make her feel seen.

${sectionHeadings.patterns}
What keeps repeating? In her journal moods, her dream symbols, her shadow work emotions. Name the specific patterns. Connect them. Show her what she cannot see because she is inside it.

${sectionHeadings.tension}
This is the heart of the report. "You are doing X, but you actually need Y." Be specific. Name the gap between what she is showing the world and what is happening inside. Use her actual data. This should feel slightly uncomfortable to read.

${sectionHeadings.timing}
Where is she in her cycle? How does the lunar energy connect? Is she pushing when she should rest? Resting when she should move? Connect body rhythm to emotional patterns.

DATA:

Journal entries (${journalData?.length || 0}):
${journalSummary}

Dreams (${dreamData?.length || 0}):
${dreamSummary}

Shadow work (${shadowData?.length || 0}):
${shadowSummary}

Cycle (${cycleData?.length || 0}):
${cycleSummary}

Top moods: ${topMoods.map(([k, v]) => `${k}(${v})`).join(", ") || "none"}
Top shadow emotions: ${topEmotions.map(([k, v]) => `${k}(${v})`).join(", ") || "none"}
Top dream symbols: ${topSymbols.map(([k, v]) => `${k}(${v})`).join(", ") || "none"}

CRITICAL FORMATTING RULES:
Keep the response under 600 words. Do NOT use any markdown formatting. No asterisks. No bold. No bullet points. Never use dashes, hyphens, em dashes or en dashes anywhere in the text. Use commas and full stops only. Write section headings in UPPERCASE on their own line.`;

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
        max_tokens: 1200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Claude API error:", err);
      return NextResponse.json({ error: "Report generation failed" }, { status: 500 });
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text || "No report generated.";
    const reportText = rawText
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/—/g, ", ")
      .replace(/–/g, ", ")
      .replace(/ - /g, ", ")
      .replace(/#{1,3}\s/g, "");

    await supabase.from("smart_reports").insert({
      user_id: user.id,
      report_month: monthKey,
      report_text: reportText,
      report_data: reportData,
      language: lang,
    });

    return NextResponse.json({ report: reportText, data: reportData, cached: false });
  } catch (err) {
    console.error("Report error:", err);
    return NextResponse.json({ error: "Report generation failed" }, { status: 500 });
  }
}