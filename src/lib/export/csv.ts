/**
 * CSV export in the format German spreadsheet apps expect: `;` as delimiter,
 * decimal comma, `dd.mm.yyyy` dates and a UTF-8 BOM so Excel detects the encoding.
 */

const BOM = "﻿";

/** Quotes a cell when it contains the delimiter, quotes or line breaks. */
export function escapeCsvCell(value: string, delimiter = ";"): string {
  // Neutralize spreadsheet formulas (CSV injection) in text cells.
  const safe = /^[=+\-@\t\r]/.test(value) && !/^-?\d/.test(value) ? `'${value}` : value;
  return /["\n\r]/.test(safe) || safe.includes(delimiter) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** Serializes rows (first row = header) to CSV text with BOM and CRLF line endings. */
export function toCsv(rows: readonly (readonly string[])[], delimiter = ";"): string {
  return (
    BOM +
    rows.map((r) => r.map((c) => escapeCsvCell(c, delimiter)).join(delimiter)).join("\r\n") +
    "\r\n"
  );
}

/** Cents as a plain German decimal without thousands separators ("-1234,56"). */
export function csvAmount(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, "0")}`;
}

/** ISO date `YYYY-MM-DD` as `dd.mm.yyyy`. */
export function csvDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

/** Ratio as a German percentage with one decimal ("12,5"). */
export function csvPercent(ratio: number): string {
  return (Math.round(ratio * 1000) / 10).toFixed(1).replace(".", ",");
}
