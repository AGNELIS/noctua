"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";

type Stats = {
  journalCount: number;
  dreamCount: number;
  symbolCount: number;
  cycleCount: number;
};

export default function ProfilePage() {
  const router = useRouter();
  const { activeThemeName, resetTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({ journalCount: 0, dreamCount: 0, symbolCount: 0, cycleCount: 0 });
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [createdAt, setCreatedAt] = useState("");

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    setEmail(user.email || "");
    setCreatedAt(user.created_at);

    const { data: profile } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).single();
    setDisplayName(profile?.display_name || "");
    setAvatarUrl(profile?.avatar_url || null);

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

    const { data: purch } = await supabase
      .from("user_purchases")
      .select("product_id, purchased_at, shop_products(name, category, preview_emoji)")
      .order("purchased_at", { ascending: false });
    setPurchases((purch as any[]) || []);
    setLoading(false);
  };
const saveName = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ display_name: nameInput.trim() || null }).eq("id", user.id);
    setDisplayName(nameInput.trim());
    setEditingName(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2MB");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const url = urlData.publicUrl + "?t=" + Date.now();

    await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);

    setAvatarUrl(url);
    setUploading(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleResetTheme = async () => { await resetTheme(); };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
        <p className="text-sm" style={{ color: "var(--color-dusty-rose)" }}>Loading...</p>
      </div>
    );
  }

  const initial = displayName ? displayName.charAt(0).toUpperCase() : email.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
      <header className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/dashboard")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>← {t("back")}</button>
          <div className="w-12" />
        </div>
        <h1 className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3" style={{ color: "var(--color-plum)", fontFamily: "'Antic Didone', Georgia, serif", fontWeight: 700 }}>{t("profile_title")}</h1>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-16 space-y-8">

        {/* Avatar + user info */}
        <section className="text-center space-y-2 pt-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="relative w-20 h-20 mx-auto rounded-full overflow-hidden flex items-center justify-center text-2xl transition-all hover:scale-105 group"
            style={{ backgroundColor: "var(--color-blush)", color: "var(--color-plum)" }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{initial}</span>
            )}
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: "rgba(42,26,40,0.4)" }}
            >
              <span className="text-xs" style={{ color: "#ffffff" }}>
                {uploading ? "..." : "Edit"}
              </span>
            </div>
          </button>
          <p className="text-xs" style={{ color: "var(--color-dusty-rose)" }}>{uploading ? t("profile_uploading") : t("profile_tap_photo")}</p>
          {editingName ? (
            <div className="flex items-center justify-center gap-2 mt-1">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Your name"
                className="text-center text-lg outline-none border-b transition-colors duration-500"
                style={{
                  color: "var(--color-dark)",
                  borderColor: "var(--color-dusty-rose)",
                  backgroundColor: "transparent",
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontWeight: 600,
                  width: "180px",
                }}
                autoFocus
              />
              <button onClick={saveName} className="text-sm px-3 py-1 rounded-lg"
                style={{ background: "var(--color-plum)", color: "var(--color-cream)" }}>{t("save")}</button>
              <button onClick={() => setEditingName(false)} className="text-sm"
                style={{ color: "var(--color-mauve)" }}>✕</button>
            </div>
          ) : (
            <button onClick={() => { setNameInput(displayName); setEditingName(true); }} className="mt-1 transition-all hover:opacity-70">
              {displayName ? (
                <p style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, fontSize: "1.75rem" }}>{displayName}</p>
              ) : (
                <p className="text-sm italic" style={{ color: "var(--color-dusty-rose)" }}>{t("profile_add_name")}</p>
              )}
            </button>
          )}
          <p className="text-sm" style={{ color: "var(--color-mauve)" }}>{email}</p>
          <p className="text-base italic" style={{ color: "var(--color-dusty-rose)" }}>{createdAt ? (language === "pl" ? `W Noctui od ${Math.max(1, Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)))} dni` : `In Noctua for ${Math.max(1, Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)))} days`) : ""}</p>
        </section>

        {/* Divider */}
        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
          <span className="text-xs" style={{ color: "var(--color-gold)", opacity: 0.6 }}>◇</span>
          <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
        </div>

        {/* Journey stats */}
        <section className="rounded-2xl border p-5 transition-colors duration-500" style={{ backgroundColor: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
          <p className="text-center mb-4" style={{ fontSize: "12px", color: "var(--color-mauve)", textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 500 }}>{language === "pl" ? "Twoja podróż" : "Your journey"}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
            {[
              { label: language === "pl" ? "Wpisy" : "Entries", value: stats.journalCount },
              { label: language === "pl" ? "Sny" : "Dreams", value: stats.dreamCount },
              { label: language === "pl" ? "Symbole" : "Symbols", value: stats.symbolCount },
              { label: language === "pl" ? "Cykl" : "Cycle", value: stats.cycleCount },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p style={{ fontSize: "28px", color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", lineHeight: 1, fontWeight: 600 }}>{s.value}</p>
                <p style={{ fontSize: "11px", color: "var(--color-dark)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "6px", fontWeight: 500 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </section>

{/* Language & Theme */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <p style={{ fontSize: "14px", color: "var(--color-mauve)", letterSpacing: "0.05em", fontWeight: 500 }}>{t("profile_language")}</p>
            <div className="flex items-center rounded-full overflow-hidden border" style={{ borderColor: "var(--color-dusty-rose)" }}>
              <button onClick={() => setLanguage("en")} className="px-3 py-1.5 text-xs tracking-wide transition-all duration-300" style={{ backgroundColor: language === "en" ? "var(--color-plum)" : "transparent", color: language === "en" ? "var(--color-cream)" : "var(--color-mauve)", fontWeight: language === "en" ? 600 : 400 }}>EN</button>
              <button onClick={() => setLanguage("pl")} className="px-3 py-1.5 text-xs tracking-wide transition-all duration-300" style={{ backgroundColor: language === "pl" ? "var(--color-plum)" : "transparent", color: language === "pl" ? "var(--color-cream)" : "var(--color-mauve)", fontWeight: language === "pl" ? 600 : 400 }}>PL</button>
            </div>
          </div>
          <div className="h-px" style={{ background: "var(--color-dusty-rose)", opacity: 0.3 }} />
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: "14px", color: "var(--color-mauve)", letterSpacing: "0.05em", fontWeight: 500 }}>{t("profile_active_theme")}</p>
              <p className="mt-1 italic" style={{ fontSize: "16px", color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>{activeThemeName || t("profile_default_theme")}</p>
            </div>
            {activeThemeName ? (
              <button onClick={handleResetTheme} className="text-sm" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>{t("profile_reset_theme")}</button>
            ) : (
              <button onClick={() => router.push("/shop")} className="text-sm" style={{ color: "var(--color-gold)", fontWeight: 500 }}>{t("profile_browse_themes")}</button>
            )}
          </div>
        </section>

        {/* Sign out */}
        <section className="pt-4">
          <button onClick={handleLogout} disabled={loggingOut}
            className="w-full py-3 rounded-xl text-sm tracking-wide transition-all border"
            style={{ borderColor: "var(--color-dusty-rose)", color: "var(--color-mauve)", fontWeight: 500 }}>
            {loggingOut ? t("profile_signing_out") : t("sign_out")}
          </button>
        </section>

      </main>
    </div>
  );
}