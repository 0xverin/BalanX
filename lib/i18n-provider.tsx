"use client";

import { createContext, useContext } from "react";
import { dictionaries, type Dict, type Lang } from "./i18n";

export type { Dict, Lang };

const I18nContext = createContext<{ lang: Lang; t: Dict }>({
  lang: "en",
  t: dictionaries.en,
});

export function I18nProvider({
  lang,
  children,
}: {
  lang: Lang;
  children: React.ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ lang, t: dictionaries[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function useT() {
  return useContext(I18nContext).t;
}

export function formatUSD(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatUSDRaw(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
