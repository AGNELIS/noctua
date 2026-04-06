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

  const { data: { users } } = await supabase.auth.admin.listUsers();
  const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url, is_premium, stripe_customer_id, referral_code, created_at");
  const { data: journalCounts } = await supabase.from("journal_entries").select("user_id");
  const { data: dreamCounts } = await supabase.from("dream_entries").select("user_id");
  const { data: shadowCounts } = await supabase.from("shadow_work_entries").select("user_id");
  const { data: cycleCounts } = await supabase.from("cycle_entries").select("user_id");
  const { data: workbookSessions } = await supabase.from("workbook_sessions").select("user_id, workbook_type, completed");
  const { data: dreamAnalyses } = await supabase.from("dream_analyses").select("user_id");
  const { data: reports } = await supabase.from("smart_reports").select("user_id");
  const { data: purchases } = await supabase.from("user_purchases").select("user_id, product_id");
  const { data: referrals } = await supabase.from("referrals").select("referrer_id, status");

  const count = (arr: any[] | null, userId: string) =>
    (arr || []).filter((r) => r.user_id === userId).length;

  const enrichedUsers = (users || []).map((u) => {
    const p = (profiles || []).find((pr) => pr.id === u.id);
    const journalCount = count(journalCounts, u.id);
    const dreamCount = count(dreamCounts, u.id);
    const shadowCount = count(shadowCounts, u.id);
    const cycleCount = count(cycleCounts, u.id);
    const totalEntries = journalCount + dreamCount + shadowCount + cycleCount;
    const completedWorkbooks = (workbookSessions || []).filter((w) => w.user_id === u.id && w.completed).length;
    const analysisCount = count(dreamAnalyses, u.id);
    const reportCount = count(reports, u.id);
    const purchaseCount = count(purchases, u.id);
    const referralCount = (referrals || []).filter((r) => r.referrer_id === u.id).length;
    const activeReferrals = (referrals || []).filter((r) => r.referrer_id === u.id && r.status === "completed").length;
    const daysSinceCreation = Math.floor((Date.now() - new Date(u.created_at).getTime()) / (1000 * 60 * 60 * 24));
    const lastSignIn = u.last_sign_in_at;

    const consistencyScore = Math.min(totalEntries / 20, 1) * 30;
    const depthScore = Math.min(completedWorkbooks / 3, 1) * 25;
    const aiScore = Math.min((analysisCount + reportCount) / 5, 1) * 20;
    const returnScore = lastSignIn ? (Date.now() - new Date(lastSignIn).getTime() < 7 * 24 * 60 * 60 * 1000 ? 15 : 5) : 0;
    const communityScore = Math.min(activeReferrals / 2, 1) * 10;
    const engagementScore = Math.round(consistencyScore + depthScore + aiScore + returnScore + communityScore);

    return {
      id: u.id,
      email: u.email,
      displayName: p?.display_name || null,
      avatarUrl: p?.avatar_url || null,
      isPremium: p?.is_premium || false,
      createdAt: u.created_at,
      lastSignIn,
      daysSinceCreation,
      stats: { journalCount, dreamCount, shadowCount, cycleCount, totalEntries, completedWorkbooks, analysisCount, reportCount, purchaseCount, referralCount, activeReferrals },
      engagementScore,
    };
  });

  enrichedUsers.sort((a, b) => b.engagementScore - a.engagementScore);
  return NextResponse.json({ users: enrichedUsers });
}