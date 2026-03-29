"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) { setError(error.message); setLoading(false); }
    else { setSuccess(true); setLoading(false); }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(74,37,69,0.1) 0%, transparent 50%), linear-gradient(to bottom, #FAF7F5, #F5EBE8, #FAF7F5)" }}>
        <div className="w-full max-w-sm space-y-5 p-8 rounded-2xl text-center" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(212,181,199,0.3)" }}>
          <h1 className="text-2xl font-light tracking-wide" style={{ color: "#3d2e4a", fontFamily: "Georgia, serif" }}>{t("auth_reset_title")}</h1>
          <p className="text-sm leading-relaxed" style={{ color: "#6b5270" }}>{t("auth_reset_sent")}</p>
          <Link href="/login" className="inline-block text-sm" style={{ color: "#6b5270" }}>{t("auth_reset_back")}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(74,37,69,0.1) 0%, transparent 50%), linear-gradient(to bottom, #FAF7F5, #F5EBE8, #FAF7F5)" }}>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5 p-8 rounded-2xl" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(212,181,199,0.3)" }}>
        <h1 className="text-2xl text-center font-light tracking-wide" style={{ color: "#3d2e4a", fontFamily: "Georgia, serif" }}>{t("auth_reset_title")}</h1>
        <p className="text-sm text-center leading-relaxed" style={{ color: "#9b8a7a" }}>{t("auth_reset_subtitle")}</p>
        {error && <p className="text-sm text-center" style={{ color: "#c45050" }}>{error}</p>}
        <input type="email" placeholder={t("auth_email")} value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder:text-[#c4b0a0]" style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(212,181,199,0.3)", color: "#3d2e4a" }} />
        <button type="submit" disabled={loading} className="w-full py-3 rounded-xl text-sm transition-all disabled:opacity-50" style={{ background: "#6b5270", color: "#ffffff" }}>{loading ? t("auth_reset_sending") : t("auth_reset_send")}</button>
        <p className="text-sm text-center" style={{ color: "#9b8a7a" }}><Link href="/login" style={{ color: "#6b5270" }}>{t("auth_reset_back")}</Link></p>
      </form>
    </div>
  );
}