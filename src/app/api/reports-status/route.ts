import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type ReadingType = "monthly" | "pattern";

type ProductStatus = {
  status: "ready_to_generate" | "ready_to_buy" | "blocked_no_new_snapshot" | "blocked_not_enough_entries";
  entries_total: number;
  entries_required: number;
  current_snapshot_number: number;
  last_report_snapshot_number: number | null;
};

const GATE = 15;

async function buildStatus(
  userId: string,
  readingType: ReadingType,
  supabase: Awaited<ReturnType<typeof createClient>>,
  isAdmin: boolean,
  isPremium: boolean,
  totalEntries: number,
  currentSnapshotNumber: number
): Promise<ProductStatus> {
  const { data: lastReport } = await supabase
    .from("smart_reports")
    .select("snapshot_number_at_generation")
    .eq("user_id", userId)
    .eq("reading_type", readingType)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastReportSnapshotNumber = lastReport?.snapshot_number_at_generation ?? null;

  // Admin bypasses all gates (testing)
  if (isAdmin) {
    return {
      status: "ready_to_generate",
      entries_total: totalEntries,
      entries_required: GATE,
      current_snapshot_number: currentSnapshotNumber,
      last_report_snapshot_number: lastReportSnapshotNumber,
    };
  }

  // Gate 1: minimum entries threshold
  if (totalEntries < GATE) {
    return {
      status: "blocked_not_enough_entries",
      entries_total: totalEntries,
      entries_required: GATE,
      current_snapshot_number: currentSnapshotNumber,
      last_report_snapshot_number: lastReportSnapshotNumber,
    };
  }

  // Gate 2: snapshot-gate
  // If last report of this type was generated with current or higher snapshot, wait for new snapshot
  if (
    lastReportSnapshotNumber !== null &&
    lastReportSnapshotNumber >= currentSnapshotNumber
  ) {
    return {
      status: "blocked_no_new_snapshot",
      entries_total: totalEntries,
      entries_required: GATE,
      current_snapshot_number: currentSnapshotNumber,
      last_report_snapshot_number: lastReportSnapshotNumber,
    };
  }

  // User can proceed, but check access model:
  // Full Reading is free for premium, everyone else needs to buy
  // Pattern Reading requires purchase for everyone (premium and free alike)
  const needsPurchase =
    readingType === "pattern" || (readingType === "monthly" && !isPremium);

  if (needsPurchase) {
    // Check for an unused credit for this product
    const productName = readingType === "monthly" ? "Full Reading" : "Pattern Reading";
    const { data: product } = await supabase
      .from("shop_products")
      .select("id")
      .eq("name", productName)
      .maybeSingle();

    if (product) {
      const { data: credit } = await supabase
        .from("user_purchases")
        .select("id")
        .eq("user_id", userId)
        .eq("product_id", product.id)
        .is("used_at", null)
        .limit(1);

      const hasCredit = credit && credit.length > 0;

      return {
        status: hasCredit ? "ready_to_generate" : "ready_to_buy",
        entries_total: totalEntries,
        entries_required: GATE,
        current_snapshot_number: currentSnapshotNumber,
        last_report_snapshot_number: lastReportSnapshotNumber,
      };
    }
  }

  // Premium user with access to Full Reading, or fallback
  return {
    status: "ready_to_generate",
    entries_total: totalEntries,
    entries_required: GATE,
    current_snapshot_number: currentSnapshotNumber,
    last_report_snapshot_number: lastReportSnapshotNumber,
  };
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Load admin/premium flags
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, is_premium")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.is_admin || false;
  const isPremium = profile?.is_premium || false;

  // Count all entries (journal + dreams + shadow work)
  const [{ count: j }, { count: d }, { count: s }] = await Promise.all([
    supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("dream_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("shadow_work_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);
  const totalEntries = (j || 0) + (d || 0) + (s || 0);

  // Current snapshot number
  const { data: latestSnapshot } = await supabase
    .from("ai_memory_snapshots")
    .select("snapshot_number")
    .eq("user_id", user.id)
    .order("snapshot_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const currentSnapshotNumber = latestSnapshot?.snapshot_number || 0;

  // Build status for both product types
  const fullReading = await buildStatus(user.id, "monthly", supabase, isAdmin, isPremium, totalEntries, currentSnapshotNumber);
  const patternReading = await buildStatus(user.id, "pattern", supabase, isAdmin, isPremium, totalEntries, currentSnapshotNumber);

  return NextResponse.json({
    full_reading: fullReading,
    pattern_reading: patternReading,
    is_premium: isPremium,
    is_admin: isAdmin,
  });
}