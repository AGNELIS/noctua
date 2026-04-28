import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getEffectivePerms } from "@/lib/effective-perms";
import { countEntries, type EntryGateConfig } from "@/lib/entry-gate";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, is_premium, admin_test_mode")
    .eq("id", user.id)
    .single();
  const { isAdmin } = getEffectivePerms(profile);

  const { data: products } = await supabase
    .from("shop_products")
    .select("id, category, entry_gate, entry_gate_type, entry_gate_scope")
    .eq("is_active", true)
    .not("entry_gate", "is", null);
  if (!products) return NextResponse.json({});
  const statuses: Record<string, {
    entries_total: number;
    entries_required: number;
    blocked: boolean;
    gate_type: string | null;
    gate_scope: string | null;
    has_unused_credit: boolean;
  }> = {};
  for (const product of products) {
    const config: EntryGateConfig = {
      entry_gate: product.entry_gate,
      entry_gate_type: product.entry_gate_type,
      entry_gate_scope: product.entry_gate_scope,
    };
    const status = await countEntries(user.id, product.id, config, supabase);

    // Check unused credit for consumable categories only (report/interpretation)
    const isConsumable = product.category === "report" || product.category === "interpretation";
    let hasUnusedCredit = false;
    if (isConsumable) {
      const { data: credit } = await supabase
        .from("user_purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .is("used_at", null)
        .limit(1);
      hasUnusedCredit = !!(credit && credit.length > 0);
    }

    // Admin bypass: show real counts but never block
    statuses[product.id] = {
      entries_total: status.entries_total,
      entries_required: status.entries_required,
      blocked: isAdmin ? false : status.blocked,
      gate_type: status.gate_type,
      gate_scope: status.gate_scope,
      has_unused_credit: hasUnusedCredit,
    };
  }
  return NextResponse.json(statuses);
}