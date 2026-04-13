import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_premium")
    .eq("id", user.id)
    .single();

  if (!profile?.is_premium) return NextResponse.json({ skipped: true });

  // Find last report date
  const { data: lastReport } = await supabase
    .from("smart_reports")
    .select("created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const sinceDate = lastReport && lastReport.length > 0
    ? lastReport[0].created_at
    : new Date(0).toISOString();

  const { count: jc } = await supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", sinceDate);
  const { count: dc } = await supabase.from("dream_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", sinceDate);
  const { count: sc } = await supabase.from("shadow_work_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", sinceDate);
  const { count: cc } = await supabase.from("cycle_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", sinceDate);

  const total = (jc || 0) + (dc || 0) + (sc || 0) + (cc || 0);

  // Check if we already notified for this milestone
  const checkNotified = async (type: string) => {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("type", type)
      .gte("created_at", sinceDate);
    return (count || 0) > 0;
  };

  if (total >= 15 && !(await checkNotified("milestone_15"))) {
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "milestone_15",
      title_en: "Your full reading is ready",
      title_pl: "Twój pełny odczyt jest gotowy",
      body_en: "15 entries since your last reading. A complete picture is waiting for you.",
      body_pl: "15 wpisów od ostatniego odczytu. Pełny obraz czeka na Ciebie.",
      link: "/reports",
    });
  } else if (total >= 8 && !(await checkNotified("milestone_8"))) {
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "milestone_8",
      title_en: "Your mid-month reading is almost ready",
      title_pl: "Twój odczyt połowy miesiąca jest prawie gotowy",
      body_en: "8 entries recorded. Patterns are emerging. Generate your reading now.",
      body_pl: "8 wpisów zapisanych. Wzorce się wyłaniają. Wygeneruj swój odczyt.",
      link: "/reports",
    });
  }

  return NextResponse.json({ total, sinceLastReport: sinceDate });
}