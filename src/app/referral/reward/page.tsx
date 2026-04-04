"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

type SavedContent = {
  id: string;
  content_text: string;
  created_at: string;
};

function RewardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "personal_letter";
  const { language } = useLanguage();
  const pl = language === "pl";

  const [text, setText] = useState<string | null>(null);
  const [history, setHistory] = useState<SavedContent[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
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

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data } = await supabase
      .from("referral_content")
      .select("*")
      .eq("user_id", user.id)
      .eq("content_type", type)
      .eq("language", language)
      .order("created_at", { ascending: false });

    setHistory((data as SavedContent[]) || []);
    setLoading(false);
  };

  const generate = async () => {
    setGenerating(true);
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

        // Save to database
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("referral_content").insert({
            user_id: user.id,
            content_type: type,
            content_text: data.text,
            language,
          });
          await loadHistory();
        }
      } else {
        setError(data.error || (pl ? "Generowanie nie powiodlo sie." : "Generation failed."));
      }
    } catch {
      setError(pl ? "Cos poszlo nie tak." : "Something went wrong.");
    }
    setGenerating(false);
  };

  const title = titles[type] || titles.personal_letter;
  const desc = descriptions[type] || descriptions.personal_letter;

  const renderText = (content: string) => (
    <div className="space-y-2">
      {content.split("\n").map((line: string, i: number) => {
        if (!line.trim()) return <div key={i} className="h-3" />;
        const isHeading = /^[A-ZŻŹĆĄŚĘŁÓŃ]/.test(line.trim()) && line.trim().length < 40 && !line.trim().includes(".");
        const isSignature = line.trim() === "AGNELIS";
        return isSignature ? (
          <p key={i} className="mt-8 text-right" style={{ color: "var(--color-plum)", fontWeight: 500, fontStyle: "italic", fontSize: "1rem" }}>
            {line.trim()}
          </p>
        ) : isHeading ? (
          <p key={i} className="mt-6 mb-2" style={{ color: "var(--color-plum)", fontWeight: 600, fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.2rem" }}>
            {line.trim()}
          </p>
        ) : (
          <p key={i} className="leading-relaxed" style={{ color: "var(--color-dark)", textAlign: "justify", fontSize: "0.95rem", lineHeight: "1.8" }}>
            {line.trim()}
          </p>
        );
      })}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-gradient)" }}>
        <p className="text-sm" style={{ color: "var(--color-dusty-rose)" }}>{pl ? "Ladowanie..." : "Loading..."}</p>
      </div>
    );
  }

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

        {/* Newly generated text */}
        {text && (
          <div className="pt-6 space-y-6">
            <div className="rounded-2xl border p-6" style={{ background: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
              {renderText(text)}
            </div>
            <div className="text-center">
              <button onClick={() => setText(null)} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)" }}>
                {pl ? "Zamknij" : "Close"}
              </button>
            </div>
          </div>
        )}

        {/* Generate button */}
        {!text && !generating && (
          <div className="text-center pt-10 space-y-6">
            <div className="text-4xl" style={{ color: "var(--color-plum)", opacity: 0.3 }}>◈</div>
            <p className="text-base leading-relaxed" style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.05rem" }}>
              {pl ? desc.pl : desc.en}
            </p>
            <button onClick={generate} className="px-8 py-3 rounded-xl text-sm tracking-widest uppercase"
              style={{ backgroundColor: "var(--color-plum)", color: "var(--color-cream)", fontWeight: 600 }}>
              {pl ? "Wygeneruj" : "Generate"}
            </button>
            {error && <p className="text-sm mt-3" style={{ color: "var(--color-dusty-rose)" }}>{error}</p>}
          </div>
        )}

        {/* Generating */}
        {generating && (
          <div className="text-center pt-20">
            <p className="text-sm tracking-widest uppercase animate-pulse" style={{ color: "var(--color-mauve)" }}>
              {pl ? "Pisze do ciebie..." : "Writing to you..."}
            </p>
          </div>
        )}

        {/* History */}
        {!text && !generating && history.length > 0 && (
          <div className="space-y-3 pt-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
              <span className="text-xs uppercase tracking-widest" style={{ color: "var(--color-mauve)" }}>
                {pl ? "Historia" : "History"}
              </span>
              <div className="h-px w-16" style={{ background: "var(--color-dusty-rose)" }} />
            </div>

            {history.map((item) => {
              const isExpanded = expandedId === item.id;
              const date = new Date(item.created_at).toLocaleDateString(pl ? "pl-PL" : "en-GB", {
                day: "numeric", month: "long", year: "numeric",
              });

              return (
                <div key={item.id} className="rounded-2xl border transition-colors duration-500"
                  style={{ backgroundColor: "var(--color-blush)", borderColor: "var(--color-dusty-rose)" }}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="w-full text-left p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-base" style={{ color: "var(--color-dark)", fontWeight: 500, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                        {date}
                      </p>
                      <span className="text-sm" style={{ color: "var(--color-mauve)", transition: "transform 0.3s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                        ▾
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5" style={{ borderTop: "1px solid var(--color-dusty-rose)" }}>
                      <div className="pt-4">
                        {renderText(item.content_text)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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