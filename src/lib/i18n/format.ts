import { parseIsoDate } from "@/lib/utils/dates";
import { type LocaleContext, toIntlLocale } from "./locale";

/**
 * Central, Intl-based formatters. All UI output of numbers, money and dates
 * must go through these functions (or the `useFormat` hook that binds them).
 * Formatter instances are cached because Intl constructors are expensive.
 */

const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>();

function numberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `n|${locale}|${JSON.stringify(options)}`;
  let fmt = cache.get(key) as Intl.NumberFormat | undefined;
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, options);
    cache.set(key, fmt);
  }
  return fmt;
}

function dateFormat(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `d|${locale}|${JSON.stringify(options)}`;
  let fmt = cache.get(key) as Intl.DateTimeFormat | undefined;
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(locale, options);
    cache.set(key, fmt);
  }
  return fmt;
}

export type SignDisplay = "auto" | "always" | "exceptZero" | "never";

export interface MoneyFormatOptions {
  signDisplay?: SignDisplay;
  /** Hide the currency symbol (e.g. inside an input with a currency suffix). */
  hideCurrency?: boolean;
}

/** Returns the currency symbol as Germans write it (e.g. "€", "$", "CHF"). */
export function currencySymbol(currency: string): string {
  const parts = numberFormat("de-DE", { style: "currency", currency }).formatToParts(0);
  return parts.find((p) => p.type === "currency")?.value ?? currency;
}

/**
 * Formats integer cents as money.
 * de → "1.234,56 €", fa → "۱٬۲۳۴٫۵۶ €" (or Latin digits per setting).
 */
export function formatMoney(cents: number, ctx: LocaleContext, options: MoneyFormatOptions = {}): string {
  const locale = toIntlLocale(ctx);
  const number = numberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: options.signDisplay ?? "auto",
  }).format(cents / 100);
  if (options.hideCurrency) return number;
  return `${number} ${currencySymbol(ctx.currency)}`;
}

/** Formats a plain number with locale digits and separators. */
export function formatNumber(
  value: number,
  ctx: LocaleContext,
  options: { minimumFractionDigits?: number; maximumFractionDigits?: number } = {},
): string {
  return numberFormat(toIntlLocale(ctx), {
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  }).format(value);
}

/** Formats a ratio (0.25 → "25 %" / "٪۲۵"). */
export function formatPercent(
  ratio: number,
  ctx: LocaleContext,
  options: { maximumFractionDigits?: number; signDisplay?: SignDisplay } = {},
): string {
  return numberFormat(toIntlLocale(ctx), {
    style: "percent",
    maximumFractionDigits: options.maximumFractionDigits ?? 0,
    signDisplay: options.signDisplay ?? "auto",
  }).format(ratio);
}

export type DateStyle = "short" | "medium" | "long" | "full" | "monthYear" | "dayMonth" | "weekdayShort";

const DATE_STYLES: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  short: { dateStyle: "short" },
  medium: { dateStyle: "medium" },
  long: { dateStyle: "long" },
  full: { dateStyle: "full" },
  monthYear: { month: "long", year: "numeric" },
  dayMonth: { day: "numeric", month: "short" },
  weekdayShort: { weekday: "short" },
};

/** Formats an ISO calendar date (`YYYY-MM-DD`) or a Date. */
export function formatDate(value: string | Date, ctx: LocaleContext, style: DateStyle = "medium"): string {
  const date = typeof value === "string" ? parseIsoDate(value) : value;
  return dateFormat(toIntlLocale(ctx), DATE_STYLES[style]).format(date);
}

/** Formats an ISO timestamp with date and time. */
export function formatDateTime(isoTimestamp: string, ctx: LocaleContext): string {
  return dateFormat(toIntlLocale(ctx), { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(isoTimestamp),
  );
}

/** Localized weekday names, index 0 = Sunday. */
export function weekdayNames(ctx: LocaleContext, width: "long" | "short" = "long"): string[] {
  const fmt = dateFormat(toIntlLocale(ctx), { weekday: width });
  // 2023-01-01 was a Sunday.
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2023, 0, 1 + i)));
}
