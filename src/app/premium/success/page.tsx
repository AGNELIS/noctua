"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n";

function SuccessContent() {
  const router = useRouter();
  const { language } = useLanguage();
  const searchParams = useSearchParams();
  const pl = language === "pl";
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [hasBirthData, setHasBirthData] = useState(false);

  useEffect(() => {
    const verify = async () => {
      const sessionId = searchParams.get("session_id");
      if (!sessionId) { setStatus("error"); return; }

      const res = await fetch("/api/verify-stripe-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, expectedMode: "subscription" }),
      });
      const data = await res.json();
      if (!data.verified) { setStatus("error"); return; }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setStatus("error"); return; }

      const { data: profile } = await supabase.from("profiles").select("birth_date").eq("id", user.id).single();
      setHasBirthData(!!profile?.birth_date);
      setStatus("success");
    };
    verify();
  }, [searchParams]);

  return (
    <div className="max-w-md mx-auto px-6 text-center space-y-6 flex flex-col items-center justify-center">
      {status === "verifying" && (
        <p className="text-sm tracking-widest uppercase animate-pulse" style={{ color: "var(--color-mauve)" }}>
          {pl ? "Weryfikuję..." : "Verifying..."}
        </p>
      )}
      {status === "success" && (
        <>
          <div className="text-5xl mb-2" style={{ color: "var(--color-plum)", opacity: 0.4 }}>♡</div>
          <h1 className="text-2xl tracking-wide" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            {pl ? "Witaj w Premium!" : "Welcome to Premium!"}
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "var(--color-dark)" }}>
            {hasBirthData
              ? (pl ? "Masz teraz dostęp do wszystkich funkcji Noctua." : "You now have access to all Noctua features.")
              : (pl ? "Żeby odblokować workbooki planetarne, potrzebuję poznać twoją datę urodzenia." : "To unlock planetary workbooks, I need to know your birth date.")}
          </p>
          <button onClick={() => router.push(hasBirthData ? "/dashboard" : "/onboarding")} className="px-8 py-3 rounded-xl text-sm tracking-widest uppercase"
            style={{ backgroundColor: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}>
            {hasBirthData
              ? (pl ? "Przejdź do aplikacji" : "Enter the app")
              : (pl ? "Podaj datę urodzenia" : "Enter birth date")}
          </button>
        </>
      )}
      {status === "error" && (
        <>
          <h1 className="text-2xl tracking-wide" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            {pl ? "Coś poszło nie tak" : "Something went wrong"}
          </h1>
          <button onClick={() => router.push("/premium")} className="px-8 py-3 rounded-xl text-sm tracking-widest uppercase"
            style={{ backgroundColor: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}>
            {pl ? "Spróbuj ponownie" : "Try again"}
          </button>
        </>
      )}
    </div>
  );
}

export default function PremiumSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-gradient)" }}>
      <Suspense fallback={
        <p className="text-sm tracking-widest uppercase animate-pulse" style={{ color: "var(--color-mauve)" }}>Loading...</p>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  );
}