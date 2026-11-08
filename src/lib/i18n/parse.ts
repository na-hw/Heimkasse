import { toLatinDigits } from "./digits";

const ARABIC_DECIMAL = "٫"; // ٫
const ARABIC_GROUP = "٬"; // ٬
const MINUS_SIGNS = /^[-−]|[-−]$/;

/**
 * Normalizes user number input (German or Persian conventions) to a canonical
 * string like "-1234.56". Returns null if the input is not a valid number.
 *
 * Rules:
 * - Persian/Arabic digits are accepted; "٫" is a decimal and "٬" a group separator.
 * - If both "," and "." occur, the last one is the decimal separator.
 * - A single "," is a decimal separator (German).
 * - A single "." followed by exactly three digits is a group separator ("1.234"),
 *   otherwise a decimal separator ("12.5").
 * - Repeated identical separators are group separators ("1.234.567").
 */
export function normalizeDecimalInput(input: string): string | null {
  let s = toLatinDigits(input)
    .replace(/[\s  ‎‏'’€$£]/g, "")
    .replaceAll(ARABIC_GROUP, "");
  if (s === "") return null;

  const negative = MINUS_SIGNS.test(s);
  s = s.replace(/^[-−+]|[-−]$/g, "");

  if (s.includes(ARABIC_DECIMAL)) {
    const [int, frac, ...rest] = s.split(ARABIC_DECIMAL);
    if (rest.length > 0) return null;
    s = `${(int ?? "").replace(/[.,]/g, "")}.${frac ?? ""}`;
  } else {
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    if (lastComma !== -1 && lastDot !== -1) {
      const decimal = lastComma > lastDot ? "," : ".";
      const group = decimal === "," ? "." : ",";
      s = s.replaceAll(group, "");
      if (s.split(decimal).length > 2) return null;
      s = s.replace(decimal, ".");
    } else if (lastComma !== -1) {
      s = singleSeparator(s, ",", true);
    } else if (lastDot !== -1) {
      s = singleSeparator(s, ".", false);
    }
  }

  if (!/^\d+(\.\d+)?$/.test(s) && !/^\d+\.$/.test(s) && !/^\.\d+$/.test(s)) return null;
  if (s.endsWith(".")) s = s.slice(0, -1);
  if (s.startsWith(".")) s = `0${s}`;
  s = s.replace(/^0+(?=\d)/, "");
  return negative && !/^0(\.0+)?$/.test(s) ? `-${s}` : s;
}

function singleSeparator(s: string, sep: "," | ".", singleIsDecimal: boolean): string {
  const parts = s.split(sep);
  if (parts.length > 2) {
    // Repeated separator → grouping. Every group after the first must have 3 digits.
    const valid = parts.slice(1).every((p) => p.length === 3);
    return valid ? parts.join("") : "invalid";
  }
  const [int = "", frac = ""] = parts;
  if (!singleIsDecimal && frac.length === 3 && int.length > 0 && int.length <= 3) {
    return int + frac;
  }
  return `${int}.${frac}`;
}

/** Parses a localized decimal string into a JS number, or null if invalid. */
export function parseDecimal(input: string): number | null {
  const normalized = normalizeDecimalInput(input);
  return normalized === null ? null : Number(normalized);
}

/**
 * Parses a localized money string into integer cents without floating point math.
 * Returns null for invalid input or more than two fractional digits.
 */
export function parseMoneyToCents(input: string): number | null {
  const normalized = normalizeDecimalInput(input);
  if (normalized === null) return null;
  const negative = normalized.startsWith("-");
  const [int = "0", frac = ""] = normalized.replace("-", "").split(".");
  if (frac.length > 2) return null;
  const cents = Number(int) * 100 + Number(frac.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents)) return null;
  return negative ? -cents : cents;
}
