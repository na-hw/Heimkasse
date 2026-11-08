import { describe, expect, it } from "vitest";
import { formatDate, formatMoney, formatNumber, formatPercent, weekdayNames } from "./format";
import type { LocaleContext } from "./locale";
import { toIntlLocale } from "./locale";

const de: LocaleContext = {
  language: "de",
  digits: "latin",
  calendar: "gregorian",
  currency: "EUR",
};
const fa: LocaleContext = {
  language: "fa",
  digits: "persian",
  calendar: "gregorian",
  currency: "EUR",
};
const faLatin: LocaleContext = { ...fa, digits: "latin" };
const faJalali: LocaleContext = { ...fa, calendar: "jalali" };

const NBSP = " ";
const strip = (s: string) => s.replace(/[‎‏؜]/g, "");

describe("toIntlLocale", () => {
  it("builds locale tags with numbering and calendar extensions", () => {
    expect(toIntlLocale(de)).toBe("de-DE");
    expect(toIntlLocale(fa)).toBe("fa-IR-u-ca-gregory-nu-arabext");
    expect(toIntlLocale(faLatin)).toBe("fa-IR-u-ca-gregory-nu-latn");
    expect(toIntlLocale(faJalali)).toBe("fa-IR-u-ca-persian-nu-arabext");
  });
});

describe("formatMoney", () => {
  it("formats German money", () => {
    expect(formatMoney(123456, de)).toBe(`1.234,56${NBSP}€`);
    expect(formatMoney(-4500, de)).toBe(`-45,00${NBSP}€`);
  });
  it("formats Persian money with Persian digits", () => {
    expect(strip(formatMoney(123456, fa))).toBe(`۱٬۲۳۴٫۵۶${NBSP}€`);
  });
  it("formats Persian money with Latin digits", () => {
    expect(strip(formatMoney(123456, faLatin))).toMatch(/^1.234.56 €$/);
  });
  it("supports explicit signs and hiding the currency", () => {
    expect(formatMoney(4500, de, { signDisplay: "always" })).toBe(`+45,00${NBSP}€`);
    expect(formatMoney(4500, de, { hideCurrency: true })).toBe("45,00");
  });
  it("uses the configured currency symbol", () => {
    expect(formatMoney(100, { ...de, currency: "USD" })).toBe(`1,00${NBSP}$`);
  });
});

describe("formatNumber / formatPercent", () => {
  it("formats numbers per locale", () => {
    expect(formatNumber(1234.5, de)).toBe("1.234,5");
    expect(strip(formatNumber(1234.5, fa))).toBe("۱٬۲۳۴٫۵");
  });
  it("formats percentages", () => {
    expect(formatPercent(0.25, de).replace(NBSP, " ")).toBe("25 %");
    expect(strip(formatPercent(0.25, fa))).toContain("۲۵");
  });
});

describe("formatDate", () => {
  it("formats Gregorian dates in German and Persian", () => {
    expect(formatDate("2026-11-08", de, "short")).toBe("08.11.26");
    expect(formatDate("2026-11-08", de, "medium")).toBe("08.11.2026");
    expect(formatDate("2026-11-08", fa, "long")).toContain("نوامبر");
    expect(formatDate("2026-11-08", fa, "long")).toContain("۲۰۲۶");
  });
  it("supports Jalali display for Persian", () => {
    const text = formatDate("2026-11-08", faJalali, "long");
    expect(text).toContain("آبان");
    expect(text).toContain("۱۴۰۵");
  });
  it("lists weekdays starting on Sunday", () => {
    expect(weekdayNames(de)[1]).toBe("Montag");
  });
});
