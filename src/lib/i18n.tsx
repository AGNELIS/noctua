"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "pl";

const translations = {
  nav_journal: { en: "Journal", pl: "Dziennik" },
  nav_journal_desc: { en: "Reflect on your inner world", pl: "Refleksja nad swoim wnętrzem" },
  nav_dreams: { en: "Dream Journal", pl: "Dziennik snów" },
  nav_dreams_desc: { en: "Capture the messages of the night", pl: "Zapisz przesłania nocy" },
  nav_cycle: { en: "Cycle Tracker", pl: "Cykl" },
  nav_cycle_desc: { en: "Honour your body's rhythm", pl: "Szanuj rytm swojego ciała" },
  nav_symbols: { en: "Dream Symbols", pl: "Symbole snów" },
  nav_symbols_desc: { en: "Decode the language of dreams", pl: "Odczytaj język snów" },
  nav_grounding: { en: "Grounding", pl: "Uziemienie" },
  nav_grounding_desc: { en: "Return to yourself", pl: "Wróć do siebie" },
  nav_shop: { en: "Shop", pl: "Sklep" },
  nav_shadow: { en: "Shadow Work", pl: "Praca z cieniem" },
  nav_shadow_desc: { en: "Face what keeps returning", pl: "Zmierz sie z tym co wraca" },
  nav_shop_desc: { en: "Themes, symbols & more", pl: "Motywy, symbole i więcej" },
  illuminated: { en: "illuminated", pl: "oświetlenia" },
  premium_title: { en: "Premium", pl: "Premium" },
  premium_subtitle: { en: "Unlock the full power of Noctua", pl: "Odblokuj pełną moc Noctui" },
  premium_monthly: { en: "Monthly", pl: "Miesięcznie" },
  premium_yearly: { en: "Yearly", pl: "Rocznie" },
  premium_per_month: { en: "/month", pl: "/miesiąc" },
  premium_per_year: { en: "/year", pl: "/rok" },
  premium_save: { en: "Save 33%", pl: "Oszczędź 33%" },
  premium_subscribe: { en: "Subscribe now", pl: "Subskrybuj" },
  premium_restore: { en: "Restore purchase", pl: "Przywróć zakup" },
  pf_ai_dreams: { en: "Unlimited AI dream analysis", pl: "Nielimitowana analiza snów AI" },
  pf_themes: { en: "All premium themes", pl: "Wszystkie motywy premium" },
  pf_symbols: { en: "Extended dream symbol library", pl: "Rozszerzona biblioteka symboli" },
  pf_stats: { en: "Dream statistics & insights", pl: "Statystyki i wgląd w sny" },
  pf_reports: { en: "Personalised reports", pl: "Spersonalizowane raporty" },
  pf_priority: { en: "Priority support", pl: "Priorytetowe wsparcie" },
  pack_title: { en: "Dream Analysis Packs", pl: "Paczki analiz snów" },
  pack_subtitle: { en: "Don't need a subscription? Buy analysis credits individually.", pl: "Nie potrzebujesz subskrypcji? Kup kredyty analiz osobno." },
  pack_5: { en: "5 dream analyses", pl: "5 analiz snów" },
  pack_buy: { en: "Buy now", pl: "Kup teraz" },
  pack_credits: { en: "analysis credits remaining", pl: "pozostałych kredytów analiz" },
  back: { en: "Back", pl: "Wróć" },
  sign_out: { en: "Sign out", pl: "Wyloguj" },
  save: { en: "Save", pl: "Zapisz" },
  cancel: { en: "Cancel", pl: "Anuluj" },
  delete: { en: "Delete", pl: "Usuń" },
  loading: { en: "Loading...", pl: "Ładowanie..." },
  language: { en: "Language", pl: "Język" },
  profile_title: { en: "Profile", pl: "Profil" },
  profile_language: { en: "Language", pl: "Język" },
  profile_theme: { en: "Theme", pl: "Motyw" },
  profile_premium: { en: "Go Premium", pl: "Przejdź na Premium" },
  profile_premium_active: { en: "Premium active", pl: "Premium aktywne" },
  profile_member_since: { en: "Member since", pl: "W Noctui od" },
  profile_journal_entries: { en: "Journal entries", pl: "Wpisy dziennika" },
  profile_dreams_recorded: { en: "Dreams recorded", pl: "Zapisane sny" },
  profile_symbols_available: { en: "Symbols available", pl: "Dostępne symbole" },
  profile_cycle_entries: { en: "Cycle entries", pl: "Wpisy cyklu" },
  profile_default_theme: { en: "Default Noctua palette", pl: "Domyślna paleta Noctua" },
  profile_reset_theme: { en: "Reset to default", pl: "Przywróć domyślny" },
  profile_browse_themes: { en: "Browse themes →", pl: "Przeglądaj motywy →" },
  profile_active_theme: { en: "Active theme", pl: "Aktywny motyw" },
  profile_purchases: { en: "Your purchases", pl: "Twoje zakupy" },
  profile_add_name: { en: "+ Add your name", pl: "+ Dodaj swoje imię" },
  profile_tap_photo: { en: "Tap to change photo", pl: "Kliknij, aby zmienić zdjęcie" },
  profile_uploading: { en: "Uploading...", pl: "Przesyłanie..." },
  profile_signing_out: { en: "Signing out...", pl: "Wylogowywanie..." },
  profile_name_placeholder: { en: "Your name", pl: "Twoje imię" },
} as const;

export type TranslationKey = keyof typeof translations;

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("noctua-language") as Language;
    if (saved === "en" || saved === "pl") {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("noctua-language", lang);
  };

  const t = (key: TranslationKey): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[language] || entry["en"] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}