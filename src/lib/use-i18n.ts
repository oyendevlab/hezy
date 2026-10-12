import { useMemo } from "react";
import { translate, type Lang } from "./i18n";
import { usePrefs } from "./prefs";

/** Bahasa pilihan pengguna dan fungsi terjemahan `t(teksBM, vars?)`. BM semasa render pelayan. */
export function useI18n(): {
  lang: Lang;
  t: (text: string, vars?: Record<string, string | number>) => string;
} {
  const lang = usePrefs()?.lang ?? "ms";
  return useMemo(
    () => ({ lang, t: (text, vars) => translate(lang, text, vars) }),
    [lang],
  );
}
