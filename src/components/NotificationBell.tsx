"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NotificationBell() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      setUnreadCount(count || 0);
    };
    load();
  }, []);

  return (
    <button
      onClick={() => router.push("/notifications")}
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
  );
}