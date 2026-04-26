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
  nav_shadow_desc: { en: "Face what keeps returning", pl: "Zmierz się z tym co wraca" },
  nav_reports: { en: "Reading", pl: "Odczyt" },
  nav_reports_desc: { en: "Your patterns, read back to you", pl: "Twoje wzorce, odczytane dla Ciebie" },
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
  pf_ai_dreams: { en: "5 dream readings per month", pl: "5 odczytów snów miesięcznie" },
  pf_symbols: { en: "All 50 dream symbols unlocked", pl: "Wszystkie 50 symboli snów odblokowane" },
  pf_weekly: { en: "Weekly insight", pl: "Tygodniowy wgląd" },
  pf_monthly: { en: "Monthly personal report", pl: "Miesięczny raport osobisty" },
  pf_seasonal: { en: "Seasonal shadow work prompts", pl: "Sezonowe prompty pracy z cieniem" },
  pf_cycle_moon: { en: "Cycle + Moon emotional map", pl: "Mapa emocjonalna cyklu i księżyca" },
  pf_patterns: { en: "Pattern recognition", pl: "Rozpoznawanie wzorców" },
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

  // Moon phases
  moon_new: { en: "New Moon", pl: "Nów" },
  moon_waxing_crescent: { en: "Waxing Crescent", pl: "Przybywający sierp" },
  moon_first_quarter: { en: "First Quarter", pl: "Pierwsza kwadra" },
  moon_waxing_gibbous: { en: "Waxing Gibbous", pl: "Przybywający garb" },
  moon_full: { en: "Full Moon", pl: "Pełnia" },
  moon_waning_gibbous: { en: "Waning Gibbous", pl: "Ubywający garb" },
  moon_last_quarter: { en: "Last Quarter", pl: "Ostatnia kwadra" },
  moon_waning_crescent: { en: "Waning Crescent", pl: "Ubywający sierp" },
  
  // Journal
  journal_title: { en: "Journal", pl: "Dziennik" },
  journal_new: { en: "New entry", pl: "Nowy wpis" },
  journal_empty: { en: "No entries yet. Begin your reflection.", pl: "Brak wpisów. Rozpocznij swoją refleksję." },
  journal_edit: { en: "Edit entry", pl: "Edytuj wpis" },
  journal_save: { en: "Save entry", pl: "Zapisz wpis" },
  journal_title_field: { en: "Title (optional)", pl: "Tytuł (opcjonalnie)" },
  journal_content: { en: "Write here...", pl: "Pisz tutaj..." },
  journal_mood: { en: "Mood", pl: "Nastrój" },

  // Dreams
  dreams_title: { en: "Dream Journal", pl: "Dziennik snów" },
  dreams_new: { en: "New dream", pl: "Nowy sen" },
  dreams_empty: { en: "No dreams recorded yet.", pl: "Brak zapisanych snów." },
  dreams_edit: { en: "Edit dream", pl: "Edytuj sen" },
  dreams_save: { en: "Save dream", pl: "Zapisz sen" },
  dreams_title_field: { en: "Dream title", pl: "Tytuł snu" },
  dreams_content: { en: "Describe your dream...", pl: "Opisz swój sen..." },
  dreams_symbols: { en: "Symbols", pl: "Symbole" },
  dreams_lucidity: { en: "Lucidity", pl: "Świadomość" },
  dreams_emotion: { en: "Emotion", pl: "Emocja" },
  dreams_analyse: { en: "Analyse", pl: "Analizuj" },
  dreams_analysis: { en: "AI Analysis", pl: "Analiza AI" },

  // Cycle
  cycle_title: { en: "Cycle Tracker", pl: "Śledzenie cyklu" },
  cycle_log: { en: "Log today", pl: "Zapisz dziś" },
  cycle_flow: { en: "Flow", pl: "Przepływ" },
  cycle_light: { en: "Light", pl: "Lekki" },
  cycle_medium: { en: "Medium", pl: "Średni" },
  cycle_heavy: { en: "Heavy", pl: "Obfity" },
  cycle_spotting: { en: "Spotting", pl: "Plamienie" },
  cycle_symptoms: { en: "Symptoms", pl: "Objawy" },
  cycle_notes: { en: "Notes", pl: "Notatki" },

  // Symbols
  symbols_title: { en: "Dream Symbols", pl: "Symbole snów" },
  symbols_search: { en: "Search symbols...", pl: "Szukaj symboli..." },
  symbols_meaning: { en: "Meaning", pl: "Znaczenie" },
  symbols_shadow: { en: "Shadow aspect", pl: "Aspekt cienia" },

  // Grounding
  grounding_title: { en: "Grounding", pl: "Uziemienie" },
  grounding_breathe_in: { en: "Breathe in", pl: "Wdech" },
  grounding_hold: { en: "Hold", pl: "Wstrzymaj" },
  grounding_breathe_out: { en: "Breathe out", pl: "Wydech" },
  grounding_start: { en: "Start", pl: "Rozpocznij" },
  grounding_stop: { en: "Stop", pl: "Zatrzymaj" },
  grounding_need_help: { en: "Need to talk to someone?", pl: "Potrzebujesz z kimś porozmawiaś?" },

  // Shop
  shop_title: { en: "Shop", pl: "Sklep" },
  shop_owned: { en: "Owned", pl: "Posiadane" },
  shop_buy: { en: "Buy", pl: "Kup" },
  shop_activate: { en: "Activate", pl: "Aktywuj" },
  shop_activated: { en: "Active", pl: "Aktywny" },

  // Auth
  auth_login_title: { en: "Welcome back", pl: "Witaj ponownie" },
  auth_login_subtitle: { en: "The owl remembers you", pl: "Sowa Cię pamięta" },
  auth_email: { en: "Email", pl: "Email" },
  auth_password: { en: "Password", pl: "Hasło" },
  auth_login: { en: "Sign in", pl: "Zaloguj się" },
  auth_sign_in: { en: "Sign in", pl: "Zaloguj się" },
  auth_signing_in: { en: "Signing in...", pl: "Logowanie..." },
  auth_sign_up: { en: "Sign up", pl: "Zarejestruj się" },
  auth_forgot: { en: "Forgot your password?", pl: "Nie pamiętasz hasła?" },
  auth_no_account: { en: "Don't have an account?", pl: "Nie masz konta?" },
  auth_register_title: { en: "Begin your journey", pl: "Rozpocznij swoją podróż" },
  auth_register_subtitle: { en: "The owl sees what the daylight hides", pl: "Sowa widzi to, co dzień ukrywa" },
  auth_name: { en: "Display name", pl: "Imię" },
  auth_confirm_password: { en: "Confirm password", pl: "Potwierdź hasło" },
  auth_register: { en: "Create account", pl: "Utwórz konto" },
  auth_registering: { en: "Creating account...", pl: "Tworzenie konta..." },
  auth_have_account: { en: "Already have an account?", pl: "Masz już konto?" },
  auth_reset_title: { en: "Reset password", pl: "Zresetuj hasło" },
  auth_reset_subtitle: { en: "Enter your email and we will send you a link", pl: "Wpisz swój email, a wyślemy Ci link" },
  auth_reset_send: { en: "Send reset link", pl: "Wyślij link" },
  auth_reset_sending: { en: "Sending...", pl: "Wysyłanie..." },
  auth_reset_sent: { en: "Check your email for the reset link", pl: "Sprawdź skrzynkę — link został wysłany" },
  auth_reset_back: { en: "Back to sign in", pl: "Wróć do logowania" },
  auth_new_password: { en: "New password", pl: "Nowe hasło" },
  auth_set_password: { en: "Set new password", pl: "Ustaw nowe hasło" },
  auth_setting_password: { en: "Saving...", pl: "Zapisywanie..." },

  weekly_insight_title: { en: "Reflection", pl: "Refleksja" },
  weekly_insight_empty: { en: "Journal and record dreams. Your insight appears on Monday.", pl: "Pisz dziennik i zapisuj sny. Twój wgląd pojawi się w poniedziałek." },
  weekly_insight_more: { en: "Read more", pl: "Czytaj dalej" },
  premium_hero_line1: { en: "I see your patterns.", pl: "Widzę twoje wzorce." },
  premium_hero_line2: { en: "Let me show you.", pl: "Pokażę ci je." },
  premium_hero_desc: { en: "You are not paying for features. You are paying for someone to see what you cannot see yourself.", pl: "Nie płacisz za funkcje. Płacisz za to, że ktoś widzi to, czego sama nie dostrzegasz." },
  premium_formula: { en: "Premium = I understand you. I guide you. I show you patterns.", pl: "Premium = Rozumiem cię. Prowadzę cię. Pokazuję ci wzorce." },
  season_spring: { en: "Spring", pl: "Wiosna" },
  season_summer: { en: "Summer", pl: "Lato" },
  season_autumn: { en: "Autumn", pl: "Jesień" },
  season_winter: { en: "Winter", pl: "Zima" },

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
    const loadLanguage = async () => {
      const saved = localStorage.getItem("noctua-language") as Language;
      if (saved === "en" || saved === "pl") {
        setLanguageState(saved);
      }
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("preferred_language").eq("id", user.id).single();
          if (profile?.preferred_language) {
            setLanguageState(profile.preferred_language as Language);
            localStorage.setItem("noctua-language", profile.preferred_language);
          }
        }
      } catch {}
    };
    loadLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("noctua-language", lang);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ preferred_language: lang }).eq("id", user.id);
      }
    } catch {}
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