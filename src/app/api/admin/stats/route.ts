import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { createClient: createServerClient } = await import("@/lib/supabase/server");
  const supa = await createServerClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supa.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Users
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const totalUsers = users?.length || 0;
  const newToday = (users || []).filter(u => u.created_at >= today).length;
  const newThisWeek = (users || []).filter(u => u.created_at >= weekAgo).length;
  const activeThisWeek = (users || []).filter(u => u.last_sign_in_at && u.last_sign_in_at >= weekAgo).length;

  // Premium
  const { count: premiumCount } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_premium", true);

  // Entries
  const { count: journalTotal } = await supabase.from("journal_entries").select("id", { count: "exact", head: true });
  const { count: journalToday } = await supabase.from("journal_entries").select("id", { count: "exact", head: true }).gte("created_at", today);
  const { count: dreamTotal } = await supabase.from("dream_entries").select("id", { count: "exact", head: true });
  const { count: dreamToday } = await supabase.from("dream_entries").select("id", { count: "exact", head: true }).gte("created_at", today);
  const { count: shadowTotal } = await supabase.from("shadow_work_entries").select("id", { count: "exact", head: true });
  const { count: cycleTotal } = await supabase.from("cycle_entries").select("id", { count: "exact", head: true });

  // Workbooks
  const { count: workbooksCompleted } = await supabase.from("workbook_sessions").select("id", { count: "exact", head: true }).eq("completed", true);

  // AI usage
  const { count: analysesTotal } = await supabase.from("dream_analyses").select("id", { count: "exact", head: true });
  const { count: reportsTotal } = await supabase.from("smart_reports").select("id", { count: "exact", head: true });

  // Purchases
  const { count: purchaseCount } = await supabase.from("user_purchases").select("id", { count: "exact", head: true });

  // Referrals
  const { count: referralTotal } = await supabase.from("referrals").select("id", { count: "exact", head: true });
  const { count: referralActive } = await supabase.from("referrals").select("id", { count: "exact", head: true }).eq("status", "completed");

  // Recent activity (last 20 actions)
  const { data: recentJournal } = await supabase.from("journal_entries").select("user_id, created_at").order("created_at", { ascending: false }).limit(5);
  const { data: recentDreams } = await supabase.from("dream_entries").select("user_id, created_at").order("created_at", { ascending: false }).limit(5);
  const { data: recentShadow } = await supabase.from("shadow_work_entries").select("user_id, created_at").order("created_at", { ascending: false }).limit(5);
  const { data: recentWorkbooks } = await supabase.from("workbook_sessions").select("user_id, workbook_type, created_at, completed").order("created_at", { ascending: false }).limit(5);
  const { data: recentAnalyses } = await supabase.from("dream_analyses").select("user_id, created_at").order("created_at", { ascending: false }).limit(5);

  // Map user IDs to emails
  const userMap: Record<string, string> = {};
  (users || []).forEach(u => { userMap[u.id] = u.email || "unknown"; });

  const activity = [
    ...(recentJournal || []).map(r => ({ type: "journal", user: userMap[r.user_id] || r.user_id, at: r.created_at })),
    ...(recentDreams || []).map(r => ({ type: "dream", user: userMap[r.user_id] || r.user_id, at: r.created_at })),
    ...(recentShadow || []).map(r => ({ type: "shadow", user: userMap[r.user_id] || r.user_id, at: r.created_at })),
    ...(recentWorkbooks || []).map(r => ({ type: r.completed ? "workbook_done" : "workbook_start", user: userMap[r.user_id] || r.user_id, at: r.created_at })),
    ...(recentAnalyses || []).map(r => ({ type: "analysis", user: userMap[r.user_id] || r.user_id, at: r.created_at })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 15);

  return NextResponse.json({
    users: { total: totalUsers, newToday, newThisWeek, activeThisWeek, premium: premiumCount || 0 },
    entries: { journal: journalTotal || 0, journalToday: journalToday || 0, dreams: dreamTotal || 0, dreamsToday: dreamToday || 0, shadow: shadowTotal || 0, cycle: cycleTotal || 0 },
    ai: { analyses: analysesTotal || 0, reports: reportsTotal || 0, workbooks: workbooksCompleted || 0 },
    commerce: { purchases: purchaseCount || 0, referrals: referralTotal || 0, activeReferrals: referralActive || 0 },
    activity,
  });
}