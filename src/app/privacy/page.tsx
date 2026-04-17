"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

export default function PrivacyPolicyPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const pl = language === "pl";

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ background: "var(--color-gradient)" }}>
      <header className="px-6 pt-5 pb-2">
        <button onClick={() => router.back()} className="text-sm tracking-wide" style={{ color: "var(--color-mauve)", fontWeight: 500 }}>
          {pl ? "← Wróć" : "← Back"}
        </button>
      </header>
      <main className="max-w-2xl mx-auto px-6 pb-16 space-y-6">
        <h1 className="text-2xl tracking-wide text-center" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          {pl ? "Polityka prywatności" : "Privacy Policy"}
        </h1>
        <p className="text-xs text-center" style={{ color: "var(--color-mauve)" }}>
          {pl ? "Ostatnia aktualizacja: kwiecień 2026" : "Last updated: April 2026"}
        </p>
        <div className="space-y-5 text-sm leading-relaxed" style={{ color: "var(--color-dark)" }}>

          <section>
            <h2 className="text-base mb-2" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
              {pl ? "Kim jesteśmy" : "Who we are"}
            </h2>
            <p>{pl
              ? "Noctua jest obsługiwana przez AGNÉLIS, jednoosobową działalność gospodarczą zarejestrowaną w Wielkiej Brytanii. Kontakt: contact.agnelis@gmail.com."
              : "Noctua is operated by AGNÉLIS, a sole trader registered in the United Kingdom. Contact: contact.agnelis@gmail.com."
            }</p>
          </section>

          <section>
            <h2 className="text-base mb-2" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
              {pl ? "Jakie dane zbieramy" : "What data we collect"}
            </h2>
            <p>{pl
              ? "Zbieramy dane, które dobrowolnie wprowadzasz do aplikacji: wpisy dziennika (treść, nastrój), wpisy snów (treść, symbole, ton emocjonalny), dane cyklu menstruacyjnego (daty, objawy, fazy), wpisy pracy z cieniem, oraz dane konta (email, imię, zdjęcie profilowe). Dane cyklu menstruacyjnego są klasyfikowane jako dane szczególnej kategorii zgodnie z UK GDPR i są przetwarzane wyłącznie na podstawie Twojej wyraźnej zgody."
              : "We collect data you voluntarily enter into the app: journal entries (content, mood), dream entries (content, symbols, emotional tone), menstrual cycle data (dates, symptoms, phases), shadow work entries, and account data (email, name, profile photo). Menstrual cycle data is classified as special category data under UK GDPR and is processed solely based on your explicit consent."
            }</p>
          </section>

          <section>
            <h2 className="text-base mb-2" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
              {pl ? "Jak wykorzystujemy Twoje dane" : "How we use your data"}
            </h2>
            <p>{pl
              ? "Twoje dane są wykorzystywane wyłącznie do: wyświetlania Twoich wpisów i śledzenia postępów, generowania spersonalizowanych raportów i wglądów (jeśli masz Premium), odczytu snów (realizowany przez Anthropic Claude API, dane są wysyłane w formie zanonimizowanej, bez Twojego imienia ani emaila), przetwarzania płatności (Stripe, nie przechowujemy danych karty). Nigdy nie sprzedajemy Twoich danych. Nigdy nie wyświetlamy reklam."
              : "Your data is used solely to: display your entries and track your progress, generate personalised reports and insights (if you have Premium), dream reading (processed via Anthropic Claude API in anonymised form without your name or email), process payments (via Stripe, we do not store card details). We never sell your data. We never display advertisements."
            }</p>
          </section>

          <section>
            <h2 className="text-base mb-2" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
              {pl ? "Gdzie przechowujemy dane" : "Where we store data"}
            </h2>
            <p>{pl
              ? "Dane są przechowywane na serwerach Supabase w regionie Frankfurt (UE). Dane są szyfrowane podczas przesyłania (TLS) i w spoczynku. Płatności są przetwarzane przez Stripe z siedzibą w UE/UK."
              : "Data is stored on Supabase servers in the Frankfurt region (EU). Data is encrypted in transit (TLS) and at rest. Payments are processed by Stripe, based in EU/UK."
            }</p>
          </section>

          <section>
            <h2 className="text-base mb-2" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
              {pl ? "Twoje prawa" : "Your rights"}
            </h2>
            <p>{pl
              ? "Zgodnie z UK GDPR masz prawo do: dostępu do swoich danych, poprawiania swoich danych, usunięcia swoich danych (prawo do bycia zapomnianym), eksportu swoich danych, wycofania zgody w dowolnym momencie. Aby skorzystać z tych praw, napisz na contact.agnelis@gmail.com."
              : "Under UK GDPR you have the right to: access your data, rectify your data, delete your data (right to be forgotten), export your data, withdraw consent at any time. To exercise these rights, email contact.agnelis@gmail.com."
            }</p>
          </section>

          <section>
            <h2 className="text-base mb-2" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
              {pl ? "Pliki cookie" : "Cookies"}
            </h2>
            <p>{pl
              ? "Używamy wyłącznie niezbędnych plików cookie do utrzymania sesji logowania. Nie używamy plików cookie śledzących, reklamowych ani analitycznych."
              : "We use only essential cookies to maintain your login session. We do not use tracking, advertising, or analytics cookies."
            }</p>
          </section>

          <section>
            <h2 className="text-base mb-2" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
              {pl ? "Przechowywanie danych" : "Data retention"}
            </h2>
            <p>{pl
              ? "Twoje dane są przechowywane tak długo, jak długo masz aktywne konto. Po usunięciu konta wszystkie dane są trwale usuwane w ciągu 30 dni."
              : "Your data is retained for as long as your account is active. Upon account deletion, all data is permanently removed within 30 days."
            }</p>
          </section>

          <section>
            <h2 className="text-base mb-2" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
              {pl ? "Kontakt" : "Contact"}
            </h2>
            <p>{pl
              ? "W sprawie pytań dotyczących prywatności: contact.agnelis@gmail.com. Masz również prawo złożyć skargę do Information Commissioner's Office (ICO) w Wielkiej Brytanii."
              : "For privacy-related questions: contact.agnelis@gmail.com. You also have the right to lodge a complaint with the Information Commissioner's Office (ICO) in the United Kingdom."
            }</p>
          </section>

        </div>
      </main>
    </div>
  );
}