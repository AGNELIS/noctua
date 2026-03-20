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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-sm space-y-4 bg-slate-900 p-8 rounded-2xl"
      >
        <h1 className="text-2xl font-semibold text-slate-100 text-center">
          Join Noctua
        </h1>

        {error && (
          <p className="text-sm text-red-400 text-center">{error}</p>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-lg bg-slate-800 text-slate-100
                     placeholder-slate-500 border border-slate-700
                     focus:outline-none focus:border-indigo-500"
        />

        <input
          type="password"
          placeholder="Password (min. 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-4 py-3 rounded-lg bg-slate-800 text-slate-100
                     placeholder-slate-500 border border-slate-700
                     focus:outline-none focus:border-indigo-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-indigo-600 text-white
                     font-medium hover:bg-indigo-500 transition
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="text-sm text-slate-500 text-center">
          Already have an account?{" "}
          <a href="/login" className="text-indigo-400 hover:underline">
            Sign in
          </a>
        </p>
      </form>
    </div>
  );
}