import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { stage, response, planet, natalSign, context, language: userLang } = await req.json();
  const lang = userLang === "pl" ? "pl" : "en";

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

  const planetContext: Record<string, { en: string; pl: string }> = {
    moon: {
      en: "emotional patterns, instinctive reactions, needs, how she processes feelings, what makes her feel safe or threatened",
      pl: "wzorce emocjonalne, instynktowne reakcje, potrzeby, jak przetwarza uczucia, co daje jej poczucie bezpieczeństwa lub zagrożenia",
    },
    saturn: {
      en: "structures, responsibilities, karma, where she needs to mature, what she avoids because it feels too heavy",
      pl: "struktury, odpowiedzialności, karma, gdzie musi dojrzeć, czego unika bo wydaje się za ciężkie",
    },
    pluto: {
      en: "power dynamics, control, transformation, what she holds onto too tightly, where she needs to let something die",
      pl: "dynamika mocy, kontrola, transformacja, czego trzyma się za mocno, gdzie musi pozwolić czemuś umrzeć",
    },
    chiron: {
      en: "deepest wound, recurring pain, how her wound becomes her teacher, where healing happens through helping others",
      pl: "najgłębsza rana, powtarzający się ból, jak jej rana staje się nauczycielem, gdzie uzdrawianie dzieje się przez pomaganie innym",
    },
    lilith: {
      en: "rejected power, suppressed instincts, what she was taught to hide, what wants to come back and be expressed",
      pl: "odrzucona moc, stłumione instynkty, czego nauczono ją ukrywać, co chce wrócić i być wyrażone",
    },
    northNode: {
      en: "direction of growth, what feels uncomfortable but necessary, where life pushes her to evolve beyond old patterns",
      pl: "kierunek rozwoju, co jest niekomfortowe ale konieczne, gdzie życie popycha ją do ewolucji poza stare wzorce",
    },
  };

  const stageNames: Record<number, { en: string; pl: string }> = {
    1: { en: "Recognition", pl: "Rozpoznanie" },
    2: { en: "Pattern", pl: "Wzorzec" },
    3: { en: "Depth", pl: "Głębia" },
    4: { en: "Integration", pl: "Integracja" },
  };

  const planetName = planet === "northNode" ? "Lunar Nodes" : planet.charAt(0).toUpperCase() + planet.slice(1);
  const pContext = planetContext[planet]?.[lang] || planetContext.moon[lang];
  const stageName = stageNames[stage]?.[lang] || "Recognition";

  // Cross-referencing: fetch user's journal, dreams, and other workbook data
  const [journalData, dreamData, workbookData, entryCount] = await Promise.all([
    supabase.from("journal_entries").select("content, mood, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    supabase.from("dream_entries").select("content, symbols, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("workbook_progress").select("workbook_type, responses, completed_at").eq("user_id", user.id).not("workbook_type", "eq", planet).order("started_at", { ascending: false }).limit(5),
    supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  // Build cross-reference context
  let crossContext = "";

  // Journal patterns
  const journals = journalData.data || [];
  if (journals.length > 0) {
    const moods = journals.map(j => j.mood).filter(Boolean);
    const recentThemes = journals.slice(0, 5).map(j => j.content?.substring(0, 150)).filter(Boolean);
    if (moods.length > 0) crossContext += `Recent moods from journal: ${moods.join(", ")}. `;
    if (recentThemes.length > 0) crossContext += `Recent journal themes (excerpts): ${recentThemes.join(" | ")}. `;
  }

  // Dream patterns
  const dreams = dreamData.data || [];
  if (dreams.length > 0) {
    const symbols = dreams.flatMap(d => {
      if (Array.isArray(d.symbols)) return d.symbols;
      if (typeof d.symbols === "string") return d.symbols.split(",").map((s: string) => s.trim());
      return [];
    }).filter(Boolean);
    if (symbols.length > 0) crossContext += `Recurring dream symbols: ${[...new Set(symbols)].slice(0, 10).join(", ")}. `;
    const dreamExcerpts = dreams.slice(0, 3).map(d => d.content?.substring(0, 100)).filter(Boolean);
    if (dreamExcerpts.length > 0) crossContext += `Recent dreams (excerpts): ${dreamExcerpts.join(" | ")}. `;
  }

  // Other workbook insights
  const otherWorkbooks = workbookData.data || [];
  if (otherWorkbooks.length > 0) {
    const insights = otherWorkbooks.map(w => {
      const responses = w.responses || [];
      const lastResponse = responses[responses.length - 1];
      if (lastResponse?.ai_reaction) return `${w.workbook_type}: "${lastResponse.ai_reaction.substring(0, 150)}"`;
      return null;
    }).filter(Boolean);
    if (insights.length > 0) crossContext += `Insights from other workbooks: ${insights.join(" | ")}. `;
  }

  // Phase awareness
  const totalEntries = entryCount.count || 0;
  const phase = totalEntries <= 15 ? "discovery" : totalEntries <= 40 ? "deepening" : "integration";
  const phaseInstruction: Record<string, { en: string; pl: string }> = {
    discovery: {
      en: "This person is early in their self-work. They may not yet have language for what they feel. Name things simply. Do not assume depth they have not reached yet.",
      pl: "Ta osoba jest na początku pracy z sobą. Może jeszcze nie mieć języka na to co czuje. Nazywaj rzeczy prosto. Nie zakładaj głębi do której jeszcze nie dotarła.",
    },
    deepening: {
      en: "This person has been writing for a while. They are starting to see patterns. You can be more direct. Reference what repeats. Push gently past the surface.",
      pl: "Ta osoba pisze od jakiegoś czasu. Zaczyna widzieć wzorce. Możesz być bardziej bezpośrednia. Odnoś się do tego co się powtarza. Delikatnie pchaj poza powierzchnię.",
    },
    integration: {
      en: "This person has significant self-work behind them. They know their patterns. Do not explain what they already see. Ask what they are doing with what they know. Challenge integration, not awareness.",
      pl: "Ta osoba ma za sobą znaczącą pracę z sobą. Zna swoje wzorce. Nie tłumacz tego co już widzi. Pytaj co robi z tym co wie. Kwestionuj integrację, nie świadomość.",
    },
  };

  const prompt = `You are a depth work guide for the app "Noctua" by AGNÉLIS. You respond to what someone wrote during their ${planetName} workbook, stage: ${stageName}.
This person has their natal ${planetName} in ${natalSign}. The area of work is: ${pContext}.
Phase: ${phase} (${totalEntries} total journal entries). ${phaseInstruction[phase][lang]}
${crossContext ? `\nCross-reference data from this person's journal, dreams and other workbooks:\n${crossContext}` : ""}
Your role: react to what she wrote. Name what you see. Be specific. Do not repeat her words back to her. Do not give advice. Do not say what she should do. Point to what she might not be seeing. Be direct but not cold. Short. 3 to 5 sentences maximum.
${crossContext ? "If you see connections between what she wrote now and patterns from her journal, dreams or other workbooks, name them. Do not force connections. Only mention them if they are real and specific." : ""}
${context ? `Additional context:\n${context}` : ""}
Write in ${lang === "pl" ? "Polish" : "English"}.
She wrote:
"${response}"
CRITICAL RULES:
No markdown. No asterisks. No bold. No bullet points. No dashes or em dashes. No greetings. No "Dear" or "Droga". Do not use the word "journey". Do not give advice. Name what you see. If referencing her other data, do it naturally, not as a list.`;
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
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) return NextResponse.json({ error: "AI failed" }, { status: 500 });

    const data = await res.json();
    const text = (data.content?.[0]?.text || "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/—/g, ", ")
      .replace(/–/g, ", ")
      .replace(/ - /g, ", ");

    return NextResponse.json({ reaction: text });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}