import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { language: userLang, type } = await req.json();
  const lang = userLang === "pl" ? "pl" : "en";

  const { data: journalData } = await supabase.from("journal_entries").select("content, mood, created_at")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);

  const { data: dreamData } = await supabase.from("dream_entries").select("content, symbols, emotional_tone, is_recurring")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(30);

  const { data: shadowData } = await supabase.from("shadow_work_entries").select("response, emotions")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(30);

  const { data: cycleData } = await supabase.from("cycle_entries").select("cycle_phase, symptoms, energy_level")
    .eq("user_id", user.id).order("entry_date", { ascending: false }).limit(30);

  const { data: workbookData } = await supabase.from("workbook_sessions")
    .select("workbook_type, stage_1_response, stage_2_response, stage_3_response, stage_4_response, summary, completed")
    .eq("user_id", user.id).eq("completed", true).order("created_at", { ascending: false }).limit(10);

  const journalSummary = journalData?.map(e => `Mood: ${e.mood || "none"}. ${(e.content || "").slice(0, 200)}`).join("\n") || "No entries.";
  const dreamSummary = dreamData?.map(d => `Symbols: ${(d.symbols as string[] || []).join(", ")}. ${(d.content || "").slice(0, 150)}`).join("\n") || "No dreams.";
  const shadowSummary = shadowData?.map(s => `Emotions: ${(s.emotions as string[] || []).join(", ")}. ${(s.response || "").slice(0, 150)}`).join("\n") || "No shadow work.";
  const workbookSummary = workbookData?.map(w => `Type: ${w.workbook_type}. Summary: ${(w.summary || "").slice(0, 200)}`).join("\n") || "No completed workbooks.";

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

  let prompt: string;

  if (type === "shadow_mirror") {
    prompt = `You are AGNELIS, creator of Noctua. You are writing a deeply personal shadow work mirror for a woman who has been doing serious inner work in your app. This is not a report. This is you holding up a mirror and saying: "This is what I see in your entire journey."

Write entirely in ${lang === "pl" ? "Polish" : "English"}.

You have access to her COMPLETE history.

The tone: you see this woman. You see what she is doing for herself. You see the courage in returning to this work day after day. You do not sugarcoat. You do not use spiritual language. You write like someone who has walked this path herself and knows what it costs. You acknowledge the weight of what she carries without making it poetic. You are direct, grounded, warm. No sentimentality. No generic praise. You name what you actually see, and you name it with respect.

Write as continuous flowing text. No section headings. But separate each thought with a blank line so the text breathes.

Structure your thoughts in this order, but do NOT label them:
1. What were her earliest patterns? What was she avoiding at the beginning?
2. Name the specific changes you see between her early entries and recent ones. Be concrete.
3. What pattern is still there? What has she not yet faced? Name it directly but with compassion.
4. The blind spot. The thing that is so close to her that she cannot see it. This is the most important part.

Data:
Journal (${journalData?.length || 0} entries): ${journalSummary}
Dreams (${dreamData?.length || 0}): ${dreamSummary}
Shadow work (${shadowData?.length || 0}): ${shadowSummary}
Completed workbooks (${workbookData?.length || 0}): ${workbookSummary}
Cycle entries: ${cycleData?.length || 0}

CRITICAL RULES:
Keep under 800 words. No markdown. No asterisks. Never use dashes, hyphens, em dashes or en dashes anywhere. No greetings. No section headings. Commas and full stops only. Use colons where you would use a dash. Separate thoughts with blank lines. Be direct, warm, confrontational where needed. This should feel like the most honest conversation she has ever had with herself.`;
  } else if (type === "deep_reading") {
    prompt = `You are AGNELIS, creator of Noctua. You are writing an extended deep reading based on MULTIPLE MONTHS of data. This is not a standard monthly reading. This is a panoramic view of a woman's inner landscape over time.

Write entirely in ${lang === "pl" ? "Polish" : "English"}.

The tone: you see this woman. You see what she is doing for herself. You see the courage in returning to this work day after day. You do not sugarcoat. You do not use spiritual language. You are direct, grounded, warm. No sentimentality. No generic praise. You name what you actually see, and you name it with respect.

Write as continuous flowing text. No section headings. But separate each thought with a blank line so the text breathes.

Structure your thoughts in this order, but do NOT label them:
1. The big picture of her emotional life across all the data you have. 4-5 sentences.
2. What cycles and repetitions do you see across months? What comes and goes? What stays?
3. What is NOT in the data? What does she never write about? Sometimes silence is the loudest pattern.
4. If you had to name ONE thing that everything else orbits around, what would it be?

Data:
Journal (${journalData?.length || 0} entries): ${journalSummary}
Dreams (${dreamData?.length || 0}): ${dreamSummary}
Shadow work (${shadowData?.length || 0}): ${shadowSummary}
Cycle entries: ${cycleData?.length || 0}

CRITICAL RULES:
Keep under 1000 words. No markdown. No asterisks. Never use dashes, hyphens, em dashes or en dashes anywhere. No greetings. No section headings. Commas and full stops only. Use colons where you would use a dash. Separate thoughts with blank lines.`;
  } else {
    prompt = `You are AGNELIS, creator of Noctua. You are writing a personal letter to a woman who has been using your app to do deep inner work. This letter is a reward for inviting others to this work. It should feel like receiving a letter from someone who truly sees you.

Write entirely in ${lang === "pl" ? "Polish" : "English"}.

This is NOT a report. This is a letter. Write it as one continuous piece, not in sections. Start with what you notice first about her patterns. Then go deeper. End with something she needs to hear but probably does not want to.

The tone: you see this woman. You see what she is doing for herself. You see the courage in returning to this work day after day. You do not sugarcoat. You do not use spiritual language. You write like someone who has walked this path herself and knows what it costs. You acknowledge the weight of what she carries without making it poetic. You are direct, grounded, warm. No sentimentality. No generic praise. You name what you actually see, and you name it with respect. This should read like a letter from someone who understands what it means to come back to yourself.

Data from her entire journey in Noctua:
Journal (${journalData?.length || 0} entries): ${journalSummary}
Dreams (${dreamData?.length || 0}): ${dreamSummary}
Shadow work (${shadowData?.length || 0}): ${shadowSummary}
Completed workbooks (${workbookData?.length || 0}): ${workbookSummary}

CRITICAL RULES:
Keep under 600 words. No markdown. No asterisks. Never use dashes, hyphens, em dashes or en dashes anywhere. No section headings. No greetings like "Droga" or "Dear". Write in second person. Commas and full stops only. Use colons where you would use a dash. Sign the letter simply: AGNELIS`;
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: type === "deep_reading" ? 1500 : 1000, messages: [{ role: "user", content: prompt }] }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Personal letter error:", err);
      return NextResponse.json({ error: "Generation failed" }, { status: 500 });
    }

    const data = await res.json();
    const rawText = data.content?.[0]?.text || "";
    const text = rawText.replace(/\*\*/g, "").replace(/\*/g, "").replace(/—/g, ", ").replace(/–/g, ", ").replace(/-/g, ", ").replace(/#{1,3}\s/g, "");

    return NextResponse.json({ text });
  } catch (err) {
    console.error("Letter error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}