"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
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
        onSubmit={handleSubmit}
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
          Set new password
        </h1>

        <p className="text-sm text-center leading-relaxed" style={{ color: "#9b8a7a" }}>
          Choose a new password for your account.
        </p>

        {error && (
          <p className="text-sm text-center" style={{ color: "#c45050" }}>{error}</p>
        )}

        <input
          type="password"
          placeholder="New password (min. 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
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
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}