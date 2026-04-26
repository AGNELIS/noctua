import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { gatherWorkbookContext } from "@/lib/workbook-context";

export async function POST(req: NextRequest) {
  const serverSupabase = await createServerClient();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Service role for writing to user_patterns (RLS: service only)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

  // Gather all user data
  const [journals, dreams, shadow] = await Promise.all([
    supabase.from("journal_entries").select("content, mood, entry_date").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    supabase.from("dream_entries").select("content, symbols, emotional_tone").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    supabase.from("shadow_work_entries").select("prompt, response, emotions").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
  ]);
  const journalText = (journals.data || []).map(j => `Mood: ${(j.mood || []).join(", ")}. ${j.content?.substring(0, 200)}`).join("\n");
  const dreamText = (dreams.data || []).map(d => `Symbols: ${(d.symbols || []).join(", ")}. ${d.content?.substring(0, 150)}`).join("\n");
  const workbookText = await gatherWorkbookContext(user.id, supabase);
  const shadowText = (shadow.data || []).map(s => `Q: ${s.prompt?.substring(0, 80)} A: ${s.response?.substring(0, 120)} Emotions: ${(s.emotions || []).join(", ")}`).join("\n");
  const prompt = `You are the pattern recognition engine for "Noctua" by AGNÉLIS. You analyse a woman's journal entries, dreams, shadow work and workbook responses to find recurring patterns in her inner world.

Your task: identify 3 to 6 distinct patterns. Each pattern has:
- type: one of "emotional", "relational", "behavioral", "avoidance", "shadow", "recurring_theme"
- description: 1 to 2 sentences describing the pattern. Full sentences that carry information, not fragments. Direct, specific, no vague language.
- keywords: 3 to 5 keywords that capture the pattern
- source: where you see this pattern most clearly (journal, dreams, workbooks, shadow_work, or multiple)

CRITICAL RULES FOR description:
Never name cycle phases by clinical label. No "follicular", no "luteal", no "folikularna", no "lutealna". Speak of the body as she would: "the bleeding days", "the inward time", "as energy returned".
Never quote energy scores as numbers. Speak of presence and absence: "low-energy days", "days when energy was full".
Never quote exact dates. Speak in rhythm: "at the beginning of the month", "within the same week", "pod koniec miesiąca".
Never invent atmosphere you cannot see in the data. Stay with what she wrote, what she tagged, what she named.
Write in correct grammar and spelling, including Polish if descriptions are generated in Polish. If you quote a word from her entries, preserve its exact form.

Respond ONLY with a JSON array. No markdown. No backticks. No explanation.

Example:
[{"type":"avoidance","description":"Consistently redirects conversations about needs into caretaking others. The pattern appears in journal entries about relationships and in shadow work responses about vulnerability.","keywords":["avoidance","needs","caretaking","vulnerability"],"source":"journal, shadow_work"},{"type":"recurring_theme","description":"Water appears in dreams whenever journal entries mention feeling overwhelmed. The connection between emotional flooding and water symbolism is consistent.","keywords":["water","overwhelm","dreams","emotions"],"source":"dreams, journal"}]

Journal entries:
${journalText || "None"}

Dreams:
${dreamText || "None"}

Workbook responses:
${workbookText || "None"}

Shadow work:
${shadowText || "None"}

Find the real patterns. Not surface observations. The things she does repeatedly without seeing it. The connections between her dreams and her daily life. The gap between what she says and what she does.`;

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
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) return NextResponse.json({ error: "AI failed" }, { status: 500 });

    const data = await res.json();
    const text = data.content?.[0]?.text || "[]";
    const clean = text.replace(/```json|```/g, "").trim();

    let patterns: any[];
    try {
      patterns = JSON.parse(clean);
    } catch {
      return NextResponse.json({ error: "Failed to parse patterns" }, { status: 500 });
    }

    // Get existing patterns
    const { data: existing } = await supabase
      .from("user_patterns")
      .select("id, pattern_type, description, keywords, frequency")
      .eq("user_id", user.id);

    const existingPatterns = existing || [];

    for (const p of patterns) {
      // Check if similar pattern already exists (by keywords overlap)
      const match = existingPatterns.find(ep => {
        const epKeywords = ep.keywords || [];
        const overlap = (p.keywords || []).filter((k: string) => epKeywords.includes(k));
        return overlap.length >= 2;
      });

      if (match) {
        // Update existing: increase frequency, update last_seen, refresh description
        await supabase.from("user_patterns").update({
          description: p.description,
          keywords: p.keywords,
          last_seen: new Date().toISOString(),
          frequency: (match.frequency || 1) + 1,
          source: p.source,
          status: "active",
        }).eq("id", match.id);
      } else {
        // Insert new pattern
        await supabase.from("user_patterns").insert({
          user_id: user.id,
          pattern_type: p.type,
          description: p.description,
          keywords: p.keywords,
          first_seen: new Date().toISOString(),
          last_seen: new Date().toISOString(),
          frequency: 1,
          status: "active",
          source: p.source,
        });
      }
    }

    return NextResponse.json({ extracted: patterns.length, updated: patterns.length });
  } catch (err) {
    return NextResponse.json({ error: "Pattern extraction failed" }, { status: 500 });
  }
}