import { type CsvEncoding, decodeText, detectEncoding } from "./csv/decode";
import { type CsvDelimiter, detectDelimiter, detectHeaderRow, parseCsv } from "./csv/parse";
import { columnSamples } from "./extract";
import type { BankPreset, ImportFormat } from "./format";
import { detectPreset, guessMapping, mappingFromColumns } from "./presets";
import { detectDateFormat, detectDecimalSeparator, parseDateValue } from "./values";

/** A decoded and parsed CSV file. */
export interface ParsedFile {
  rows: string[][];
  header: string[];
}

/** Decodes and parses with explicit settings (used when the user changes them). */
export function parseFile(
  bytes: Uint8Array,
  encoding: CsvEncoding,
  delimiter: CsvDelimiter,
  headerRow: number,
): ParsedFile {
  const rows = parseCsv(decodeText(bytes, encoding), delimiter);
  return { rows, header: rows[headerRow] ?? [] };
}

/** Fills date format and decimal separator from the data where the preset doesn't fit. */
export function refineFormat(rows: readonly string[][], format: ImportFormat): ImportFormat {
  const dates = columnSamples(rows, format.headerRow, format.mapping.date);
  const amounts = columnSamples(rows, format.headerRow, format.mapping.amount);
  const filled = dates.filter((d) => d.trim() !== "");
  const presetDateWorks = filled.every((d) => parseDateValue(d, format.dateFormat) !== null);
  return {
    ...format,
    dateFormat: presetDateWorks
      ? format.dateFormat
      : (detectDateFormat(dates) ?? format.dateFormat),
    decimal: amounts.length > 0 ? detectDecimalSeparator(amounts) : format.decimal,
  };
}

/**
 * Detects everything automatically: encoding, delimiter, header row,
 * bank preset (user presets first), column mapping, date and number format.
 */
export function detectFormat(
  bytes: Uint8Array,
  presets: readonly BankPreset[],
): { format: ImportFormat; preset: BankPreset | null; file: ParsedFile } {
  const encoding = detectEncoding(bytes);
  const text = decodeText(bytes, encoding);
  const delimiter = detectDelimiter(text);
  const rows = parseCsv(text, delimiter);
  const headerRow = detectHeaderRow(rows);
  const header = rows[headerRow] ?? [];
  const preset = detectPreset(header, presets);

  const base: ImportFormat = {
    encoding,
    delimiter,
    headerRow,
    dateFormat: preset?.dateFormat ?? "dd.mm.yyyy",
    decimal: preset?.decimal ?? "comma",
    invertAmounts: preset?.invertAmounts ?? false,
    mapping: preset ? mappingFromColumns(header, preset.columns) : guessMapping(header),
  };
  return { format: refineFormat(rows, base), preset, file: { rows, header } };
}

/** Applies a preset to an already parsed file. */
export function applyPreset(
  file: ParsedFile,
  format: ImportFormat,
  preset: BankPreset,
): ImportFormat {
  return refineFormat(file.rows, {
    ...format,
    dateFormat: preset.dateFormat ?? format.dateFormat,
    decimal: preset.decimal ?? format.decimal,
    invertAmounts: preset.invertAmounts,
    mapping: mappingFromColumns(file.header, preset.columns),
  });
}

/**
 * Applies a settings change. Changing encoding, delimiter or header row
 * re-parses the file and re-detects the column mapping (with the chosen
 * preset, otherwise by detection/guessing).
 */
export function updateFormat(
  bytes: Uint8Array,
  current: { file: ParsedFile; format: ImportFormat },
  patch: Partial<ImportFormat>,
  presets: readonly BankPreset[],
  presetId: string | null,
): { file: ParsedFile; format: ImportFormat; presetId: string | null } {
  const format = { ...current.format, ...patch };
  const structural =
    format.encoding !== current.format.encoding ||
    format.delimiter !== current.format.delimiter ||
    format.headerRow !== current.format.headerRow;
  if (!structural) return { file: current.file, format, presetId };

  const file = parseFile(bytes, format.encoding, format.delimiter, format.headerRow);
  const chosen =
    presets.find((p) => p.id === presetId) ?? detectPreset(file.header, presets) ?? null;
  if (chosen) return { file, format: applyPreset(file, format, chosen), presetId: chosen.id };
  return {
    file,
    format: refineFormat(file.rows, { ...format, mapping: guessMapping(file.header) }),
    presetId: null,
  };
}
