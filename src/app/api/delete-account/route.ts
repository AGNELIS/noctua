import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const serverSupabase = await createServerClient();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { confirmation } = await req.json();
  if (confirmation !== "DELETE") return NextResponse.json({ error: "Invalid confirmation" }, { status: 400 });

  // Service role for full deletion
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const userId = user.id;

  // Delete all user data in order (respecting foreign keys)
  await supabase.from("notifications").delete().eq("user_id", userId);
  await supabase.from("notification_prefs").delete().eq("user_id", userId);
  await supabase.from("user_patterns").delete().eq("user_id", userId);
  await supabase.from("workbook_progress").delete().eq("user_id", userId);
  await supabase.from("referral_rewards").delete().eq("user_id", userId);
  await supabase.from("referrals").delete().eq("referrer_id", userId);
  await supabase.from("user_purchases").delete().eq("user_id", userId);
  await supabase.from("dream_analyses").delete().eq("user_id", userId);
  await supabase.from("dream_symbols").delete().eq("user_id", userId);
  await supabase.from("dream_entries").delete().eq("user_id", userId);
  await supabase.from("shadow_work_entries").delete().eq("user_id", userId);
  await supabase.from("journal_entries").delete().eq("user_id", userId);
  await supabase.from("cycle_entries").delete().eq("user_id", userId);
  await supabase.from("smart_reports").delete().eq("user_id", userId);
  await supabase.from("weekly_insights").delete().eq("user_id", userId);
  await supabase.from("profiles").delete().eq("id", userId);

  // Delete auth user
  await supabase.auth.admin.deleteUser(userId);

  return NextResponse.json({ deleted: true });
}