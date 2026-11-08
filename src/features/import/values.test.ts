import { describe, expect, it } from "vitest";
import {
  detectDateFormat,
  detectDecimalSeparator,
  parseAmountValue,
  parseDateValue,
} from "./values";

describe("dates", () => {
  it("parses German, short-year and ISO dates", () => {
    expect(parseDateValue("08.11.2026", "dd.mm.yyyy")).toBe("2026-11-08");
    expect(parseDateValue("8.1.2026", "dd.mm.yyyy")).toBe("2026-01-08");
    expect(parseDateValue("08.11.26", "dd.mm.yy")).toBe("2026-11-08");
    expect(parseDateValue("2026-11-08", "yyyy-mm-dd")).toBe("2026-11-08");
    expect(parseDateValue("۰۸.۱۱.۲۰۲۶", "dd.mm.yyyy")).toBe("2026-11-08");
  });

  it("rejects impossible dates and wrong formats", () => {
    expect(parseDateValue("31.02.2026", "dd.mm.yyyy")).toBeNull();
    expect(parseDateValue("2026-11-08", "dd.mm.yyyy")).toBeNull();
  });

  it("detects the format from samples", () => {
    expect(detectDateFormat(["08.11.2026", "", "01.12.2026"])).toBe("dd.mm.yyyy");
    expect(detectDateFormat(["08.11.26"])).toBe("dd.mm.yy");
    expect(detectDateFormat(["2026-11-08"])).toBe("yyyy-mm-dd");
    expect(detectDateFormat(["13/01/2026"])).toBe("dd/mm/yyyy");
    expect(detectDateFormat(["foo"])).toBeNull();
  });
});

describe("amounts", () => {
  it("parses German amounts into signed cents", () => {
    expect(parseAmountValue("-1.234,56", "comma")).toBe(-123456);
    expect(parseAmountValue("1234,5 €", "comma")).toBe(123450);
    expect(parseAmountValue("12,00-", "comma")).toBe(-1200);
    expect(parseAmountValue("+3", "comma")).toBe(300);
    expect(parseAmountValue("−45,10 EUR", "comma")).toBe(-4510);
  });

  it("parses dot-decimal amounts (N26)", () => {
    expect(parseAmountValue("-45.10", "dot")).toBe(-4510);
    expect(parseAmountValue("2,500.00", "dot")).toBe(250000);
  });

  it("rejects invalid input and more than two decimals", () => {
    expect(parseAmountValue("", "comma")).toBeNull();
    expect(parseAmountValue("abc", "comma")).toBeNull();
    expect(parseAmountValue("1,234", "comma")).toBeNull();
    expect(parseAmountValue("1,2,3", "comma")).toBeNull();
  });

  it("detects the decimal separator", () => {
    expect(detectDecimalSeparator(["-45,10", "2.500,00"])).toBe("comma");
    expect(detectDecimalSeparator(["-45.10", "2500.00"])).toBe("dot");
    expect(detectDecimalSeparator(["12", "1.234"])).toBe("comma");
  });
});
