import { z } from "zod";
import { CSV_ENCODINGS } from "./csv/decode";
import { CSV_DELIMITERS } from "./csv/parse";
import { DATE_FORMATS, DECIMAL_SEPARATORS } from "./values";

/** Transaction fields a CSV column can be mapped to. */
export const MAPPING_FIELDS = ["date", "amount", "payee", "payeeIncome", "note"] as const;
export type MappingField = (typeof MAPPING_FIELDS)[number];
export const REQUIRED_MAPPING_FIELDS: readonly MappingField[] = ["date", "amount"];

/** Column index per field (null = not mapped). */
export type ColumnMapping = Record<MappingField, number | null>;

export const EMPTY_MAPPING: ColumnMapping = {
  date: null,
  amount: null,
  payee: null,
  payeeIncome: null,
  note: null,
};

/** Everything needed to turn a CSV file into transaction rows. */
export interface ImportFormat {
  encoding: (typeof CSV_ENCODINGS)[number];
  delimiter: (typeof CSV_DELIMITERS)[number];
  /** Index of the header row; rows above it are skipped. */
  headerRow: number;
  dateFormat: (typeof DATE_FORMATS)[number];
  decimal: (typeof DECIMAL_SEPARATORS)[number];
  /** Flip signs for banks that export expenses as positive numbers. */
  invertAmounts: boolean;
  mapping: ColumnMapping;
}

/**
 * A bank preset identifies columns by header name (candidates per field),
 * so it keeps working when a bank adds or reorders columns.
 */
export const bankPresetSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(60),
  encoding: z.enum(CSV_ENCODINGS).nullable(),
  delimiter: z.enum(CSV_DELIMITERS).nullable(),
  dateFormat: z.enum(DATE_FORMATS).nullable(),
  decimal: z.enum(DECIMAL_SEPARATORS).nullable(),
  invertAmounts: z.boolean(),
  columns: z.object({
    date: z.array(z.string().max(120)).max(10),
    amount: z.array(z.string().max(120)).max(10),
    payee: z.array(z.string().max(120)).max(10),
    payeeIncome: z.array(z.string().max(120)).max(10),
    note: z.array(z.string().max(120)).max(10),
  }),
});
export type BankPreset = z.infer<typeof bankPresetSchema>;

/** User presets live in the settings row `import_presets`. */
export const IMPORT_PRESETS_KEY = "import_presets";
export const userPresetsSchema = z.array(bankPresetSchema).max(50);
