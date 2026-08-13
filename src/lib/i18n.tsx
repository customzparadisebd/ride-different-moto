import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Language = "en" | "bn";

const STORAGE_KEY = "czp-language";

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}>({
  language: "en",
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key) => key,
});

const translations: Record<Language, Record<string, string>> = {
  en: {
    "nav.home": "Home",
    "nav.shop": "Shop",
    "nav.bikeModels": "Bike Models",
    "nav.newArrivals": "New Arrivals",
    "nav.gallery": "Gallery",
    "nav.about": "About Us",
    "nav.contact": "Contact",
    "nav.cart": "Cart",
    "nav.theme": "Theme",
    "nav.language": "EN",
    "common.whatsapp": "WhatsApp Us",
    "common.orderNow": "Order Now",
    "common.chooseColor": "Choose Color",
    "common.bdt": "৳",
    "common.comingSoon": "Coming Soon",
    "footer.rights": "All rights reserved.",
  },
  bn: {
    "nav.home": "হোম",
    "nav.shop": "শপ",
    "nav.bikeModels": "বাইক মডেল",
    "nav.newArrivals": "নিউ অ্যারাইভাল",
    "nav.gallery": "গ্যালারি",
    "nav.about": "আমাদের সম্পর্কে",
    "nav.contact": "যোগাযোগ",
    "nav.cart": "কার্ট",
    "nav.theme": "থিম",
    "nav.language": "বাংলা",
    "common.whatsapp": "হোয়াটসঅ্যাপ করুন",
    "common.orderNow": "অর্ডার করুন",
    "common.chooseColor": "কালার সিলেক্ট করুন",
    "common.bdt": "৳",
    "common.comingSoon": "শীঘ্রই আসছে",
    "footer.rights": "সর্বস্বত্ব সংরক্ষিত।",
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (stored === "en" || stored === "bn") {
      setLanguageState(stored as Language);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "bn" : "en");
  }, [language, setLanguage]);

  const t = useCallback(
    (key: string) => {
      return translations[language][key] || key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
