"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/context/ThemeContext";

type Stats = {
  journalCount: number;
  dreamCount: number;
  symbolCount: number;
  cycleCount: number;
};

type Purchase = {
  product_id: string;
  purchased_at: string;
  shop_products: { name: string; category: string; preview_emoji: string }[] | { name: string; category: string; preview_emoji: string } | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const { activeThemeName, resetTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [stats, setStats] = useState<Stats>({ journalCount: 0, dreamCount: 0, symbolCount: 0, cycleCount: 0 });
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [memberSince, setMemberSince] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    setEmail(user.email || "");
    setMemberSince(
      new Date(user.created_at).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      })
    );

    // Display name from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    setDisplayName(profile?.display_name || "");

    // Stats
    const [journal, dreams, symbols, cycle] = await Promise.all([
      supabase.from("journal_entries").select("id", { count: "exact", head: true }),
      supabase.from("dream_entries").select("id", { count: "exact", head: true }),
      supabase.from("dream_symbols").select("id", { count: "exact", head: true }),
      supabase.from("cycle_entries").select("id", { count: "exact", head: true }),
    ]);

    setStats({
      journalCount: journal.count || 0,
      dreamCount: dreams.count || 0,
      symbolCount: symbols.count || 0,
      cycleCount: cycle.count || 0,
    });

    // Purchases
    const { data: purch } = await supabase
      .from("user_purchases")
      .select("product_id, purchased_at, shop_products(name, category, preview_emoji)")
      .order("purchased_at", { ascending: false });

    setPurchases((purch as any[]) || []);
    setLoading(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleResetTheme = async () => {
    await resetTheme();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center transition-colors duration-500" style={{ backgroundColor: "var(--color-cream)" }}>
        <p className="text-sm" style={{ color: "var(--color-dusty-rose)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ backgroundColor: "var(--color-cream)" }}>
      <header className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/dashboard")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>← Back</button>
          <div className="w-12" />
        </div>
        <h1 className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3" style={{ color: "var(--color-plum)", fontFamily: "'Antic Didone', Georgia, serif", fontWeight: 700 }}>Profile</h1>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-16 space-y-8">

        {/* User info */}
        <section className="text-center space-y-2 pt-4">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: "var(--color-blush)", color: "var(--color-plum)" }}>
            {displayName ? displayName.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()}
          </div>
          {displayName && (
            <p className="text-lg" style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>{displayName}</p>
          )}
          <p className="text-sm" style={{ color: "var(--color-mauve)" }}>{email}</p>
          <p className="text-xs" style={{ color: "var(--color-dusty-rose)" }}>Member since {memberSince}</p>
        </section>

        {/* Divider */}
        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
          <span className="text-xs" style={{ color: "var(--color-gold)", opacity: 0.6 }}>◇</span>
          <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
        </div>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-3">
          {[
            { label: "Journal entries", value: stats.journalCount, icon: "✎" },
            { label: "Dreams recorded", value: stats.dreamCount, icon: "☽" },
            { label: "Symbols available", value: stats.symbolCount, icon: "◈" },
            { label: "Cycle entries", value: stats.cycleCount, icon: "◯" },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-2xl border text-center transition-colors duration-500"
              style={{ backgroundColor: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
              <span className="text-lg" style={{ color: "var(--color-mauve)" }}>{s.icon}</span>
              <p className="text-2xl mt-1" style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: "var(--color-mauve)" }}>{s.label}</p>
            </div>
          ))}
        </section>

        {/* Active theme */}
        <section className="rounded-2xl border p-5 transition-colors duration-500" style={{ backgroundColor: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
          <h2 className="text-xs uppercase tracking-widest mb-3" style={{ color: "var(--color-mauve)", fontWeight: 600 }}>Active Theme</h2>
          {activeThemeName ? (
            <div className="flex items-center justify-between">
              <p className="text-base" style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>{activeThemeName}</p>
              <button onClick={handleResetTheme}
                className="text-xs px-3 py-1.5 rounded-lg border transition-all"
                style={{ borderColor: "var(--color-dusty-rose)", color: "var(--color-mauve)" }}>
                Reset to default
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm italic" style={{ color: "var(--color-mauve)" }}>Default Noctua palette</p>
              <button onClick={() => router.push("/shop")}
                className="text-xs px-3 py-1.5 rounded-lg border transition-all"
                style={{ borderColor: "var(--color-gold)", color: "var(--color-gold)" }}>
                Browse themes →
              </button>
            </div>
          )}
        </section>

        {/* Purchases */}
        {purchases.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest" style={{ color: "var(--color-mauve)", fontWeight: 600 }}>Your Purchases</h2>
            {purchases.map((p) => (
              <div key={p.product_id} className="flex items-center gap-3 p-3 rounded-xl border transition-colors duration-500"
                style={{ backgroundColor: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
                <span className="text-xl">{Array.isArray(p.shop_products) ? p.shop_products[0]?.preview_emoji : p.shop_products?.preview_emoji || "✦"}</span>
                <div className="flex-1">
                  <p className="text-sm" style={{ color: "var(--color-dark)", fontWeight: 500 }}>{Array.isArray(p.shop_products) ? p.shop_products[0]?.name : p.shop_products?.name || "Product"}</p>
                  <p className="text-xs" style={{ color: "var(--color-dusty-rose)" }}>
                    {new Date(p.purchased_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Sign out */}
        <section className="pt-4">
          <button onClick={handleLogout} disabled={loggingOut}
            className="w-full py-3 rounded-xl text-sm tracking-wide transition-all border"
            style={{ borderColor: "var(--color-dusty-rose)", color: "var(--color-mauve)", fontWeight: 500 }}>
            {loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </section>

      </main>
    </div>
  );
}