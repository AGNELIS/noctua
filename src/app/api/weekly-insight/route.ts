import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { gatherWorkbookContext } from "@/lib/workbook-context";
import { getUserMemory } from "@/lib/memory-context";
import { NOCTUA_VOICE_SYSTEM_PROMPT } from "@/lib/noctua-voice";
import { getEffectivePerms } from "@/lib/effective-perms";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_premium, is_admin, admin_test_mode, preferred_language")
    .eq("id", user.id)
    .single();
  const { isAdmin } = getEffectivePerms(profile);

  // Access check: everyone (free and premium) needs to have purchased a Reflection credit
  // Admin bypasses this for testing
  if (!isAdmin) {
    const { data: product } = await supabase
      .from("shop_products")
      .select("id")
      .eq("name", "Reflection")
      .maybeSingle();

    if (!product) {
      return NextResponse.json({ error: "Reflection product not found" }, { status: 500 });
    }

    const { data: credit } = await supabase
      .from("user_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .is("used_at", null)
      .limit(1);

    if (!credit || credit.length === 0) {
      return NextResponse.json({
        error: "purchase_required",
        message: "A Reflection credit is required to generate a reading.",
      }, { status: 403 });
    }
  }

  const lang = profile?.preferred_language === "pl" ? "pl" : "en";

  const now = new Date();

  // Find the date of her last Reflection (to count entries added since then)
  const { data: lastReflection } = await supabase
    .from("weekly_insights")
    .select("created_at, snapshot_number_at_generation")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sinceDate = lastReflection?.created_at
    ? lastReflection.created_at
    : new Date(0).toISOString();

  // Gather data since her last Reflection (not last 7 days)
  const { data: journals } = await supabase
    .from("journal_entries")
    .select("content, mood, entry_date")
    .eq("user_id", user.id)
    .gte("created_at", sinceDate)
    .order("created_at", { ascending: false });

  const { data: dreams } = await supabase
    .from("dream_entries")
    .select("title, content, emotional_tone, symbols, dream_date, created_at")
    .eq("user_id", user.id)
    .gte("created_at", sinceDate)
    .order("created_at", { ascending: false });

  const { data: shadowEntries } = await supabase
    .from("shadow_work_entries")
    .select("prompt, response, emotions, created_at")
    .eq("user_id", user.id)
    .gte("created_at", sinceDate)
    .order("created_at", { ascending: false });

  // Count entries since her last Reflection (not total, not per-week)
  const entriesSinceLastReflection = (journals?.length || 0) + (dreams?.length || 0) + (shadowEntries?.length || 0);
  const GATE = 5;

  // Gate 1: minimum 5 entries since last Reflection (or 5 total if no previous Reflection)
  // Admin bypasses this for testing
  if (!isAdmin && entriesSinceLastReflection < GATE) {
    return NextResponse.json({
      error: "not_enough_entries",
      message: lang === "pl"
        ? `Refleksja potrzebuje co najmniej ${GATE} wpisów od ostatniej Refleksji. Masz teraz ${entriesSinceLastReflection}.`
        : `A Reflection needs at least ${GATE} entries since your last Reflection. You have ${entriesSinceLastReflection}.`,
      current: entriesSinceLastReflection,
      required: GATE,
    }, { status: 400 });
  }

  // Gate 2: snapshot-gate (cumulative memory)
  // Get current snapshot number to compare with the one saved at the last Reflection
  const { data: latestSnapshot } = await supabase
    .from("ai_memory_snapshots")
    .select("snapshot_number")
    .eq("user_id", user.id)
    .order("snapshot_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const currentSnapshotNumber = latestSnapshot?.snapshot_number || 0;
  const lastReflectionSnapshotNumber = lastReflection?.snapshot_number_at_generation;

  if (
    !isAdmin &&
    lastReflectionSnapshotNumber !== null &&
    lastReflectionSnapshotNumber !== undefined &&
    lastReflectionSnapshotNumber >= currentSnapshotNumber
  ) {
    return NextResponse.json({
      error: "no_new_snapshot",
      message: lang === "pl"
        ? "Noctua nie widzi jeszcze nowego materiału od ostatniej Refleksji. Pisz dalej, a kolejna Refleksja będzie głębsza."
        : "Noctua has not yet gathered new material since your last Reflection. Write more, and the next one will be deeper.",
      current_snapshot: currentSnapshotNumber,
      last_reflection_snapshot: lastReflectionSnapshotNumber,
    }, { status: 400 });
  }

  const journalSummary = (journals || []).map(j => `[${j.entry_date}] Mood: ${(j.mood || []).join(", ")}. Wrote: "${(j.content || "").slice(0, 800)}"`).join("\n\n");
  const dreamSummary = (dreams || []).map(d => `[${d.dream_date || d.created_at?.slice(0, 10) || "unknown date"}] Dream "${d.title || "Untitled"}". Emotions: ${(d.emotional_tone || []).join(", ")}. Symbols: ${(d.symbols || []).join(", ")}. Content: "${(d.content || "").slice(0, 800)}"`).join("\n\n");
  const shadowSummary = (shadowEntries || []).map(s => `[${s.created_at?.slice(0, 10) || "unknown date"}] Prompt: "${s.prompt}". She wrote: "${(s.response || "").slice(0, 800)}". Emotions: ${(s.emotions || []).join(", ")}`).join("\n\n");

  // Workbook context: self-work + planetary workbooks (via shared helper)
  const workbookInsights = await gatherWorkbookContext(user.id, supabase);

  // Cumulative memory snapshot (Noctua's continuous knowledge of this user)
  const memory = await getUserMemory(user.id, supabase);
  const memoryContext = memory.lastSnapshotContent
    ? `CONTINUITY FROM HER CUMULATIVE MEMORY:
This is what Noctua has already seen about her across ${memory.lastSnapshotNumber} previous snapshot${memory.lastSnapshotNumber === 1 ? "" : "s"} of her inner work. Treat this as what you already know. Build on it. Do not repeat it.

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

  const prompt = `This is a Reflection. A short, grounded reading of the material she has put down since her last Reflection. You reflect her own words back to her without diagnosing or philosophising.

Write in ${lang === "pl" ? "Polish" : "English"}.

${memoryContext}CRITICAL VOICE RULES:
Never name cycle phases by clinical label. No "follicular", no "luteal", no "folikularna", no "lutealna". Speak of the body as she would: "when you were bleeding", "as your energy was returning", "the inward time".
Never quote energy scores as numbers. No "energy level 4 of 5". Instead: "a day when energy was present", "the low-energy days".
Never quote exact dates. Do not write "3 April" or "15 kwietnia". Speak in rhythm: "at the beginning", "within the same few days", "twice in close succession", "pod koniec tego okresu". Sequence and frequency matter, specific calendar dates do not.
Never invent atmosphere you cannot see in the data. You see what she wrote, what words she used, what symbols appeared, what emotions she tagged. You do not see how she wrote, whether she paused, her tone. Do not write "you wrote briefly", "there was heaviness in your voice", "you held back". Stay with what is on the page.
Write in correct Polish grammar and spelling. If you quote or paraphrase a word from her entries, preserve its exact form (for example: do not write "mania" when she wrote "mama").

What she wrote since her last Reflection:

Journal entries:
${journalSummary || "None."}

Dreams:
${dreamSummary || "None."}

Shadow work:
${shadowSummary || "None."}

${workbookInsights ? `\n${workbookInsights}\n` : ""}${patternContext ? `\nPatterns Noctua has noticed earlier:\n${patternContext}\nIf any of these show up in this material, reference them concretely.\n` : ""}

How to write this reading:

Quote or paraphrase her own specific words. Name what appeared together. Not interpretations. Observations of what co-occurred. "When you wrote X, you also dreamed Y."

Do not philosophise. Do not write aphorisms. Do not say things like "sometimes what is absent is most meaningful" or "silence speaks louder than words." No poetry. No wellness-speak.

Do not diagnose. Do not tell her what her pattern means. Name what happened, using her own language. She draws conclusions herself.

Three or four short flowing paragraphs. Under 350 words. No headings, no lists, no markdown, no em dashes.

The last line is short and concrete. It names something specific that stays with her. Not a command, not a call to action, not an aphorism. A single observation about what she actually wrote or dreamed or worked on.`;

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

    // Save to DB with current snapshot number (for snapshot-gate on next Reflection)
    await supabase.from("weekly_insights").insert({
      user_id: user.id,
      insight_text: insightText,
      week_start: new Date().toISOString().split("T")[0],
      snapshot_number_at_generation: currentSnapshotNumber,
    });

    // Use credit (everyone pays except admin)
    if (!isAdmin) {
      const { data: product } = await supabase.from("shop_products").select("id").eq("name", "Reflection").maybeSingle();
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