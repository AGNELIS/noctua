import { SupabaseClient } from "@supabase/supabase-js";

type MemorySnapshotRow = {
  snapshot_number: number;
  content: string;
  key_patterns: Record<string, unknown> | null;
  created_at: string;
};

export interface EntryDelta {
  journal: number;
  dreams: number;
  shadow: number;
  total: number;
}

export interface UserMemory {
  lastSnapshotContent: string | null;
  lastSnapshotPatterns: Record<string, unknown> | null;
  lastSnapshotNumber: number | null;
  entriesSinceLastSnapshot: EntryDelta;
  isFirstMemory: boolean;
}

async function countEntriesSince(
  userId: string,
  supabase: SupabaseClient,
  sinceIso: string | null
): Promise<EntryDelta> {
  const tables: Array<{ key: keyof Omit<EntryDelta, "total">; table: string }> = [
    { key: "journal", table: "journal_entries" },
    { key: "dreams", table: "dream_entries" },
    { key: "shadow", table: "shadow_work_entries" },
  ];

  const counts: EntryDelta = { journal: 0, dreams: 0, shadow: 0, total: 0 };

  for (const { key, table } of tables) {
    let query = supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (sinceIso) {
      query = query.gt("created_at", sinceIso);
    }

    const { count } = await query;
    counts[key] = count || 0;
  }

  counts.total = counts.journal + counts.dreams + counts.shadow;
  return counts;
}

/**
 * Get user's cumulative AI memory.
 * Returns the latest snapshot (content + key_patterns + snapshot_number) plus
 * a delta count of new entries added since that snapshot was taken.
 *
 * If user has no snapshot yet, returns isFirstMemory: true with null snapshot
 * fields and a full count of all their entries to date.
 *
 * Intended to be consumed by AI endpoints (weekly-insight, generate-report,
 * analyse-dream, etc) so they can build on continuity instead of re-reading
 * raw data every time.
 */
export async function getUserMemory(
  userId: string,
  supabase: SupabaseClient
): Promise<UserMemory> {
  const { data: snapshotRows } = await supabase
    .from("ai_memory_snapshots")
    .select("snapshot_number, content, key_patterns, created_at")
    .eq("user_id", userId)
    .order("snapshot_number", { ascending: false })
    .limit(1);

  const snapshot = (snapshotRows || [])[0] as MemorySnapshotRow | undefined;

  if (!snapshot) {
    const counts = await countEntriesSince(userId, supabase, null);
    return {
      lastSnapshotContent: null,
      lastSnapshotPatterns: null,
      lastSnapshotNumber: null,
      entriesSinceLastSnapshot: counts,
      isFirstMemory: true,
    };
  }

  const counts = await countEntriesSince(userId, supabase, snapshot.created_at);

  return {
    lastSnapshotContent: snapshot.content,
    lastSnapshotPatterns: snapshot.key_patterns,
    lastSnapshotNumber: snapshot.snapshot_number,
    entriesSinceLastSnapshot: counts,
    isFirstMemory: false,
  };
}