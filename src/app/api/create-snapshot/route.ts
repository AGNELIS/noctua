import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { gatherWorkbookContext } from "@/lib/workbook-context";
import { NOCTUA_VOICE_SYSTEM_PROMPT } from "@/lib/noctua-voice";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Optional: admin can create snapshot for another user via body param
  const body = await req.json().catch(() => ({}));
  const targetUserId = body.target_user_id as string | undefined;

  let actualUserId = user.id;
  if (targetUserId && targetUserId !== user.id) {
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Only admin can create snapshots for other users" }, { status: 403 });
    }
    actualUserId = targetUserId;
  }

  // Load target user language preference
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("preferred_language")
    .eq("id", actualUserId)
    .single();

  const lang = targetProfile?.preferred_language === "pl" ? "pl" : "en";

  // Find the last snapshot (if any) to determine period_start
  const { data: lastSnapshot } = await supabase
    .from("ai_memory_snapshots")
    .select("snapshot_number, period_end, content")
    .eq("user_id", actualUserId)
    .order("snapshot_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const periodStart = lastSnapshot?.period_end
    ? new Date(lastSnapshot.period_end).toISOString()
    : new Date(0).toISOString();

  const periodEnd = new Date().toISOString();
  const nextSnapshotNumber = (lastSnapshot?.snapshot_number || 0) + 1;
  const previousContent = lastSnapshot?.content || "";

  // Load all user data from the period
  const [
    { data: journals },
    { data: dreams },
    { data: shadow },
    { data: cycle },
  ] = await Promise.all([
    supabase.from("journal_entries")
      .select("content, mood, entry_date, created_at")
      .eq("user_id", actualUserId)
      .gte("created_at", periodStart)
      .lt("created_at", periodEnd)
      .order("created_at", { ascending: true }),
    supabase.from("dream_entries")
      .select("title, content, symbols, emotional_tone, is_recurring, dream_date, created_at")
      .eq("user_id", actualUserId)
      .gte("created_at", periodStart)
      .lt("created_at", periodEnd)
      .order("created_at", { ascending: true }),
    supabase.from("shadow_work_entries")
      .select("prompt, response, emotions, created_at")
      .eq("user_id", actualUserId)
      .gte("created_at", periodStart)
      .lt("created_at", periodEnd)
      .order("created_at", { ascending: true }),
    supabase.from("cycle_entries")
      .select("cycle_phase, symptoms, energy_level, entry_date")
      .eq("user_id", actualUserId)
      .gte("entry_date", periodStart.slice(0, 10))
      .lt("entry_date", periodEnd.slice(0, 10))
      .order("entry_date", { ascending: true }),
  ]);

  const entryCount = (journals?.length || 0) + (dreams?.length || 0) + (shadow?.length || 0);

  if (entryCount === 0 && !previousContent) {
    return NextResponse.json({
      error: "No data to snapshot",
      message: "User has no entries in this period and no previous snapshot to build upon.",
    }, { status: 400 });
  }

  // Total entries across all time (for context)
  const [{ count: totalJ }, { count: totalD }, { count: totalS }] = await Promise.all([
    supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", actualUserId),
    supabase.from("dream_entries").select("id", { count: "exact", head: true }).eq("user_id", actualUserId),
    supabase.from("shadow_work_entries").select("id", { count: "exact", head: true }).eq("user_id", actualUserId),
  ]);
  const cumulativeCount = (totalJ || 0) + (totalD || 0) + (totalS || 0);

  // Workbook context
  const workbookContext = await gatherWorkbookContext(actualUserId, supabase);

  // Format data for AI
  const journalText = (journals || []).map(j => 
    `[${j.entry_date}] Mood: ${(j.mood || []).join(", ") || "none"}. "${(j.content || "").slice(0, 600)}"`
  ).join("\n\n") || "No journal entries in this period.";

  const dreamText = (dreams || []).map(d => 
    `[${d.dream_date || d.created_at?.slice(0, 10)}] "${d.title || "Untitled"}". Emotions: ${(d.emotional_tone || []).join(", ") || "none"}. Symbols: ${(d.symbols || []).join(", ") || "none"}. Content: "${(d.content || "").slice(0, 500)}"`
  ).join("\n\n") || "No dreams in this period.";

  const shadowText = (shadow || []).map(s => 
    `[${s.created_at?.slice(0, 10)}] Prompt: "${s.prompt}". She wrote: "${(s.response || "").slice(0, 600)}". Emotions: ${(s.emotions || []).join(", ") || "none"}`
  ).join("\n\n") || "No shadow work in this period.";

  const cycleText = (cycle || []).map(c => 
    `[${c.entry_date}] Phase: ${c.cycle_phase || "unspecified"}. Symptoms: ${(c.symptoms || []).join(", ") || "none"}. Energy: ${c.energy_level || "unrecorded"}`
  ).join("\n") || "No cycle entries in this period.";

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

  const prompt = `You are a perceptive, grounded reader of inner patterns.
You are not a therapist, not a fortune teller.
You speak directly, warmly, and without flattery.

The user has shared entries from her journal, dream log, shadow work, cycle tracking, and workbook responses (shadow work, dream integration, cycle alignment, and planetary workbooks including Moon, Saturn, Pluto, Chiron, Lilith, and Lunar Nodes).

Write in ${lang === "pl" ? "Polish" : "English"}.

Your task is to identify recurring emotional, behavioural, and symbolic patterns across these sources and present them as a unified reading.

This is snapshot number ${nextSnapshotNumber}.
${previousContent ? `\nPrevious snapshot exists. It is what you already know about her. Build on it. Do not repeat it.\n\n${previousContent}\n` : "\nThis is her first snapshot.\n"}

Entries in this period: ${entryCount}

What she wrote in this period:

Journal entries:
${journalText}

Dreams:
${dreamText}

Shadow work:
${shadowText}

Cycle entries:
${cycleText}

${workbookContext ? `\nWorkbook activity:\n${workbookContext}\n` : ""}

Rules:
- Use second person ("You", "Your").
- Reference specific words, images or phrases from her actual entries when possible. This makes it feel true, not generic.
- Do not over-explain. Do not get lost in details. Do not write in short fragments separated by full stops as if listing. Write in full sentences that carry information. Trust her to feel the meaning.
- If something is uncomfortable, name it clearly without softening, without decoration.
- Only use what you can see. You can see what she wrote, when she wrote it, what words she used, what symbols appeared in dreams, what emotions she tagged. You cannot see how she wrote, whether she paused, her tone of voice. Do not invent atmosphere. Do not write things like "you wrote briefly" or "there was heaviness in how you wrote" or "you paused". These are things you cannot know. Stay with what is on the page.
- Refer to time as she would. Say "in April", "at the start of the month", "a few days later". Never refer to exact dates like "the 5th of April". Never refer to cycle phases by name like "follicular" or "luteal". Never quote energy scores as numbers.
- When naming what might help, use "what could help" or "what might work". Do not diagnose. Do not issue verdicts. Show structure. Let her decide.
- No performed intimacy. No "do you see?", "notice how", "can you feel it?". When the observation is accurate, she will see it on her own.
- No greetings. No "dear", no "droga". No closing line like "I am with you".

Structure your response in these sections, each with its heading on its own line in the language you are writing in:

${lang === "pl" ? "Co wraca" : "What keeps returning"}
Patterns that appear more than once across her entries. Name where they appear. Name where they do not.

${lang === "pl" ? "Wokół czego krążysz, czego nie dotykasz" : "What you're circling but not touching"}
Themes that are hinted at but never fully faced. What she writes around. What she does not write about.

${lang === "pl" ? "Co cicho się przesuwa" : "What is quietly shifting"}
Subtle changes in tone, language, or perspective over time. What is slightly different from before.

${lang === "pl" ? "Wątek pod spodem" : "The thread underneath"}
One core pattern that connects everything. Name it simply and precisely.

End with one short sentence. Not advice. Just a reflection.

After the reading, on its own line at the end, append a JSON array of 3 to 6 patterns for Noctua's internal pattern index. Each pattern is an object with "pattern" (short name, 3-5 words in English, for internal indexing), "evidence" (concrete, one sentence, in the same language as the reading above), and "movement" (one word: new, returning, deepening, quieting, unchanged).

Format exactly like this, nothing after:

PATTERNS_JSON:[{"pattern":"...","evidence":"...","movement":"..."}]`;

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
        max_tokens: 1500,
        system: NOCTUA_VOICE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Snapshot generation error:", err);
      return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text || "";

    // Extract PATTERNS_JSON
    let patterns: unknown[] = [];
    const patternsMatch = rawText.match(/PATTERNS_JSON:(\[[\s\S]*?\])/);
    if (patternsMatch) {
      try {
        patterns = JSON.parse(patternsMatch[1]);
      } catch (e) {
        console.warn("Could not parse PATTERNS_JSON:", e);
      }
    }

    // Clean the text: remove PATTERNS_JSON line, normalise
    const cleanContent = rawText
      .replace(/PATTERNS_JSON:[\s\S]*$/, "")
      .trim()
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/—/g, ", ")
      .replace(/–/g, ", ");

    // Save to database (use service role to bypass RLS for insert)
    const { data: inserted, error: insertError } = await supabase
      .from("ai_memory_snapshots")
      .insert({
        user_id: actualUserId,
        snapshot_number: nextSnapshotNumber,
        period_start: periodStart,
        period_end: periodEnd,
        entry_count_in_period: entryCount,
        cumulative_entry_count: cumulativeCount,
        content: cleanContent,
        key_patterns: patterns,
        version: 1,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Snapshot insert error:", insertError);
      return NextResponse.json({ error: "Database insert failed", details: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      snapshot: inserted,
      patterns,
    });
  } catch (err) {
    console.error("Snapshot error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}