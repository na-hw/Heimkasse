"use client";

import { de as deLocale, faIR as faGregorianLocale } from "date-fns/locale";
import { useMemo } from "react";
import { LANGUAGE_DIRECTION } from "@/lib/i18n/config";
import { useLocaleContext } from "@/lib/i18n/useFormat";
import { usePreferences } from "@/lib/preferences/store";

export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Calendar settings derived from preferences (language, digits, Jalali, week start). */
export function useCalendarConfig() {
  const ctx = useLocaleContext();
  const weekStart = usePreferences((s) => s.weekStart) as WeekStart;
  return useMemo(() => {
    const jalali = ctx.language === "fa" && ctx.calendar === "jalali";
    return {
      jalali,
      dir: LANGUAGE_DIRECTION[ctx.language],
      locale: ctx.language === "de" ? deLocale : faGregorianLocale,
      numerals: (ctx.language === "fa" && ctx.digits === "persian" ? "arabext" : "latn") as
        "arabext" | "latn",
      weekStartsOn: weekStart,
    };
  }, [ctx, weekStart]);
}
