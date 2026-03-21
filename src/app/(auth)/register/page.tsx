"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

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
          Join Noctua
        </h1>

        {error && (
          <p className="text-sm text-center" style={{ color: "#c45050" }}>{error}</p>
        )}

        <input
          type="email"
          placeholder="Email"
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
          placeholder="Password (min. 8 characters)"
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
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="text-sm text-center" style={{ color: "#9b8a7a" }}>
          Already have an account?{" "}
          <a href="/login" style={{ color: "#6b5270" }}>
            Sign in
          </a>
        </p>
      </form>
    </div>
  );
}