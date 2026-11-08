/** CSV parsing (RFC 4180 incl. quoted fields with line breaks) and structure detection. */

export const CSV_DELIMITERS = [";", ",", "\t", "|"] as const;
export type CsvDelimiter = (typeof CSV_DELIMITERS)[number];

/** Parses CSV text into rows of trimmed cells. Blank lines are dropped. */
export function parseCsv(text: string, delimiter: CsvDelimiter): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let i = 0;

  const endCell = () => {
    row.push(cell.trim());
    cell = "";
  };
  const endRow = () => {
    endCell();
    if (row.some((c) => c !== "")) rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"' && cell.trim() === "") {
      cell = "";
      quoted = true;
    } else if (ch === delimiter) {
      endCell();
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      endRow();
    } else {
      cell += ch;
    }
    i += 1;
  }
  if (cell !== "" || row.length > 0) endRow();
  return rows;
}

function mostCommon(values: number[]): { value: number; count: number } {
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = { value: 0, count: 0 };
  for (const [value, count] of counts) {
    if (count > best.count || (count === best.count && value > best.value)) best = { value, count };
  }
  return best;
}

/**
 * Picks the delimiter that yields the most rows with the same (> 1) number
 * of columns. Bank files often start with a few info lines, so consistency
 * across the data rows counts, not the first line.
 */
export function detectDelimiter(text: string): CsvDelimiter {
  const sample = text.split(/\r?\n/).slice(0, 60).join("\n");
  let best: { delimiter: CsvDelimiter; score: number } = { delimiter: ";", score: 0 };
  for (const delimiter of CSV_DELIMITERS) {
    const widths = parseCsv(sample, delimiter).map((r) => r.length);
    const { value, count } = mostCommon(widths);
    const score = value > 1 ? count * Math.min(value, 20) : 0;
    if (score > best.score) best = { delimiter, score };
  }
  return best.delimiter;
}

/** Most common row width (the width of the actual transaction table). */
export function tableWidth(rows: readonly string[][]): number {
  return mostCommon(rows.map((r) => r.length)).value;
}

const NUMERIC_LIKE = /^[-+]?[\d.,\s€]+$/;

/**
 * Index of the header row: the first row that has the table width and
 * consists mostly of non-numeric labels. Info lines above it are skipped.
 */
export function detectHeaderRow(rows: readonly string[][]): number {
  const width = tableWidth(rows);
  const index = rows.findIndex((r) => {
    if (r.length < width) return false;
    const filled = r.filter((c) => c !== "");
    const labels = filled.filter((c) => !NUMERIC_LIKE.test(c));
    return filled.length >= Math.min(2, width) && labels.length === filled.length;
  });
  return Math.max(index, 0);
}
