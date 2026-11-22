"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { translate, type Key, type Lang } from "@/data/i18n";
import type { PhotoMap } from "@/lib/photos";

const STORAGE_KEY = "bet-lang";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: Key, vars?: Record<string, string | number>) => string;
  photos: PhotoMap;
};

const LangContext = createContext<Ctx | null>(null);

export function AppProvider({ children, photos }: { children: React.ReactNode; photos: PhotoMap }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "pt") setLangState(saved);
    } catch {
      /* storage blocked (private mode): stay on English */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback((key: Key, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);

  return <LangContext.Provider value={{ lang, setLang, t, photos }}>{children}</LangContext.Provider>;
}

export function useApp() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
