"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { translations, type Lang } from "./i18n";

type AnyTranslations = typeof translations[Lang];

interface LangContextValue {
  lang: Lang;
  t: AnyTranslations;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangContextValue>({
  lang: "ar",
  t: translations.ar as AnyTranslations,
  setLang: () => {},
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = localStorage.getItem("bmedia-lang");
      if (saved === "en") {
        setLangState("en");
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("bmedia-lang", l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  };

  return (
    <LangContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
