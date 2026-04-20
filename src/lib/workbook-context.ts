import { SupabaseClient } from "@supabase/supabase-js";

type WorkbookProgressRow = {
  workbook_type: string;
  current_stage: number;
  stage_1_response: string | null;
  stage_2_response: string | null;
  stage_3_response: string | null;
  stage_4_response: string | null;
  stage_1_followup: string | null;
  stage_2_followup: string | null;
  stage_3_followup: string | null;
  stage_4_followup: string | null;
  summary: string | null;
  completed: boolean;
  updated_at: string;
};

type WorkbookSessionRow = {
  workbook_type: string;
  cycle_number: number;
  ai_summary: string | null;
  responses: Record<string, unknown> | null;
  completed_at: string | null;
  started_at: string;
};

const WORKBOOK_LABELS: Record<string, string> = {
  shadow_work: "Shadow Work",
  dream_integration: "Dream Integration",
  cycle_alignment: "Cycle Alignment",
  moon: "Moon Workbook",
  saturn: "Saturn Workbook",
  pluto: "Pluto Workbook",
  chiron: "Chiron Workbook",
  lilith: "Lilith Workbook",
  "lunar-nodes": "Lunar Nodes Workbook",
};

function truncate(text: string | null, maxChars = 400): string {
  if (!text) return "";
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return trimmed.slice(0, maxChars) + "...";
}

function formatProgressEntry(row: WorkbookProgressRow): string {
  const label = WORKBOOK_LABELS[row.workbook_type] || row.workbook_type;
  const status = row.completed ? "completed" : `in progress (stage ${row.current_stage}/4)`;
  const lines: string[] = [`${label} (${status}):`];

  for (let i = 1; i <= 4; i++) {
    const response = row[`stage_${i}_response` as keyof WorkbookProgressRow] as string | null;
    const followup = row[`stage_${i}_followup` as keyof WorkbookProgressRow] as string | null;
    if (response) {
      lines.push(`  Stage ${i}: "${truncate(response)}"`);
    }
    if (followup) {
      lines.push(`  Stage ${i} follow-up: "${truncate(followup)}"`);
    }
  }

  if (row.summary) {
    lines.push(`  Summary: ${truncate(row.summary, 500)}`);
  }

  return lines.join("\n");
}

function formatSessionEntry(row: WorkbookSessionRow): string {
  const label = WORKBOOK_LABELS[row.workbook_type] || row.workbook_type;
  const status = row.completed_at ? "completed" : "in progress";
  const lines: string[] = [`${label} — cycle ${row.cycle_number} (${status}):`];

  if (row.ai_summary) {
    lines.push(`  Summary: ${truncate(row.ai_summary, 500)}`);
  }

  if (row.responses && typeof row.responses === "object") {
    const entries = Object.entries(row.responses).slice(0, 3);
    for (const [key, value] of entries) {
      if (typeof value === "string" && value.trim()) {
        lines.push(`  ${key}: "${truncate(value, 300)}"`);
      }
    }
  }

  return lines.join("\n");
}

/**
 * Gather workbook context for AI prompts.
 * Returns a string block with user's workbook activity (self-work + planetary),
 * intended to be inserted into the prompt context for endpoints like
 * weekly-insight, monthly-report, generate-report, analyse-dream, etc.
 *
 * Returns empty string if user has no workbook activity.
 */
export async function gatherWorkbookContext(
  userId: string,
  supabase: SupabaseClient
): Promise<string> {
  const { data: progressRows } = await supabase
    .from("workbook_progress")
    .select("workbook_type, current_stage, stage_1_response, stage_2_response, stage_3_response, stage_4_response, stage_1_followup, stage_2_followup, stage_3_followup, stage_4_followup, summary, completed, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(5);

  const { data: sessionRows } = await supabase
    .from("workbook_sessions")
    .select("workbook_type, cycle_number, ai_summary, responses, completed_at, started_at")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(5);

  const sections: string[] = [];

  const progressWithContent = (progressRows || []).filter((r: WorkbookProgressRow) =>
    r.stage_1_response || r.stage_2_response || r.stage_3_response || r.stage_4_response
  );

  if (progressWithContent.length > 0) {
    sections.push("Self-work workbooks:");
    for (const row of progressWithContent) {
      sections.push(formatProgressEntry(row));
    }
  }

  const sessionsWithContent = (sessionRows || []).filter((r: WorkbookSessionRow) =>
    r.ai_summary || (r.responses && Object.keys(r.responses).length > 0)
  );

  if (sessionsWithContent.length > 0) {
    if (sections.length > 0) sections.push("");
    sections.push("Planetary workbooks:");
    for (const row of sessionsWithContent) {
      sections.push(formatSessionEntry(row));
    }
  }

  if (sections.length === 0) return "";

  return "WORKBOOK CONTEXT:\n" + sections.join("\n");
}