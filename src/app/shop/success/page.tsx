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

  useEffect(() => {
    const verify = async () => {
      const sessionId = searchParams.get("session_id");
      const productId = searchParams.get("product_id");
      if (!sessionId || !productId) { setStatus("error"); return; }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setStatus("error"); return; }

      const { data: existing } = await supabase.from("user_purchases")
        .select("id").eq("user_id", user.id).eq("product_id", productId).limit(1);

      if (existing && existing.length > 0) {
        setStatus("success");
        return;
      }

      const { error } = await supabase.from("user_purchases")
        .insert({ user_id: user.id, product_id: productId, stripe_session_id: sessionId });

      setStatus(error ? "error" : "success");
    };
    verify();
  }, [searchParams]);

  return (
    <div className="max-w-md mx-auto px-6 text-center space-y-6">
      {status === "verifying" && (
        <p className="text-sm tracking-widest uppercase animate-pulse" style={{ color: "var(--color-mauve)" }}>
          {pl ? "Weryfikuję płatność..." : "Verifying payment..."}
        </p>
      )}
      {status === "success" && (
        <>
          <div className="text-5xl mb-2" style={{ color: "var(--color-plum)", opacity: 0.4 }}>◇</div>
          <h1 className="text-2xl tracking-wide" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            {pl ? "Zakup udany!" : "Purchase complete!"}
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "var(--color-dark)" }}>
            {pl ? "Twój zakup został zapisany. Możesz teraz korzystać z nowej zawartości." : "Your purchase has been saved. You can now access your new content."}
          </p>
          <button onClick={() => router.push("/shop")} className="px-8 py-3 rounded-xl text-sm tracking-widest uppercase"
            style={{ backgroundColor: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}>
            {pl ? "Wróć do sklepu" : "Back to shop"}
          </button>
        </>
      )}
      {status === "error" && (
        <>
          <h1 className="text-2xl tracking-wide" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            {pl ? "Coś poszło nie tak" : "Something went wrong"}
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "var(--color-dark)" }}>
            {pl ? "Spróbuj ponownie lub skontaktuj się z nami." : "Please try again or contact us."}
          </p>
          <button onClick={() => router.push("/shop")} className="px-8 py-3 rounded-xl text-sm tracking-widest uppercase"
            style={{ backgroundColor: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}>
            {pl ? "Wróć do sklepu" : "Back to shop"}
          </button>
        </>
      )}
    </div>
  );
}

export default function PurchaseSuccessPage() {
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