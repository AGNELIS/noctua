import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { sessionId, stage, response, previousResponses, patterns, language: userLang, workbookType, isSummary } = await req.json();
  const lang = userLang === "pl" ? "pl" : "en";

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

  const stageNames = lang === "pl"
    ? ["Konfrontacja", "Wzorzec", "Emocje", "Integracja"]
    : ["Awareness", "Pattern", "Emotional", "Integration"];

  const prevContext = previousResponses && previousResponses.length > 0
    ? previousResponses.map((p: { stage: number; response: string; followup?: string }, i: number) =>
        `${stageNames[p.stage - 1]}: "${p.response}"${p.followup ? ` → Follow-up: "${p.followup}"` : ""}`
      ).join("\n")
    : "No previous responses yet.";

  const patternContext = patterns
    ? `Top emotions: ${patterns.topEmotions?.join(", ") || "none"}. Recurring themes: ${patterns.recurringThemes?.join(", ") || "none"}. Dream symbols: ${patterns.dreamSymbols?.join(", ") || "none"}.`
    : "No pattern data available.";

  const isDream = workbookType === "dream_integration";
  const isCycle = workbookType === "cycle_alignment";
  const guideRole = isDream ? "dream interpretation guide" : isCycle ? "cycle alignment guide" : "shadow work guide";

  let prompt: string;

  if (isSummary) {
    prompt = `You are a ${guideRole} for the app "Noctua" by AGNÉLIS. You have just guided a woman through a 4-stage ${isDream ? "dream integration" : isCycle ? "cycle alignment" : "shadow work"} session. Now write a personal summary of what you observed.

Write entirely in ${lang === "pl" ? "Polish" : "English"}.

Your voice: direct, warm, confrontational where needed. No spiritual bypassing. No generic affirmations. You write like someone who has done this work herself.

Here are her responses from all 4 stages:
${prevContext}

Her pattern data: ${patternContext}

Write a summary with these sections (use Title Case headings on their own line):

${lang === "pl" ? "Co widzę" : "What I see"}
2-3 sentences. What is the core pattern you observed across all 4 stages? Name it directly.

${lang === "pl" ? "Co się potwierdziło" : "What was confirmed"}
What pattern from her data showed up again in her writing? Be specific.

${lang === "pl" ? "Co obserwować" : "What to watch"}
One concrete thing to notice in the coming days. Not advice. An observation point.

CRITICAL RULES:
Keep under 300 words. No markdown. No asterisks. Never use dashes, hyphens, em dashes or en dashes anywhere. No greetings. No "Droga". Commas and full stops only. Use colons where you would use a dash. Title Case headings on their own line.`;
  } else {
    prompt = `You are a ${guideRole} for the app "Noctua" by AGNÉLIS. You are in stage ${stage}/4 (${stageNames[stage - 1]}) of a guided ${isDream ? "dream integration" : isCycle ? "cycle alignment" : "shadow work"} session.

Write entirely in ${lang === "pl" ? "Polish" : "English"}.

A woman just wrote this response to your question:
"${response}"

${stage > 1 ? `Her previous responses in this session:\n${prevContext}` : "This is her first response."}

Her pattern data: ${patternContext}

Your task: React to what she wrote. Be specific. Name what you see. Then ask ONE follow-up question that goes deeper.

Rules for your reaction:
- 2-3 sentences of observation. Be direct. Name the pattern, the avoidance, the contradiction.
- If she is being vague, call it out: "You're describing, not feeling."
- If she repeats a word, notice it: "You used the word 'should' three times."
- If there's a contradiction with her data patterns, name it.
- End with ONE follow-up question. Make it specific to what she wrote. Not generic.
- Stage ${stage} focus: ${isDream ? (
  stage === 1 ? "What feeling is the dream carrying? Name the emotional undercurrent, not the plot." :
  stage === 2 ? "Where does this dream symbol or theme appear in her waking life? Connect dream to reality." :
  stage === 3 ? "What is the dream trying to surface that she suppresses during the day?" :
  "How can she integrate this dream message into her daily life? Be concrete."
) : isCycle ? (
  stage === 1 ? "Where is she fighting her body's rhythm instead of following it?" :
  stage === 2 ? "What pattern repeats across her cycles? Connect energy, mood, and behavior." :
  stage === 3 ? "What does she deny herself in certain phases? What need is unmet?" :
  "How can she align her actions with her cycle instead of against it? Be concrete."
) : (
  stage === 1 ? "What is she avoiding? Name it." :
  stage === 2 ? "Where does this pattern repeat? Connect it to her other responses." :
  stage === 3 ? "What emotion is underneath? Push past the surface." :
  "How does this change her actual behavior? Be concrete."
)}

CRITICAL RULES:
Keep under 150 words. No markdown. No asterisks. Never use dashes, hyphens, em dashes or en dashes anywhere. No greetings. No "Droga". Commas and full stops only. Use colons where you would use a dash. Write as flowing text, not sections.`;
  }

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
        max_tokens: isSummary ? 600 : 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Workbook AI error:", err);
      return NextResponse.json({ error: "AI reaction failed" }, { status: 500 });
    }

    const data = await res.json();
    const rawText = data.content?.[0]?.text || "";
    const text = rawText
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/—/g, ", ")
      .replace(/–/g, ", ")
      .replace(/ - /g, ", ")
      .replace(/-/g, ", ")
      .replace(/#{1,3}\s/g, "");

    // Save to database
    if (isSummary) {
      await supabase.from("workbook_sessions")
        .update({ summary: text, completed: true, updated_at: new Date().toISOString() })
        .eq("id", sessionId);
    } else {
      await supabase.from("workbook_sessions")
        .update({ [`stage_${stage}_ai_reaction`]: text, updated_at: new Date().toISOString() })
        .eq("id", sessionId);
    }

    return NextResponse.json({ reaction: text });
  } catch (err) {
    console.error("Workbook react error:", err);
    return NextResponse.json({ error: "Reaction failed" }, { status: 500 });
  }
}