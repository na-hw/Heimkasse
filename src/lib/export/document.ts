import { toCsv } from "./csv";

/** Format-neutral export document: rendered to CSV or PDF. */
export interface ExportColumn {
  header: string;
  align?: "start" | "end";
  /** Relative width in the PDF layout (default 1). */
  weight?: number;
}

export interface ExportTable {
  heading: string;
  columns: readonly ExportColumn[];
  /** Display values (localized) for the PDF. */
  rows: readonly (readonly string[])[];
  /** Machine-friendly values for CSV (German number/date format); defaults to `rows`. */
  csvRows?: readonly (readonly string[])[];
  /** Optional 0–1 ratio per row, drawn as a small bar in the PDF. */
  bars?: readonly number[];
}

export interface ExportDocument {
  title: string;
  subtitle?: string;
  /** e.g. "Erstellt am 08.11.2026". */
  footnote?: string;
  /** Short key/value lines shown under the title. */
  summary?: readonly { label: string; value: string }[];
  tables: readonly ExportTable[];
  direction: "ltr" | "rtl";
  /** BCP 47 language for the PDF renderer (font selection). */
  language: string;
}

/** All tables as one CSV: title, then each table with heading, header and rows, separated by blank lines. */
export function documentToCsv(doc: ExportDocument): string {
  const lines: string[][] = [[doc.title]];
  if (doc.subtitle) lines.push([doc.subtitle]);
  for (const table of doc.tables) {
    lines.push(
      [],
      [table.heading],
      table.columns.map((c) => c.header),
    );
    lines.push(...(table.csvRows ?? table.rows).map((r) => [...r]));
  }
  return toCsv(lines);
}

/** A single table as a plain CSV (header + rows), e.g. for transaction lists. */
export function tableToCsv(table: ExportTable): string {
  return toCsv([table.columns.map((c) => c.header), ...(table.csvRows ?? table.rows)]);
}

/** File-name friendly slug ("Bericht März 2026" → "bericht-marz-2026"). */
export function fileSlug(text: string): string {
  return (
    text
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "export"
  );
}
