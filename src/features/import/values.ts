import { toLatinDigits } from "@/lib/i18n/digits";
import { isIsoDate } from "@/lib/utils/dates";

/** Date formats found in German bank exports (and N26's ISO dates). */
export const DATE_FORMATS = [
  "dd.mm.yyyy",
  "dd.mm.yy",
  "yyyy-mm-dd",
  "dd/mm/yyyy",
  "mm/dd/yyyy",
] as const;
export type DateFormat = (typeof DATE_FORMATS)[number];

export const DECIMAL_SEPARATORS = ["comma", "dot"] as const;
export type DecimalSeparator = (typeof DECIMAL_SEPARATORS)[number];

const DATE_PATTERNS: Record<DateFormat, RegExp> = {
  "dd.mm.yyyy": /^(?<d>\d{1,2})\.(?<m>\d{1,2})\.(?<y>\d{4})$/,
  "dd.mm.yy": /^(?<d>\d{1,2})\.(?<m>\d{1,2})\.(?<y>\d{2})$/,
  "yyyy-mm-dd": /^(?<y>\d{4})-(?<m>\d{1,2})-(?<d>\d{1,2})$/,
  "dd/mm/yyyy": /^(?<d>\d{1,2})\/(?<m>\d{1,2})\/(?<y>\d{4})$/,
  "mm/dd/yyyy": /^(?<m>\d{1,2})\/(?<d>\d{1,2})\/(?<y>\d{4})$/,
};

/** Parses a bank date into `YYYY-MM-DD`; two-digit years mean 20xx. */
export function parseDateValue(input: string, format: DateFormat): string | null {
  const groups = DATE_PATTERNS[format].exec(toLatinDigits(input.trim()))?.groups;
  if (!groups?.d || !groups.m || !groups.y) return null;
  const year = groups.y.length === 2 ? `20${groups.y}` : groups.y;
  const iso = `${year}-${groups.m.padStart(2, "0")}-${groups.d.padStart(2, "0")}`;
  return isIsoDate(iso) ? iso : null;
}

/** First format that parses every non-empty sample (null if none does). */
export function detectDateFormat(samples: readonly string[]): DateFormat | null {
  const values = samples.filter((s) => s.trim() !== "");
  if (values.length === 0) return null;
  return DATE_FORMATS.find((f) => values.every((v) => parseDateValue(v, f) !== null)) ?? null;
}

const CURRENCY_NOISE = /[\s  €$£]|EUR|CHF|USD|GBP/gi;

/**
 * Parses a signed bank amount into integer cents. Accepts "-1.234,56",
 * "1234,5 €", "+12.00", "12,00-" (trailing minus) depending on the decimal
 * separator. More than two decimals are rejected.
 */
export function parseAmountValue(input: string, decimal: DecimalSeparator): number | null {
  let s = toLatinDigits(input).replace(CURRENCY_NOISE, "");
  if (s === "") return null;
  let negative = false;
  if (/^[-−]/.test(s) || /[-−]$/.test(s)) negative = true;
  s = s.replace(/^[-−+]|[-−]$/g, "");

  const [decimalChar, groupChar] = decimal === "comma" ? [",", "."] : [".", ","];
  s = s.replaceAll(groupChar, "");
  const parts = s.split(decimalChar);
  if (parts.length > 2) return null;
  const [int = "", frac = ""] = parts;
  if (!/^\d+$/.test(int || "0") || !/^\d{0,2}$/.test(frac)) return null;
  const cents = Number(int || "0") * 100 + Number(frac.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents)) return null;
  return negative && cents !== 0 ? -cents : cents;
}

/**
 * Decimal separator that parses all samples. When both work (e.g. "12"),
 * the presence of ",dd" endings decides; German comma is the default.
 */
export function detectDecimalSeparator(samples: readonly string[]): DecimalSeparator {
  const values = samples.filter((s) => s.trim() !== "");
  const parsesAll = (d: DecimalSeparator) => values.every((v) => parseAmountValue(v, d) !== null);
  const comma = parsesAll("comma");
  const dot = parsesAll("dot");
  if (comma && !dot) return "comma";
  if (dot && !comma) return "dot";
  if (values.some((v) => /\.\d{1,2}\s*[-−]?\s*(€|EUR)?$/i.test(v.trim()))) return "dot";
  return "comma";
}
