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
    "section.about.eyebrow": "Our Story",
    "section.about.title": "About Us",
    "section.about.p1": "is more than just a parts shop. We are a dedicated motorcycle modification hub born from a passion for unique builds and high-performance aesthetics.",
    "section.about.p2": "Established with a clear vision to redefine the motorcycling landscape in Bangladesh, we source and develop premium modification kits that help riders express their individuality on every journey.",
    "section.store.eyebrow": "Uttara Branch",
    "section.store.title": "Physical Store Coming Soon",
    "section.store.location": "Location",
    "section.store.p1": "Until our grand opening, every order is processed through our website with express delivery support across Bangladesh. Our workshop team is already active for custom kit fittings.",
    "section.home.h1": "premium motorcycle modification parts and accessories in Bangladesh",
    "section.models.eyebrow": "Find your fit",
    "section.models.title": "Explore by Bike Model",
    "section.universal.eyebrow": "Fits most bikes",
    "section.universal.title": "Universal Products",
    "section.bestDeals.eyebrow": "Limited offers",
    "section.bestDeals.title": "Featured & Best Deals",
    "section.allProducts.title": "All Products",
    "section.allProducts.eyebrow": "products",
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
    "section.about.eyebrow": "আমাদের গল্প",
    "section.about.title": "আমাদের সম্পর্কে",
    "section.about.p1": "একটি পার্টস শপের চেয়েও বেশি। আমরা মোটরসাইকেল মডিফিকেশনের একটি বিশেষ হাব, যা তৈরি হয়েছে ইউনিক বিল্ড এবং হাই-পারফরম্যান্স নান্দনিকতার প্রতি ভালোবাসা থেকে।",
    "section.about.p2": "বাংলাদেশে মোটরসাইক্লিং দৃশ্যপট নতুনভাবে সংজ্ঞায়িত করার স্পষ্ট লক্ষ্য নিয়ে প্রতিষ্ঠিত, আমরা প্রিমিয়াম মডিফিকেশন কিট সংগ্রহ ও উন্নয়ন করি যা রাইডারদের প্রতিটি ভ্রমণে তাদের নিজস্বতা প্রকাশ করতে সাহায্য করে।",
    "section.store.eyebrow": "উত্তরা শাখা",
    "section.store.title": "ফিজিক্যাল স্টোর শীঘ্রই আসছে",
    "section.store.location": "অবস্থান",
    "section.store.p1": "আমাদের গ্র্যান্ড ওপেনিং পর্যন্ত, প্রতিটি অর্ডার আমাদের ওয়েবসাইটের মাধ্যমে প্রসেস করা হচ্ছে এবং পুরো বাংলাদেশে এক্সপ্রেস ডেলিভারি সাপোর্ট রয়েছে। আমাদের ওয়ার্কশপ টিম ইতিমধ্যে কাস্টম কিট ফিটিং-এর জন্য সক্রিয় রয়েছে।",
    "section.home.h1": "বাংলাদেশে প্রিমিয়াম মোটরসাইকেল মডিফিকেশন পার্টস এবং এক্সেসরিজ",
    "section.models.eyebrow": "আপনার ফিট খুঁজুন",
    "section.models.title": "বাইক মডেল অনুযায়ী এক্সপ্লোর করুন",
    "section.universal.eyebrow": "বেশিরভাগ বাইকের জন্য",
    "section.universal.title": "ইউনিভার্সাল প্রোডাক্ট",
    "section.bestDeals.eyebrow": "সীমিত অফার",
    "section.bestDeals.title": "ফিচারড এবং সেরা ডিল",
    "section.allProducts.title": "সব প্রোডাক্ট",
    "section.allProducts.eyebrow": "টি প্রোডাক্ট",
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
