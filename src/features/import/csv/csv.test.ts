import { describe, expect, it } from "vitest";
import { decodeText, detectEncoding } from "./decode";
import { detectDelimiter, detectHeaderRow, parseCsv } from "./parse";

describe("encoding", () => {
  it("detects UTF-8 with and without BOM", () => {
    const utf8 = new TextEncoder().encode("Empfänger;Betrag");
    expect(detectEncoding(utf8)).toBe("utf-8");
    const bom = new Uint8Array([0xef, 0xbb, 0xbf, ...utf8]);
    expect(detectEncoding(bom)).toBe("utf-8");
    expect(decodeText(bom, "utf-8")).toBe("Empfänger;Betrag");
  });

  it("falls back to Windows-1252 / ISO-8859-1 for legacy files", () => {
    // "Empfänger" with ä = 0xE4 in Latin-1, "€" = 0x80 in Windows-1252
    const latin1 = new Uint8Array([
      0x45, 0x6d, 0x70, 0x66, 0xe4, 0x6e, 0x67, 0x65, 0x72, 0x3b, 0x80,
    ]);
    expect(detectEncoding(latin1)).toBe("windows-1252");
    expect(decodeText(latin1, "windows-1252")).toBe("Empfänger;€");
  });
});

describe("parseCsv", () => {
  it("handles quotes, escaped quotes, delimiters and line breaks in fields", () => {
    const text = 'a;"b;c";"say ""hi"""\r\n"multi\nline";2;3\n\n';
    expect(parseCsv(text, ";")).toEqual([
      ["a", "b;c", 'say "hi"'],
      ["multi\nline", "2", "3"],
    ]);
  });

  it("keeps empty cells and drops blank lines", () => {
    expect(parseCsv("a,,c\n,,\n1,2,3", ",")).toEqual([
      ["a", "", "c"],
      ["1", "2", "3"],
    ]);
  });
});

describe("structure detection", () => {
  const dkb = [
    '"Girokonto";"DE12 3456"',
    '"Zeitraum:";"01.10.2026 - 31.10.2026"',
    '"Kontostand vom 31.10.2026:";"1.234,56 €"',
    "",
    '"Buchungsdatum";"Wertstellung";"Status";"Zahlungspflichtige*r";"Zahlungsempfänger*in";"Verwendungszweck";"Umsatztyp";"IBAN";"Betrag (€)"',
    '"30.10.26";"30.10.26";"Gebucht";"Max Muster";"REWE";"Einkauf";"Ausgang";"DE00";"-45,10"',
    '"29.10.26";"29.10.26";"Gebucht";"Arbeitgeber GmbH";"Max Muster";"Gehalt";"Eingang";"DE01";"2.500,00"',
  ].join("\n");

  it("detects the delimiter despite info lines", () => {
    expect(detectDelimiter(dkb)).toBe(";");
    expect(detectDelimiter("Date,Payee,Amount\n2026-01-01,A,1.00\n2026-01-02,B,2.00")).toBe(",");
    expect(detectDelimiter("a\tb\tc\n1\t2\t3")).toBe("\t");
  });

  it("skips info lines to find the header row", () => {
    const rows = parseCsv(dkb, ";");
    expect(rows[detectHeaderRow(rows)]?.[0]).toBe("Buchungsdatum");
  });
});
