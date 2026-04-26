import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { gatherWorkbookContext } from "@/lib/workbook-context";
import { getUserMemory } from "@/lib/memory-context";
import { getEffectivePerms } from "@/lib/effective-perms";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { language: userLang, reading_type: readingTypeRaw } = await req.json();
  const lang = userLang === "pl" ? "pl" : "en";
  const readingType = readingTypeRaw === "pattern" ? "pattern" : "monthly";

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Count entries since last reading
  const { data: lastReport } = await supabase
    .from("smart_reports")
    .select("created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const sinceDate = lastReport && lastReport.length > 0
    ? lastReport[0].created_at
    : new Date(0).toISOString();

  const { count: jSince } = await supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", sinceDate);
  const { count: dSince } = await supabase.from("dream_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", sinceDate);
  const { count: sSince } = await supabase.from("shadow_work_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", sinceDate);
  const { count: cSince } = await supabase.from("cycle_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", sinceDate);

  const totalSinceLastReading = (jSince || 0) + (dSince || 0) + (sSince || 0) + (cSince || 0);
  const { data: adminProfile } = await supabase.from("profiles").select("is_admin, is_premium, admin_test_mode").eq("id", user.id).single();
  const { isAdmin, isPremium } = getEffectivePerms(adminProfile);

  if (!isAdmin && !isPremium) {
    // Check if user has a purchased report credit
    const { data: reportProduct } = await supabase.from("shop_products").select("id").eq("name", "Full Reading").single();
    if (reportProduct) {
      const { data: credit } = await supabase.from("user_purchases").select("id").eq("user_id", user.id).eq("product_id", reportProduct.id).is("used_at", null).limit(1);
      if (!credit || credit.length === 0) {
        return NextResponse.json({
          error: "no_access",
          message: lang === "pl"
            ? "Odczyty są dostępne dla użytkowników Premium lub jako jednorazowy zakup w sklepie."
            : "Readings are available for Premium subscribers or as a single purchase in the shop.",
        }, { status: 403 });
      }
    }
  }
  const reportType = totalSinceLastReading >= 15 ? "full" : "mid";

  // Gate: 15 entries total across all sources (journal + dreams + shadow_work)
  // Cycle entries do not count toward the gate because Full Reading is about depth of written work
  const [{ count: totalJ }, { count: totalD }, { count: totalS }] = await Promise.all([
    supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("dream_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("shadow_work_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);
  const totalEntriesAllTime = (totalJ || 0) + (totalD || 0) + (totalS || 0);
  const GATE = 15;

  if (!isAdmin && totalEntriesAllTime < GATE) {
    return NextResponse.json({
      error: "not_enough_entries",
      message: lang === "pl"
        ? `Pełen odczyt potrzebuje co najmniej ${GATE} wpisów w sumie, żeby Noctua miała z czego czytać. Masz teraz ${totalEntriesAllTime}. Refleksja jest dostępna już po 5 wpisach.`
        : `A Full Reading needs at least ${GATE} entries in total, so Noctua has something to read from. You have ${totalEntriesAllTime}. Reflection is available after 5 entries.`,
      current: totalEntriesAllTime,
      required: GATE,
    }, { status: 400 });
  }

  // Snapshot-gate: a reading can only be generated when there is new cumulative knowledge since the last reading of the same type
  // Admin bypasses this gate (for testing and personal use)
  const { data: latestSnapshot } = await supabase
    .from("ai_memory_snapshots")
    .select("snapshot_number")
    .eq("user_id", user.id)
    .order("snapshot_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const currentSnapshotNumber = latestSnapshot?.snapshot_number || 0;

  const { data: lastReportOfSameType } = await supabase
    .from("smart_reports")
    .select("snapshot_number_at_generation, created_at")
    .eq("user_id", user.id)
    .eq("reading_type", readingType)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastReportSnapshotNumber = lastReportOfSameType?.snapshot_number_at_generation;

  if (!isAdmin && lastReportSnapshotNumber !== null && lastReportSnapshotNumber !== undefined && lastReportSnapshotNumber >= currentSnapshotNumber) {
    return NextResponse.json({
      error: "no_new_snapshot",
      message: lang === "pl"
        ? "Noctua nie widzi jeszcze nowego materiału od ostatniego odczytu. Pisz dalej, a kolejny odczyt będzie głębszy."
        : "Noctua has not yet gathered new material since your last reading. Write more, and the next reading will be deeper.",
      current_snapshot: currentSnapshotNumber,
      last_report_snapshot: lastReportSnapshotNumber,
    }, { status: 400 });
  }

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

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

  // Workbook context: self-work + planetary workbooks (via shared helper)
  const workbookInsights = await gatherWorkbookContext(user.id, supabase);

  // Cumulative memory snapshot (Noctua's continuous knowledge of this user)
  const memory = await getUserMemory(user.id, supabase);
  const snapshotNumber = memory.lastSnapshotNumber || 0;

  const memoryContext = memory.lastSnapshotContent
    ? `CONTINUITY FROM HER CUMULATIVE MEMORY:
This is what Noctua has already seen about her across ${snapshotNumber} previous snapshot${snapshotNumber === 1 ? "" : "s"} of her inner work. Treat this as what you already know. Build on it. Do not repeat it. Name what is returning, what is deepening, what has shifted since.

${memory.lastSnapshotContent}

`
    : "";

  // Length guidance scales with cumulative memory depth
  // More snapshots means more accumulated context, so a longer, deeper reading is warranted
  let lengthGuidance: string;
  if (snapshotNumber === 0) lengthGuidance = "200 to 400 words";
  else if (snapshotNumber <= 2) lengthGuidance = "400 to 700 words";
  else if (snapshotNumber <= 5) lengthGuidance = "700 to 1000 words";
  else lengthGuidance = "1000 to 1500 words";

  // Historical patterns Noctua has tracked over time
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

  // Load recent Reflections to provide continuity for the Full Reading
  const { data: recentReflections } = await supabase
    .from("weekly_insights")
    .select("insight_text, week_start, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);

  const reflectionContext = (recentReflections && recentReflections.length > 0)
    ? recentReflections.map(r => `[${r.week_start || r.created_at?.slice(0, 10)}] ${(r.insight_text || "").slice(0, 600)}`).join("\n\n")
    : "";

  // Load previous Pattern Readings with user's reflection responses
  // Only relevant when generating a Pattern Reading (continuity between readings)
  const { data: previousPatterns } = await supabase
    .from("smart_reports")
    .select("report_text, reflection_response, created_at")
    .eq("user_id", user.id)
    .eq("reading_type", "pattern")
    .order("created_at", { ascending: false })
    .limit(3);

  const patternReadingContext = (previousPatterns && previousPatterns.length > 0)
    ? previousPatterns.map(p => {
        const dateLabel = p.created_at?.slice(0, 10) || "earlier";
        const reportExcerpt = (p.report_text || "").slice(0, 700);
        const response = p.reflection_response
          ? `\nHer reflection afterwards: "${p.reflection_response.slice(0, 400)}"`
          : "";
        return `[${dateLabel}] ${reportExcerpt}${response}`;
      }).join("\n\n")
    : "";

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
    ? { overview: "Co widzę w tym miesiącu", patterns: "Wzorce", tension: "Napięcie", timing: "Czas i rytm" }
    : { overview: "What I see this month", patterns: "Patterns", tension: "Tension", timing: "Timing and rhythm" };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

  const fullPrompt = `You are a personal insight analyst for the app "Noctua" by AGNÉLIS. You read patterns, not lives. You write the way a wise, perceptive woman would observe another woman's inner world. No spiritual bypassing. No generic wellness language. Warm but honest. You see what others miss.

Write entirely in ${lang === "pl" ? "Polish" : "English"}.

This is a monthly personal reading. Not a summary. Not advice. A mirror. You describe what you see in her patterns. You do not tell her what to do. You do not give life advice. You do not mention specific people, children, relationships, or work situations by name even if they appear in her entries. You do not tell her what can or cannot wait. You observe the emotional landscape, not the practical one.

CRITICAL SAFETY RULES:
Never suggest neglecting children, dependents, or basic needs like eating and sleeping.
Never assume you know someone's life circumstances, support system, or responsibilities.
Never use "Droga" or "Dear" or any term of address. Write in second person but without greetings.
Your role is to name patterns and tensions, not to prescribe solutions.

${memoryContext}CRITICAL VOICE RULES:
Never name cycle phases by clinical label. No "follicular", no "luteal", no "menstrual phase", no "folikularna", no "lutealna". Speak of the body as she would: "when you were bleeding", "as your energy was returning", "the inward time".
Never quote energy scores as numbers. No "energy level 4 of 5". Instead: "a day when energy was present", "the low-energy days".
Never invent atmosphere you cannot see in the data. You see what she wrote, what words she used, what symbols appeared, what emotions she tagged. You do not see how she wrote, whether she paused, her tone, her facial expression. Do not write "you wrote briefly", "there was heaviness in your voice", "you held back". Stay with what is on the page.
Write in correct Polish grammar and spelling. If you quote or paraphrase a word from her entries, preserve its exact form (for example: do not write "mania" when she wrote "mama").

Structure your response with these exact section headings on their own line. Write them in Title Case, not uppercase:

${sectionHeadings.overview}
3 to 4 sentences. What is the emotional story of this month? What is she going through underneath the surface? Describe the inner landscape, not external events.

${sectionHeadings.patterns}
What keeps repeating? In her journal moods, her dream symbols, her shadow work emotions. Name the specific patterns. Connect them. Show her what she cannot see because she is inside it.

${sectionHeadings.tension}
This is the heart of the reading. Name the tension between what she feels and what she shows. Be specific about the emotional gap. Do not give advice about what she should do differently. Simply name what is there.

${sectionHeadings.timing}
Describe where she is in her body's rhythm without using clinical names for cycle phases and without quoting energy levels as numbers. Say "when the body was inward" not "during the luteal phase". Say "the days when energy was low" not "on days with energy 2 out of 5". Describe the rhythm, not what she should do about it.

${reflectionContext ? `CONTINUITY FROM HER RECENT REFLECTIONS:
These are the last short readings Noctua wrote for her. Use them as context. If patterns from them are returning this month, name that. If something has shifted since those readings, name that. Do not repeat them verbatim, but treat them as the voice she has already heard from Noctua. Your Full Reading is a deeper, slower look at what those Reflections were pointing toward.

${reflectionContext}

` : ""}DATA:
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
Keep the response within ${lengthGuidance}. Do NOT use any markdown formatting. No asterisks. No bold. No bullet points. Never use dashes, hyphens, em dashes or en dashes anywhere in the text. Use commas and full stops only. Write section headings in Title Case on their own line. Never use the word "Droga" or "Dear" or any greeting.`;

  const patternPrompt = `This is a Pattern Reading. A different kind of reading from the Full Reading. You are not describing her month. You are naming what repeats in her material. Forensic, concrete, specific.

Write in ${lang === "pl" ? "Polish" : "English"}.

${memoryContext}
CRITICAL VOICE RULES:
Never name cycle phases by clinical label. No "follicular", no "luteal", no "menstrual phase", no "folikularna", no "lutealna". Speak of the body as she would: "when you were bleeding", "as your energy was returning", "the inward time".
Never quote energy scores as numbers. No "energy level 4 of 5". Instead: "a day when energy was present", "the low-energy days".
Never quote exact dates. Do not write "3 April" or "15 kwietnia". Speak in rhythm: "at the beginning of the month", "within the same week", "three times in close succession", "pod koniec miesiąca". Sequence and frequency matter, specific calendar dates do not.
Never invent atmosphere you cannot see in the data. You see what she wrote, what words she used, what symbols appeared, what emotions she tagged. You do not see how she wrote, whether she paused, her tone, her facial expression. Do not write "you wrote briefly", "there was heaviness in your voice", "you held back". Stay with what is on the page.
Write in correct Polish grammar and spelling. If you quote or paraphrase a word from her entries, preserve its exact form (for example: do not write "mania" when she wrote "mama").

Your task: identify the three strongest patterns that recur across her journal entries, dreams, shadow work and cycle entries. For each pattern, give concrete evidence in her own words, and show what co-occurs with it in time and theme.

Structure:

Pattern One.
Name the most dominant pattern that repeats. Be concrete. Quote or paraphrase her specific words. Describe when things returned in terms of rhythm and sequence, not exact dates. Example: "Three times across the month you wrote 'I do not know' in your journal. First at the beginning, then twice within a week in the middle. On one of those middle days you also recorded a dream of looking through a small window."

Pattern Two.
Name the second pattern. Same rules. Specific, dated, quoted.

Pattern Three.
Name the third pattern. Same rules.

Then in one short paragraph, name one thing these three patterns have in common. What connects them. Not as interpretation. As observation of what co-occurs. Example: "All three appear more strongly in the first half of your cycle than in the second."

End with exactly this question, on its own line, nothing else:
${lang === "pl" ? "Co porusza się w Tobie po przeczytaniu tego?" : "What moves in you after reading this?"}

${reflectionContext ? `Recent Reflections from Noctua for context:\n${reflectionContext}\n\n` : ""}${patternReadingContext ? `Her previous Pattern Readings and her responses to them:\n${patternReadingContext}\n\nIf patterns you see now were also named in previous Pattern Readings, say so concretely. If her reflection responses reveal something about how she relates to these patterns, use that knowledge without quoting her back to herself.\n\n` : ""}${workbookInsights ? `${workbookInsights}\n\n` : ""}${patternContext ? `Patterns Noctua has tracked historically: ${patternContext}\n\n` : ""}

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
Keep the response under 500 words. No markdown. No asterisks. No bullet points. Never use dashes or em dashes. Use commas and full stops only. Section labels "Pattern One.", "Pattern Two.", "Pattern Three." on their own lines. Never use "Dear" or "Droga" or any greeting. Do not add a closing paragraph. The question at the end is the final line.`;

  const prompt = readingType === "pattern" ? patternPrompt : fullPrompt;

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
      report_month: `${monthKey}-${reportType}`,
      report_text: reportText,
      report_data: readingType === "pattern" ? null : reportData,
      language: lang,
      reading_type: readingType,
      snapshot_number_at_generation: currentSnapshotNumber,
    });

    // Use report credit if not premium
    if (!isAdmin && !isPremium) {
      const { data: reportProduct } = await supabase.from("shop_products").select("id").eq("name", "Full Reading").single();
      if (reportProduct) {
        const { data: credit } = await supabase.from("user_purchases").select("id").eq("user_id", user.id).eq("product_id", reportProduct.id).is("used_at", null).limit(1);
        if (credit && credit.length > 0) {
          await supabase.from("user_purchases").update({ used_at: new Date().toISOString() }).eq("id", credit[0].id);
        }
      }
    }

    // Notify user
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "report_ready",
      title_en: reportType === "full" ? "Your full monthly reading is ready" : "Your mid-month reading is ready",
      title_pl: reportType === "full" ? "Twój pełny odczyt miesięczny jest gotowy" : "Twój odczyt połowy miesiąca jest gotowy",
      body_en: "Open it to see what patterns emerged this month.",
      body_pl: "Otwórz, żeby zobaczyć jakie wzorce pojawiły się w tym miesiącu.",
      link: "/reports",
    });

    return NextResponse.json({ report: reportText, data: reportData, reportType, cached: false });
  } catch (err) {
    console.error("Report error:", err);
    return NextResponse.json({ error: "Report generation failed" }, { status: 500 });
  }
}
