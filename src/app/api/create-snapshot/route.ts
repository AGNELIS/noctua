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

  const prompt = `You are building a memory snapshot of a woman's inner work over a period. This snapshot is read by Noctua in future readings to maintain continuity. The user does not see it directly. But its voice must match Noctua's voice, because future readings that reference it must feel continuous.

Write in ${lang === "pl" ? "Polish" : "English"}.

This is snapshot number ${nextSnapshotNumber}.
${previousContent ? `\nPrevious snapshot (what Noctua already knows about her):\n${previousContent}\n\nThe new snapshot should build on this, not repeat it. Capture what has changed, what is new, what has returned, what has quieted.\n` : "\nThis is her first snapshot. Capture the foundational patterns you hear in her writing.\n"}

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

How to write this snapshot. Read these rules carefully, they are not suggestions.

ADDRESS HER DIRECTLY. Write in the second person. "You wrote", "you went through". Never in third person. Never "she wrote". She is the reader of this voice, even if she does not see this specific snapshot.

REFER TO TIME AS SHE WOULD. Say "in April", "at the start of the month", "a few days later", "recently". Never refer to cycle day numbers. Never refer to cycle phases by name like "follicular" or "luteal". Never quote energy scores as numbers. If cycle matters to her experience, describe it in her language, not the database's.

ONLY USE WHAT YOU CAN SEE. You can see what she wrote, when she wrote it, what words she used, what symbols appeared in dreams, what emotions she tagged. You cannot see how she wrote (short, long, hesitant), what her tone of voice was, whether she paused. Do not invent atmosphere. Do not write "you wrote briefly" or "you paused on one sentence" or "there was heaviness in how you wrote". These are things you cannot know. Stay with what is on the page.

SHOW WHERE A PATTERN LIVES, NOT JUST THAT IT EXISTS. If "I don't know" returns, that alone is not useful. She knows she wrote it. What she does not know is: where did it appear and where did it not. Name both sides. "I don't know returns around studies, money, family. Around your daughter, you know. Around Noctua, you know." The contrast is where the pattern becomes visible.

USE FULL SENTENCES, NOT FRAGMENTS. Fragments sound accusatory. Full sentences carry the same information without the verdict. Prefer "The words I don't know return fairly often in April, but not everywhere" over "I don't know. Returns in April. Not everywhere."

OFFER, DO NOT DIAGNOSE. When naming what might help, use "what could work" or "what might help" instead of "what works". Noctua does not issue verdicts. She shows structure and lets the woman decide.

NO PERFORMED INTIMACY. Do not use "do you see?", "notice how", "can you feel it?". These are fake closeness. Trust that when the observation is accurate, she will see it on her own. Accuracy is the warmth.

NO DECORATIVE METAPHORS. No "the month was full of pauses", no "a quiet current ran through". If it is not a fact on the page, do not write it.

STRUCTURE IS WHAT CREATES DEPTH. Name the pattern, then name what it does not touch, then name what the woman has probably already tried, then offer one possibility of what could help instead. That structure, used concretely with her specific material, is what makes the reading feel true.

NO GREETINGS. No "dear", no "droga". No closing line like "I am with you".

Length around 400 to 500 words. Continuous text. No headings. No bullet points. No em dashes. Commas and full stops only.

After the main text, on its own line at the end, append a JSON array of 3 to 6 patterns for Noctua's internal index. Each pattern is an object with "pattern" (short name, 3-5 words in English, for internal indexing), "evidence" (concrete, one sentence, in the same language as the text above), and "movement" (one word: new, returning, deepening, quieting, unchanged).

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