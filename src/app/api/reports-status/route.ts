import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getEffectivePerms } from "@/lib/effective-perms";
import { countEntries, type EntryGateType, type EntryGateScope } from "@/lib/entry-gate";

type ProductStatus = {
  status: "ready_to_generate" | "ready_to_buy" | "blocked_no_new_snapshot" | "blocked_not_enough_entries";
  entries_total: number;
  entries_required: number;
  current_snapshot_number: number;
  last_report_snapshot_number: number | null;
};

async function buildProductStatus(
  userId: string,
  productName: string,
  snapshotTable: "smart_reports" | "weekly_insights",
  snapshotFilter: { reading_type?: string },
  isFreeFor: { isPremium: boolean } | null,
  supabase: Awaited<ReturnType<typeof createClient>>,
  isAdmin: boolean,
  isPremium: boolean,
  currentSnapshotNumber: number
): Promise<ProductStatus> {
  // Load product config from shop_products (id + entry_gate)
  const { data: product } = await supabase
    .from("shop_products")
    .select("id, entry_gate, entry_gate_type, entry_gate_scope")
    .eq("name", productName)
    .maybeSingle();

  if (!product) {
    // Product not in DB — fail safe
    return {
      status: "ready_to_buy",
      entries_total: 0,
      entries_required: 0,
      current_snapshot_number: currentSnapshotNumber,
      last_report_snapshot_number: null,
    };
  }

  // Count entries via shared engine (respects gate type and scope)
  const gateStatus = await countEntries(
    userId,
    product.id,
    {
      entry_gate: product.entry_gate,
      entry_gate_type: product.entry_gate_type as EntryGateType | null,
      entry_gate_scope: product.entry_gate_scope as EntryGateScope | null,
    },
    supabase
  );

  // Get last report/insight snapshot for snapshot-gate
  let snapshotQuery = supabase
    .from(snapshotTable)
    .select("snapshot_number_at_generation")
    .eq("user_id", userId);

  if (snapshotFilter.reading_type) {
    snapshotQuery = snapshotQuery.eq("reading_type", snapshotFilter.reading_type);
  }

  const { data: lastReport } = await snapshotQuery
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastReportSnapshotNumber = lastReport?.snapshot_number_at_generation ?? null;

  // Admin bypasses all gates (testing)
  if (isAdmin) {
    return {
      status: "ready_to_generate",
      entries_total: gateStatus.entries_total,
      entries_required: gateStatus.entries_required,
      current_snapshot_number: currentSnapshotNumber,
      last_report_snapshot_number: lastReportSnapshotNumber,
    };
  }

  // Gate 1: minimum entries threshold
  if (gateStatus.blocked) {
    return {
      status: "blocked_not_enough_entries",
      entries_total: gateStatus.entries_total,
      entries_required: gateStatus.entries_required,
      current_snapshot_number: currentSnapshotNumber,
      last_report_snapshot_number: lastReportSnapshotNumber,
    };
  }

  // Gate 2: snapshot-gate — cannot regenerate on the same snapshot
  if (
    lastReportSnapshotNumber !== null &&
    lastReportSnapshotNumber >= currentSnapshotNumber
  ) {
    return {
      status: "blocked_no_new_snapshot",
      entries_total: gateStatus.entries_total,
      entries_required: gateStatus.entries_required,
      current_snapshot_number: currentSnapshotNumber,
      last_report_snapshot_number: lastReportSnapshotNumber,
    };
  }

  // Access check: free pass for premium users (Full Reading), or credit required
  const hasFreeAccess = isFreeFor?.isPremium && isPremium;

  if (!hasFreeAccess) {
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
      entries_total: gateStatus.entries_total,
      entries_required: gateStatus.entries_required,
      current_snapshot_number: currentSnapshotNumber,
      last_report_snapshot_number: lastReportSnapshotNumber,
    };
  }

  // Premium with free access (Full Reading)
  return {
    status: "ready_to_generate",
    entries_total: gateStatus.entries_total,
    entries_required: gateStatus.entries_required,
    current_snapshot_number: currentSnapshotNumber,
    last_report_snapshot_number: lastReportSnapshotNumber,
  };
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, is_premium, admin_test_mode")
    .eq("id", user.id)
    .single();
  const { isAdmin, isPremium } = getEffectivePerms(profile);

  const { data: latestSnapshot } = await supabase
    .from("ai_memory_snapshots")
    .select("snapshot_number")
    .eq("user_id", user.id)
    .order("snapshot_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const currentSnapshotNumber = latestSnapshot?.snapshot_number || 0;

  const fullReading = await buildProductStatus(
    user.id,
    "Full Reading",
    "smart_reports",
    { reading_type: "monthly" },
    { isPremium: true },
    supabase,
    isAdmin,
    isPremium,
    currentSnapshotNumber
  );

  const patternReading = await buildProductStatus(
    user.id,
    "Pattern Reading",
    "smart_reports",
    { reading_type: "pattern" },
    null,
    supabase,
    isAdmin,
    isPremium,
    currentSnapshotNumber
  );

  const reflection = await buildProductStatus(
    user.id,
    "Reflection",
    "weekly_insights",
    {},
    null,
    supabase,
    isAdmin,
    isPremium,
    currentSnapshotNumber
  );

  return NextResponse.json({
    full_reading: fullReading,
    pattern_reading: patternReading,
    reflection: reflection,
    is_premium: isPremium,
    is_admin: isAdmin,
  });
}