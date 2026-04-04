"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

function RewardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "personal_letter";
  const { language } = useLanguage();
  const pl = language === "pl";

  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titles: Record<string, { en: string; pl: string }> = {
    personal_letter: { en: "Personal Letter", pl: "Osobisty list" },
    deep_reading: { en: "Deep Reading", pl: "Gleboki odczyt" },
    shadow_mirror: { en: "Shadow Mirror", pl: "Lustro cienia" },
  };

  const descriptions: Record<string, { en: string; pl: string }> = {
    personal_letter: {
      en: "A letter from AGNELIS based on your entire journey in Noctua. Not a report. A letter from someone who sees you.",
      pl: "List od AGNELIS oparty na calej twojej podrozy w Noctui. Nie raport. List od kogos, kto cie widzi.",
    },
    deep_reading: {
      en: "An extended reading spanning your entire history. Patterns across months. What cycles, what stays, what is silent.",
      pl: "Rozszerzony odczyt obejmujacy cala twoja historie. Wzorce z wielu miesiecy. Co sie powtarza, co zostaje, co milczy.",
    },
    shadow_mirror: {
      en: "Your complete shadow work journey reflected back. Where you started, what shifted, what remains, and what you cannot see yourself.",
      pl: "Cala twoja podroz z praca z cieniem odbita jak w lustrze. Skad przyszlas, co sie zmienilo, co zostaje, i czego sama nie widzisz.",
    },
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/personal-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, type }),
      });
      const data = await res.json();
      if (res.ok) {
        setText(data.text);
      } else {
        setError(data.error || (pl ? "Generowanie nie powiodlo sie." : "Generation failed."));
      }
    } catch {
      setError(pl ? "Cos poszlo nie tak." : "Something went wrong.");
    }
    setLoading(false);
  };

  const title = titles[type] || titles.personal_letter;
  const desc = descriptions[type] || descriptions.personal_letter;

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
      <header className="px-6 pt-5 pb-2">
        <button onClick={() => router.push("/referral")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
          ← {pl ? "Wroc" : "Back"}
        </button>
        <h1 className="text-lg md:text-xl tracking-[0.25em] uppercase text-center mt-3"
          style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>
          {pl ? title.pl : title.en}
        </h1>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-16">
        {!text && !loading && (
          <div className="text-center pt-12 space-y-6">
            <div className="text-4xl" style={{ color: "var(--color-plum)", opacity: 0.3 }}>◈</div>
            <p className="text-base leading-relaxed" style={{ color: "var(--color-dark)" }}>
              {pl ? desc.pl : desc.en}
            </p>
            <button onClick={generate} className="px-8 py-3 rounded-xl text-sm tracking-widest uppercase"
              style={{ backgroundColor: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}>
              {pl ? "Wygeneruj" : "Generate"}
            </button>
            {error && <p className="text-sm" style={{ color: "var(--color-dusty-rose)" }}>{error}</p>}
          </div>
        )}

        {loading && (
          <div className="text-center pt-20">
            <p className="text-sm tracking-widest uppercase animate-pulse" style={{ color: "var(--color-mauve)" }}>
              {pl ? "Pisze do ciebie..." : "Writing to you..."}
            </p>
          </div>
        )}

        {text && (
          <div className="pt-6 space-y-6">
            <div className="rounded-2xl border p-5" style={{ background: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
              <div className="space-y-1">
                {text.split("\n").map((line: string, i: number) => {
                  if (!line.trim()) return <div key={i} className="h-2" />;
                  const isHeading = /^[A-ZŻŹĆĄŚĘŁÓŃ]/.test(line.trim()) && line.trim().length < 40 && !line.trim().includes(".");
                  const isSignature = line.trim() === "AGNELIS";
                  return isSignature ? (
                    <p key={i} className="text-sm mt-6 text-right" style={{ color: "var(--color-plum)", fontWeight: 500, fontStyle: "italic" }}>
                      {line.trim()}
                    </p>
                  ) : isHeading ? (
                    <p key={i} className="text-base mt-5 mb-1" style={{ color: "var(--color-plum)", fontWeight: 600, fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.1rem" }}>
                      {line.trim()}
                    </p>
                  ) : (
                    <p key={i} className="text-sm leading-relaxed" style={{ color: "var(--color-dark)", textAlign: "justify" }}>
                      {line.trim()}
                    </p>
                  );
                })}
              </div>
            </div>
            <div className="text-center">
              <button onClick={() => router.push("/referral")} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)" }}>
                {pl ? "Wroc do zaproszen" : "Back to invitations"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function RewardPage() {
  return (
    <Suspense>
      <RewardContent />
    </Suspense>
  );
}