import { describe, expect, it } from "vitest";
import { toLatinDigits, toPersianDigits } from "./digits";
import { normalizeDecimalInput, parseDecimal, parseMoneyToCents } from "./parse";

describe("digits", () => {
  it("converts Persian and Arabic digits to Latin", () => {
    expect(toLatinDigits("۱۲۳۴٫۵۶")).toBe("1234٫56");
    expect(toLatinDigits("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789");
  });
  it("converts Latin digits to Persian", () => {
    expect(toPersianDigits("2026")).toBe("۲۰۲۶");
  });
});

describe("parseMoneyToCents", () => {
  it.each([
    ["1.234,56", 123456],
    ["1234,56", 123456],
    ["12,5", 1250],
    ["12", 1200],
    ["0,99", 99],
    [",5", 50],
    ["1.234", 123400],
    ["1.234.567,89", 123456789],
    ["12.50", 1250],
    ["1,234.56", 123456],
    ["۱٬۲۳۴٫۵۶", 123456],
    ["۱۲۳۴٫۵", 123450],
    ["۱۲,۵۰", 1250],
    ["٤٥", 4500],
    ["  45,00 € ", 4500],
    ["-45,00", -4500],
    ["−12,30", -1230],
    ["45-", -4500],
    ["+7", 700],
  ])("parses %s → %i", (input, expected) => {
    expect(parseMoneyToCents(input)).toBe(expected);
  });

  it.each(["", "abc", "1,2,3", "12,345", "1.23.4", "1,234,5", "--5", "12,3a", "1.2345,6,7"])(
    "rejects %s",
    (input) => {
      expect(parseMoneyToCents(input)).toBeNull();
    },
  );

  it("rejects more than two decimals", () => {
    expect(parseMoneyToCents("1,234")).toBeNull();
  });

  it("never produces floating point errors", () => {
    expect(parseMoneyToCents("0,29")).toBe(29);
    expect(parseMoneyToCents("1.000.000,01")).toBe(100000001);
  });
});

describe("parseDecimal", () => {
  it("parses meter readings with decimals", () => {
    expect(parseDecimal("12.345,678")).toBe(12345.678);
    expect(parseDecimal("۱۲۳٫۴")).toBe(123.4);
  });
  it("normalizes negative zero", () => {
    expect(normalizeDecimalInput("-0")).toBe("0");
  });
});
