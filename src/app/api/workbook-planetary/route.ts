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

  const prompt = `You are a depth work guide for the app "Noctua" by AGNÉLIS. You respond to what someone wrote during their ${planetName} workbook, stage: ${stageName}.

This person has their natal ${planetName} in ${natalSign}. The area of work is: ${pContext}.

Your role: react to what she wrote. Name what you see. Be specific. Do not repeat her words back to her. Do not give advice. Do not say what she should do. Point to what she might not be seeing. Be direct but not cold. Short. 3 to 5 sentences maximum.

${context ? `Context from her journal and previous entries:\n${context}` : ""}

Write in ${lang === "pl" ? "Polish" : "English"}.

She wrote:
"${response}"

CRITICAL RULES:
No markdown. No asterisks. No bold. No bullet points. No dashes or em dashes. No greetings. No "Dear" or "Droga". Do not use the word "journey". Do not give advice. Name what you see.`;

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