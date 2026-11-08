import { describe, expect, it } from "vitest";
import { csvAmount, csvDate, csvPercent, escapeCsvCell, toCsv } from "./csv";

describe("csv", () => {
  it("formats amounts, dates and percentages the German way", () => {
    expect(csvAmount(123456)).toBe("1234,56");
    expect(csvAmount(-5)).toBe("-0,05");
    expect(csvAmount(0)).toBe("0,00");
    expect(csvDate("2026-11-08")).toBe("08.11.2026");
    expect(csvPercent(0.125)).toBe("12,5");
  });

  it("escapes delimiters, quotes and line breaks", () => {
    expect(escapeCsvCell("a;b")).toBe('"a;b"');
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvCell("line\nbreak")).toBe('"line\nbreak"');
    expect(escapeCsvCell("plain")).toBe("plain");
  });

  it("neutralizes formulas but keeps negative numbers", () => {
    expect(escapeCsvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(escapeCsvCell("-12,50")).toBe("-12,50");
  });

  it("joins rows with BOM and CRLF", () => {
    expect(
      toCsv([
        ["A", "B"],
        ["1", "2"],
      ]),
    ).toBe("﻿A;B\r\n1;2\r\n");
  });
});
