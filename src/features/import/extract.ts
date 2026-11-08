import type { ImportFormat } from "./format";
import { parseAmountValue, parseDateValue } from "./values";

export type RowError = "date" | "amount";

/** One CSV data row interpreted with the chosen format. */
export interface ExtractedRow {
  /** 1-based line within the data rows (for display). */
  line: number;
  date: string | null;
  /** Signed: negative = expense. */
  amountCents: number | null;
  payee: string | null;
  note: string | null;
  errors: RowError[];
}

const PAYEE_MAX = 120;
const NOTE_MAX = 500;

const cell = (row: readonly string[], index: number | null): string =>
  index === null ? "" : (row[index] ?? "").replace(/\s+/g, " ").trim();

const limit = (value: string, max: number): string | null =>
  value === "" ? null : value.length > max ? `${value.slice(0, max - 1)}…` : value;

/** Data rows below the header, interpreted per the format. Empty amount rows are kept as errors. */
export function extractRows(rows: readonly string[][], format: ImportFormat): ExtractedRow[] {
  const { mapping } = format;
  return rows.slice(format.headerRow + 1).map((row, i) => {
    const date = parseDateValue(cell(row, mapping.date), format.dateFormat);
    const parsedAmount = parseAmountValue(cell(row, mapping.amount), format.decimal);
    const amountCents =
      parsedAmount === null || parsedAmount === 0
        ? null
        : format.invertAmounts
          ? -parsedAmount
          : parsedAmount;
    const incomePayee =
      amountCents !== null && amountCents > 0 ? cell(row, mapping.payeeIncome) : "";
    const errors: RowError[] = [];
    if (!date) errors.push("date");
    if (amountCents === null) errors.push("amount");
    return {
      line: i + 1,
      date,
      amountCents,
      payee: limit(incomePayee || cell(row, mapping.payee), PAYEE_MAX),
      note: limit(cell(row, mapping.note), NOTE_MAX),
      errors,
    };
  });
}

/** Column values of the data rows (for format detection). */
export function columnSamples(
  rows: readonly string[][],
  headerRow: number,
  index: number | null,
  max = 50,
): string[] {
  if (index === null) return [];
  return rows.slice(headerRow + 1, headerRow + 1 + max).map((r) => r[index] ?? "");
}
