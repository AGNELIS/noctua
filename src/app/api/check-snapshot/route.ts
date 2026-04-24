import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Count all entries across the three source tables
  const [{ count: j }, { count: d }, { count: s }] = await Promise.all([
    supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("dream_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("shadow_work_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);
  const total = (j || 0) + (d || 0) + (s || 0);

  // Not at threshold (15, 30, 45...) — do nothing
  if (total === 0 || total % 15 !== 0) {
    return NextResponse.json({ triggered: false, reason: "not_at_threshold", total });
  }

  // Anti-duplicate: check if snapshot already exists for this cumulative count
  const { data: existing } = await supabase
    .from("ai_memory_snapshots")
    .select("id")
    .eq("user_id", user.id)
    .eq("cumulative_entry_count", total)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ triggered: false, reason: "already_exists", total });
  }

  // Fire-and-forget: call create-snapshot with forwarded cookies
  const cookieHeader = req.headers.get("cookie") || "";
  const baseUrl = req.nextUrl.origin;

  fetch(`${baseUrl}/api/create-snapshot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookieHeader,
    },
    body: JSON.stringify({}),
  }).catch(err => console.error("Snapshot trigger failed:", err));

  return NextResponse.json({ triggered: true, total });
}