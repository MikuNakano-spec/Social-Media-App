// src/lib/i18n/index.ts
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import en from "./en";
import vi from "./vi";

type Language = "en" | "vi";
type Translations = typeof en;

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
  mounted: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("lang") as Language | null;
      const cookieLang = document.cookie
        .split("; ")
        .find((row) => row.startsWith("lang="))
        ?.split("=")[1] as Language | undefined;
      return savedLang || cookieLang || "en";
    }
    return "en";
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.cookie = `lang=${lang}; path=/; max-age=31536000`;
    setMounted(true);
  }, [lang]);

  const t = lang === "vi" ? vi : en;

  return (
    <I18nContext.Provider value={{ lang, setLang, t, mounted }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
};
