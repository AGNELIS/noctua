"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useLanguage } from "@/lib/i18n";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // If registered via referral link, create referral record
    if (refCode && data.user) {
      const { data: referrerProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("referral_code", refCode)
        .single();

      if (referrerProfile) {
        await supabase.from("referrals").insert({
          referrer_id: referrerProfile.id,
          referred_id: data.user.id,
          referral_code: refCode,
          status: "pending",
        });
      }
    }

    router.replace("/dashboard");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        background: `
          radial-gradient(ellipse at 50% 0%, rgba(74,37,69,0.1) 0%, transparent 50%),
          linear-gradient(to bottom, #FAF7F5, #F5EBE8, #FAF7F5)
        `,
      }}
    >
      <form
        onSubmit={handleRegister}
        className="w-full max-w-sm space-y-5 p-8 rounded-2xl"
        style={{
          background: "rgba(255,255,255,0.6)",
          border: "1px solid rgba(212,181,199,0.3)",
        }}
      >
        <h1
          className="text-2xl text-center font-light tracking-wide"
          style={{ color: "#3d2e4a", fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          {t("auth_register_title")}
        </h1>

        {refCode && (
          <p className="text-xs text-center" style={{ color: "#9b8a7a" }}>
            {"You've been invited to Noctua"}
          </p>
        )}

        {error && (
          <p className="text-sm text-center" style={{ color: "#c45050" }}>{error}</p>
        )}

        <input
          type="email"
          placeholder={t("auth_email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder:text-[#c4b0a0]"
          style={{
            background: "rgba(255,255,255,0.5)",
            border: "1px solid rgba(212,181,199,0.3)",
            color: "#3d2e4a",
          }}
        />

        <input
          type="password"
          placeholder={t("auth_password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder:text-[#c4b0a0]"
          style={{
            background: "rgba(255,255,255,0.5)",
            border: "1px solid rgba(212,181,199,0.3)",
            color: "#3d2e4a",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl text-sm text-white transition-all disabled:opacity-50"
          style={{ background: "#6b5270" }}
        >
          {loading ? t("auth_registering") : t("auth_register")}
        </button>

        <p className="text-sm text-center" style={{ color: "#9b8a7a" }}>
          {t("auth_have_account")}{" "}
          <a href="/login" style={{ color: "#6b5270" }}>
            {t("auth_sign_in")}
          </a>
        </p>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}