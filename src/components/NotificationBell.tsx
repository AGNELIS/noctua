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

export default function NotificationBell() {
  const router = useRouter();
  const { language } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    setTimeout(() => document.addEventListener("click", close), 10);
    return () => document.removeEventListener("click", close);
  }, [open]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const notifs = (data as Notification[]) || [];
    setNotifications(notifs);
    setUnreadCount(notifs.filter(n => !n.is_read).length);
  };

  const markAllRead = async () => {
    const supabase = createClient();
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    for (const id of unreadIds) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleClick = (notif: Notification) => {
    if (notif.link) {
      router.push(notif.link);
      setOpen(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (language === "pl") {
      if (mins < 60) return `${mins} min temu`;
      if (hours < 24) return `${hours}h temu`;
      return `${days}d temu`;
    }
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => { setOpen(!open); if (!open && unreadCount > 0) markAllRead(); }}
        style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: "4px" }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-plum)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: "0",
            right: "0",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            background: "var(--color-plum)",
            color: "var(--color-cream)",
            fontSize: "9px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "fixed",
          top: "60px",
          right: "16px",
          width: "min(300px, calc(100vw - 32px))",
          maxHeight: "350px",
          overflowY: "auto",
          borderRadius: "16px",
          background: "#FAF7F5",
          border: "1px solid rgba(180,150,170,0.4)",
          boxShadow: "0 8px 32px rgba(42,26,40,0.2)",
          backdropFilter: "blur(20px)",
          opacity: 1,
          zIndex: 99999,
        }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-dusty-rose)" }}>
            <p style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--color-plum)", fontWeight: 600 }}>
              {language === "pl" ? "Powiadomienia" : "Notifications"}
            </p>
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center" }}>
              <p style={{ fontSize: "13px", color: "var(--color-mauve)", opacity: 0.6 }}>
                {language === "pl" ? "Brak powiadomień" : "No notifications yet"}
              </p>
            </div>
          ) : (
            notifications.map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 16px",
                  borderBottom: "1px solid color-mix(in srgb, var(--color-dusty-rose) 30%, transparent)",
                  background: n.is_read ? "transparent" : "color-mix(in srgb, var(--color-blush) 50%, transparent)",
                  cursor: n.link ? "pointer" : "default",
                  border: "none",
                  transition: "background 0.2s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: "13px",
                      color: "var(--color-dark)",
                      fontWeight: n.is_read ? 400 : 600,
                      marginBottom: "2px",
                    }}>
                      {language === "pl" ? n.title_pl : n.title_en}
                    </p>
                    {(language === "pl" ? n.body_pl : n.body_en) && (
                      <p style={{ fontSize: "11px", color: "var(--color-mauve)", lineHeight: 1.4 }}>
                        {language === "pl" ? n.body_pl : n.body_en}
                      </p>
                    )}
                  </div>
                  <span style={{ fontSize: "10px", color: "var(--color-dusty-rose)", whiteSpace: "nowrap", marginTop: "2px" }}>
                    {timeAgo(n.created_at)}
                  </span>
                </div>
                {!n.is_read && (
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-plum)", position: "absolute", right: "16px", top: "50%", marginTop: "-3px" }} />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}