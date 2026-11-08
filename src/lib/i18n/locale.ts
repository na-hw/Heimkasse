import type { Language } from "./config";

export type DigitStyle = "persian" | "latin";
export type CalendarSystem = "gregorian" | "jalali";

/** Everything formatters need to know about the user's locale preferences. */
export interface LocaleContext {
  language: Language;
  /** Only relevant for Persian; German always uses Latin digits. */
  digits: DigitStyle;
  /** Only relevant for Persian; German always uses the Gregorian calendar. */
  calendar: CalendarSystem;
  currency: string;
}

/**
 * Builds a BCP 47 tag with Unicode extensions for numbering system and calendar.
 * Persian defaults to Gregorian (the app is used in Germany) unless Jalali is chosen.
 */
export function toIntlLocale(ctx: LocaleContext): string {
  if (ctx.language === "de") return "de-DE";
  const numbering = ctx.digits === "latin" ? "latn" : "arabext";
  const calendar = ctx.calendar === "jalali" ? "persian" : "gregory";
  return `fa-IR-u-ca-${calendar}-nu-${numbering}`;
}
