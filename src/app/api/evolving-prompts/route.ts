import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const serverSupabase = await createServerClient();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Service role for writing notifications
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check premium
  const { data: profile } = await supabase.from("profiles").select("is_premium, is_admin").eq("id", user.id).single();
  if (!profile?.is_premium && !profile?.is_admin) return NextResponse.json({ skipped: "not premium" });

  // Check notification preferences
  const { data: prefs } = await supabase.from("notification_prefs").select("workbook_progress").eq("user_id", user.id).single();
  if (prefs && prefs.workbook_progress === false) return NextResponse.json({ skipped: "notifications disabled" });

  // Check if we already sent an evolving prompt in the last 3 days
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("type", "evolving_prompt")
    .gte("created_at", threeDaysAgo);

  if ((recentCount || 0) > 0) return NextResponse.json({ skipped: "too recent" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

  // Detect language
  const { data: langCheck } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();
  const { data: recentJournal } = await supabase.from("journal_entries").select("content").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1);
  const sampleText = recentJournal?.[0]?.content || "";
  const hasPolish = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(sampleText);
  const lang = hasPolish ? "pl" : "en";

  // Gather data
  const [journals, dreams, workbooks, shadow, patterns, entryCount] = await Promise.all([
    supabase.from("journal_entries").select("content, mood, entry_date").eq("user_id", user.id).order("created_at", { ascending: false }).limit(15),
    supabase.from("dream_entries").select("content, symbols, emotional_tone").eq("user_id", user.id).order("created_at", { ascending: false }).limit(8),
    supabase.from("workbook_progress").select("workbook_type, responses, completed_at").eq("user_id", user.id).order("started_at", { ascending: false }).limit(8),
    supabase.from("shadow_work_entries").select("prompt, response, emotions").eq("user_id", user.id).order("created_at", { ascending: false }).limit(8),
    supabase.from("user_patterns").select("pattern_type, description, keywords, frequency").eq("user_id", user.id).eq("status", "active").order("frequency", { ascending: false }).limit(6),
    supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const totalEntries = entryCount.count || 0;
  const phase = totalEntries <= 15 ? "discovery" : totalEntries <= 40 ? "deepening" : "integration";

  const journalText = (journals.data || []).map(j => `Mood: ${(j.mood || []).join(", ")}. ${j.content?.substring(0, 150)}`).join("\n");
  const dreamText = (dreams.data || []).map(d => `Symbols: ${(d.symbols || []).join(", ")}. Tone: ${(d.emotional_tone || []).join(", ")}. ${d.content?.substring(0, 100)}`).join("\n");
  const workbookText = (workbooks.data || []).map(w => {
    const resps = w.responses || [];
    const last = resps[resps.length - 1];
    return last ? `${w.workbook_type}: "${last.response?.substring(0, 120)}" AI: "${last.ai_reaction?.substring(0, 120)}"` : null;
  }).filter(Boolean).join("\n");
  const shadowText = (shadow.data || []).map(s => `Emotions: ${(s.emotions || []).join(", ")}. ${s.response?.substring(0, 100)}`).join("\n");
  const patternText = (patterns.data || []).map(p => `[${p.pattern_type}, ${p.frequency}x] ${p.description}`).join("\n");

  const phaseInstruction = phase === "discovery"
    ? "This person is early in self-work. Ask something simple and grounding. Do not assume depth."
    : phase === "deepening"
    ? "This person is seeing patterns. Reference something specific from their data. Push gently."
    : "This person knows her patterns. Do not explain. Challenge. Connect dots she has not connected.";

  const prompt = `You are Noctua, the insight engine of a deep self-work app by AGNÉLIS. You are generating ONE personal observation or question for this person, to appear as a notification that opens their journal.

${phaseInstruction}

Your output must be EXACTLY two lines, nothing else:
Line 1: A short title (max 8 words). This appears as the notification heading.
Line 2: One observation or question (1 to 3 sentences). Specific to HER data. Not generic. This becomes the journal prompt.

The question must make sense on its own. She must understand why you are asking it without needing to read her old entries. Reference the pattern or theme naturally within the question itself.

Write in ${lang === "pl" ? "Polish" : "English"}.

Journal entries:
${journalText || "None"}

Dreams:
${dreamText || "None"}

Workbook responses:
${workbookText || "None"}

Shadow work:
${shadowText || "None"}

Known patterns:
${patternText || "None yet"}

Phase: ${phase} (${totalEntries} entries)

CRITICAL RULES:
No markdown. No asterisks. No bold. No dashes or em dashes. No greetings. No "Dear" or "Droga". Do not use the word "journey". Do not give advice. Only two lines. Title and question.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) return NextResponse.json({ error: "AI failed" }, { status: 500 });

    const data = await res.json();
    const text = (data.content?.[0]?.text || "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/—/g, ", ")
      .replace(/–/g, ", ");

    const lines = text.split("\n").filter((l: string) => l.trim());
    if (lines.length < 2) return NextResponse.json({ error: "Invalid AI response" }, { status: 500 });

    const title = lines[0].trim();
    const body = lines.slice(1).join(" ").trim();

    // Save as notification with journal link + prompt
    const encodedPrompt = encodeURIComponent(body);
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "evolving_prompt",
      title_en: lang === "en" ? title : title,
      title_pl: lang === "pl" ? title : title,
      body_en: lang === "en" ? body : body,
      body_pl: lang === "pl" ? body : body,
      link: `/journal/new?prompt=${encodedPrompt}`,
    });

    return NextResponse.json({ sent: true, title, body });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}