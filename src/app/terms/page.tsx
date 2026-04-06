"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

export default function TermsPage() {
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
          {pl ? "Regulamin" : "Terms of Service"}
        </h1>
        <p className="text-xs text-center" style={{ color: "var(--color-mauve)" }}>
          {pl ? "Ostatnia aktualizacja: kwiecień 2026" : "Last updated: April 2026"}
        </p>
        <div className="space-y-5 text-sm leading-relaxed" style={{ color: "var(--color-dark)" }}>

          <section>
            <h2 className="text-base mb-2" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
              {pl ? "O Noctua" : "About Noctua"}
            </h2>
            <p>{pl
              ? "Noctua jest aplikacją do samorefleksji, śledzenia snów, cyklu menstruacyjnego i pracy z cieniem. Noctua jest obsługiwana przez AGNÉLIS, jednoosobową działalność gospodarczą zarejestrowaną w Wielkiej Brytanii."
              : "Noctua is a self-reflection app for dream tracking, menstrual cycle tracking, and shadow work. Noctua is operated by AGNÉLIS, a sole trader registered in the United Kingdom."
            }</p>
          </section>

          <section>
            <h2 className="text-base mb-2" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
              {pl ? "Zastrzeżenie dotyczące AI" : "AI Disclaimer"}
            </h2>
            <p style={{ fontWeight: 600 }}>{pl
              ? "Noctua wykorzystuje sztuczną inteligencję (AI) do generowania analiz snów, raportów i wglądów. Treści generowane przez AI nie stanowią porady medycznej, psychologicznej, psychiatrycznej ani terapeutycznej. Noctua nie jest zamiennikiem profesjonalnej opieki zdrowotnej. Jeśli doświadczasz kryzysu psychicznego, skontaktuj się z profesjonalistą lub zadzwoń pod numer alarmowy."
              : "Noctua uses artificial intelligence (AI) to generate dream analyses, reports, and insights. AI-generated content does not constitute medical, psychological, psychiatric, or therapeutic advice. Noctua is not a substitute for professional healthcare. If you are experiencing a mental health crisis, please contact a professional or call emergency services."
            }</p>
          </section>

          <section>
            <h2 className="text-base mb-2" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
              {pl ? "Konto" : "Account"}
            </h2>
            <p>{pl
              ? "Musisz mieć ukończone 16 lat, aby korzystać z Noctua. Jesteś odpowiedzialna za bezpieczeństwo swojego konta i hasła. Jedno konto na osobę."
              : "You must be at least 16 years old to use Noctua. You are responsible for maintaining the security of your account and password. One account per person."
            }</p>
          </section>

          <section>
            <h2 className="text-base mb-2" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
              {pl ? "Płatności i subskrypcje" : "Payments & Subscriptions"}
            </h2>
            <p>{pl
              ? "Płatności są przetwarzane przez Stripe. Subskrypcje odnawiają się automatycznie. Możesz anulować subskrypcję w dowolnym momencie. Jednorazowe zakupy nie podlegają zwrotowi po dostarczeniu treści cyfrowej. W przypadku problemów z płatnością skontaktuj się z contact.agnelis@gmail.com."
              : "Payments are processed by Stripe. Subscriptions renew automatically. You may cancel your subscription at any time. One-time purchases are non-refundable once digital content has been delivered. For payment issues, contact contact.agnelis@gmail.com."
            }</p>
          </section>

          <section>
            <h2 className="text-base mb-2" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
              {pl ? "Twoje treści" : "Your content"}
            </h2>
            <p>{pl
              ? "Wszystko co wpisujesz w Noctua (dziennik, sny, wpisy) należy do Ciebie. Nie wykorzystujemy Twoich treści do celów marketingowych ani nie udostępniamy ich osobom trzecim. Treści mogą być przetwarzane przez AI wyłącznie w celu generowania spersonalizowanych wglądów dla Ciebie."
              : "Everything you write in Noctua (journal, dreams, entries) belongs to you. We do not use your content for marketing purposes or share it with third parties. Content may be processed by AI solely to generate personalised insights for you."
            }</p>
          </section>

          <section>
            <h2 className="text-base mb-2" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
              {pl ? "Ograniczenie odpowiedzialności" : "Limitation of liability"}
            </h2>
            <p>{pl
              ? "Noctua jest dostarczana w stanie takim, jaki jest. Nie gwarantujemy, że aplikacja będzie działać bez przerw. AGNÉLIS nie ponosi odpowiedzialności za decyzje podjęte na podstawie treści generowanych przez AI."
              : "Noctua is provided on an \"as is\" basis. We do not guarantee uninterrupted service. AGNÉLIS is not liable for decisions made based on AI-generated content."
            }</p>
          </section>

          <section>
            <h2 className="text-base mb-2" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
              {pl ? "Program poleceń" : "Referral Programme"}
            </h2>
            <p>{pl
              ? "Noctua oferuje program poleceń, w którym możesz zapraszać inne osoby i odblokowywać nagrody. Zaproszona osoba musi założyć konto i dokonać minimum 3 wpisów (dziennik, sny lub praca z cieniem), aby zaproszenie zostało uznane za aktywne."
              : "Noctua offers a referral programme where you can invite others and unlock rewards. The invited person must create an account and make at least 3 entries (journal, dreams, or shadow work) for the invitation to count as active."
            }</p>
            <p className="mt-2">{pl
              ? "Progi nagród: 3 aktywne zaproszenia: 1 darmowa analiza snu AI. 5 aktywnych zaproszeń: osobisty list od AGNÉLIS. 10 aktywnych zaproszeń: 1 darmowy odczyt miesięczny + ekskluzywny motyw. 15 aktywnych zaproszeń: głęboki odczyt (panorama wielu miesięcy). 20 aktywnych zaproszeń: odznaka Ambasadorki + Lustro Cienia (pełna Twoja podróż)."
              : "Reward thresholds: 3 active invites: 1 free AI dream analysis. 5 active invites: personal letter from AGNÉLIS. 10 active invites: 1 free monthly reading + exclusive theme. 15 active invites: deep reading (multi-month panorama). 20 active invites: Ambassador badge + Shadow Mirror (your full journey)."
            }</p>
            <p className="mt-2">{pl
              ? "Nagrody są przyznawane automatycznie po osiągnięciu progu. AGNÉLIS zastrzega sobie prawo do zmiany progów i nagród w dowolnym momencie."
              : "Rewards are granted automatically upon reaching the threshold. AGNÉLIS reserves the right to modify thresholds and rewards at any time."
            }</p>
          </section>

          <section>
            <h2 className="text-base mb-2" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
              {pl ? "Darmowa i Premium wersja" : "Free and Premium tiers"}
            </h2>
            <p>{pl
              ? "Wersja darmowa obejmuje: dziennik, dziennik snów, śledzenie cyklu, uziemienie, pracę z cieniem (podstawowe prompty) oraz 8 symboli snów. Wersja darmowa nie obejmuje funkcji AI, raportów ani zaawansowanych narzędzi."
              : "The free tier includes: journal, dream journal, cycle tracker, grounding, shadow work (basic prompts), and 8 dream symbols. The free tier does not include AI features, reports, or advanced tools."
            }</p>
            <p className="mt-2">{pl
              ? "Subskrypcja Premium (9.99 GBP/miesiąc lub 79.99 GBP/rok) obejmuje: 5 analiz snów AI miesięcznie (po limicie: 1.49 GBP za dodatkową), wszystkie 50 symboli snów, tygodniowy wgląd, miesięczny raport osobisty, sezonowe prompty pracy z cieniem, mapę emocjonalną cyklu i księżyca oraz rozpoznawanie wzorców."
              : "Premium subscription (GBP 9.99/month or GBP 79.99/year) includes: 5 AI dream analyses per month (after limit: GBP 1.49 per additional), all 50 dream symbols, weekly insight, monthly personal report, seasonal shadow work prompts, cycle and moon emotional map, and pattern recognition."
            }</p>
            <p className="mt-2">{pl
              ? "Workbooki (Praca z cieniem, Integracja snów, Harmonizacja cyklu) są dostępne jako osobne zakupy w sklepie, niezależnie od subskrypcji. Motywy kolorystyczne są również osobnymi zakupami."
              : "Workbooks (Shadow Work, Dream Integration, Cycle Alignment) are available as separate purchases in the shop, independent of subscription. Colour themes are also separate purchases."
            }</p>
          </section>

          <section>
            <h2 className="text-base mb-2" style={{ color: "var(--color-plum)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
              {pl ? "Kontakt" : "Contact"}
            </h2>
            <p>contact.agnelis@gmail.com</p>
          </section>

        </div>
      </main>
    </div>
  );
}