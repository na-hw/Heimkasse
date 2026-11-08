"use client";

import { useMemo } from "react";
import { usePreferences } from "@/lib/preferences/store";
import {
  type DateStyle,
  type MoneyFormatOptions,
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
  formatPercent,
  weekdayNames,
} from "./format";
import type { LocaleContext } from "./locale";

/** Returns the current locale context derived from user preferences. */
export function useLocaleContext(): LocaleContext {
  const language = usePreferences((s) => s.language);
  const digits = usePreferences((s) => s.digitStyle);
  const calendar = usePreferences((s) => s.calendar);
  const currency = usePreferences((s) => s.currency);
  return useMemo(
    () => ({
      language,
      digits: language === "fa" ? digits : "latin",
      calendar: language === "fa" ? calendar : "gregorian",
      currency,
    }),
    [language, digits, calendar, currency],
  );
}

/** Formatters bound to the current preferences. Use this in components. */
export function useFormat() {
  const ctx = useLocaleContext();
  return useMemo(
    () => ({
      ctx,
      money: (cents: number, options?: MoneyFormatOptions) => formatMoney(cents, ctx, options),
      number: (value: number, options?: Parameters<typeof formatNumber>[2]) =>
        formatNumber(value, ctx, options),
      percent: (ratio: number, options?: Parameters<typeof formatPercent>[2]) =>
        formatPercent(ratio, ctx, options),
      date: (value: string | Date, style?: DateStyle) => formatDate(value, ctx, style),
      dateTime: (iso: string) => formatDateTime(iso, ctx),
      weekdays: (width?: "long" | "short") => weekdayNames(ctx, width),
    }),
    [ctx],
  );
}
