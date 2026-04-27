import type { SupabaseClient } from "@supabase/supabase-js";

export type EntryGateType =
  | "total_entries"
  | "journal_and_shadow"
  | "journal_and_dreams"
  | "cycle_entries";

export type EntryGateScope = "lifetime" | "since_last_purchase";

export type EntryGateConfig = {
  entry_gate: number | null;
  entry_gate_type: EntryGateType | null;
  entry_gate_scope: EntryGateScope | null;
};

export type EntryGateStatus = {
  entries_total: number;
  entries_required: number;
  blocked: boolean;
  gate_type: EntryGateType | null;
  gate_scope: EntryGateScope | null;
};

const TABLES_BY_TYPE: Record<EntryGateType, string[]> = {
  total_entries: ["journal_entries", "dream_entries", "shadow_work_entries"],
  journal_and_shadow: ["journal_entries", "shadow_work_entries"],
  journal_and_dreams: ["journal_entries", "dream_entries"],
  cycle_entries: ["cycle_entries"],
};

export async function countEntries(
  userId: string,
  productId: string,
  config: EntryGateConfig,
  supabase: SupabaseClient
): Promise<EntryGateStatus> {
  // No gate configured — product is always available
  if (!config.entry_gate || !config.entry_gate_type || !config.entry_gate_scope) {
    return {
      entries_total: 0,
      entries_required: 0,
      blocked: false,
      gate_type: config.entry_gate_type,
      gate_scope: config.entry_gate_scope,
    };
  }

  // Determine "since when" based on scope
  let sinceDate = new Date(0).toISOString();
  if (config.entry_gate_scope === "since_last_purchase") {
    const { data: lastPurchase } = await supabase
      .from("user_purchases")
      .select("created_at")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastPurchase) sinceDate = lastPurchase.created_at;
  }

  // Count entries from relevant tables
  const tables = TABLES_BY_TYPE[config.entry_gate_type];
  let total = 0;
  for (const table of tables) {
    const { count } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", sinceDate);
    total += count || 0;
  }

  return {
    entries_total: total,
    entries_required: config.entry_gate,
    blocked: total < config.entry_gate,
    gate_type: config.entry_gate_type,
    gate_scope: config.entry_gate_scope,
  };
}