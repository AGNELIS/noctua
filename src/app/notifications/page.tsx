"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n";

type Notification = {
  id: string;
  type: string;
  title_en: string;
  title_pl: string;
  body_en: string | null;
  body_pl: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const pl = language === "pl";
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    const notifs = (data as Notification[]) || [];
    setNotifications(notifs);
    setLoading(false);

    // Mark all as read
    const unread = notifs.filter(n => !n.is_read);
    if (unread.length > 0) {
      for (const n of unread) {
        await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
      }
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (pl) {
      if (mins < 60) return `${mins} min temu`;
      if (hours < 24) return `${hours}h temu`;
      if (days === 1) return "wczoraj";
      return `${days} dni temu`;
    }
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "yesterday";
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
      <header className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/dashboard")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
            ← {pl ? "Wróć" : "Back"}
          </button>
          <div className="w-12" />
        </div>
        <h1 className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>
          {pl ? "Powiadomienia" : "Notifications"}
        </h1>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-16 pt-4">
        {loading ? (
          <p className="text-center text-sm pt-12" style={{ color: "var(--color-dusty-rose)" }}>
            {pl ? "Ładowanie..." : "Loading..."}
          </p>
        ) : notifications.length === 0 ? (
          <div className="text-center pt-16 space-y-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-dusty-rose)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto" style={{ opacity: 0.4 }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p className="text-sm" style={{ color: "var(--color-mauve)", opacity: 0.6 }}>
              {pl ? "Brak powiadomień. Wszystko w swoim czasie." : "No notifications yet. Everything in its time."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => (
              <button
                key={n.id}
                onClick={() => n.link && router.push(n.link)}
                className="w-full text-left rounded-2xl border p-4 transition-all duration-300"
                style={{
                  background: n.is_read ? "var(--color-blush)" : "color-mix(in srgb, var(--color-blush) 70%, var(--color-cream))",
                  borderColor: n.is_read ? "var(--color-dusty-rose)" : "var(--color-mauve)",
                  cursor: n.link ? "pointer" : "default",
                }}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {!n.is_read && (
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-plum)", flexShrink: 0 }} />
                      )}
                      <p style={{
                        fontSize: "14px",
                        color: "var(--color-dark)",
                        fontWeight: n.is_read ? 400 : 600,
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                      }}>
                        {pl ? n.title_pl : n.title_en}
                      </p>
                    </div>
                    {(pl ? n.body_pl : n.body_en) && (
                      <p className="mt-1" style={{ fontSize: "12px", color: "var(--color-mauve)", lineHeight: 1.5 }}>
                        {pl ? n.body_pl : n.body_en}
                      </p>
                    )}
                  </div>
                  <span style={{ fontSize: "10px", color: "var(--color-dusty-rose)", whiteSpace: "nowrap", marginTop: "3px" }}>
                    {timeAgo(n.created_at)}
                  </span>
                </div>
                {n.link && (
                  <p className="mt-2 text-right" style={{ fontSize: "11px", color: "var(--color-plum)", fontWeight: 500 }}>
                    {pl ? "Otwórz →" : "Open →"}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
