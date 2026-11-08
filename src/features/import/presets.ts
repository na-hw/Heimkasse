import { type BankPreset, type ColumnMapping, EMPTY_MAPPING, MAPPING_FIELDS } from "./format";

const preset = (
  p: Omit<BankPreset, "invertAmounts"> & { invertAmounts?: boolean },
): BankPreset => ({
  invertAmounts: false,
  ...p,
});

/**
 * Built-in presets for common German banks (header names of their current
 * and previous CSV exports). Users can adjust a mapping and save it as their own preset.
 */
export const BUILTIN_PRESETS: readonly BankPreset[] = [
  preset({
    id: "sparkasse",
    name: "Sparkasse",
    encoding: "windows-1252",
    delimiter: ";",
    dateFormat: "dd.mm.yy",
    decimal: "comma",
    columns: {
      date: ["Buchungstag"],
      amount: ["Betrag"],
      payee: ["Beguenstigter/Zahlungspflichtiger", "Begünstigter/Zahlungspflichtiger"],
      payeeIncome: [],
      note: ["Verwendungszweck"],
    },
  }),
  preset({
    id: "n26",
    name: "N26",
    encoding: "utf-8",
    delimiter: ",",
    dateFormat: "yyyy-mm-dd",
    decimal: "dot",
    columns: {
      date: ["Booking Date", "Date"],
      amount: ["Amount (EUR)"],
      payee: ["Partner Name", "Payee"],
      payeeIncome: [],
      note: ["Payment Reference", "Payment reference"],
    },
  }),
  preset({
    id: "dkb",
    name: "DKB",
    encoding: "utf-8",
    delimiter: ";",
    dateFormat: "dd.mm.yy",
    decimal: "comma",
    columns: {
      date: ["Buchungsdatum", "Buchungstag"],
      amount: ["Betrag (€)", "Betrag (EUR)"],
      payee: ["Zahlungsempfänger*in", "Auftraggeber / Begünstigter"],
      payeeIncome: ["Zahlungspflichtige*r"],
      note: ["Verwendungszweck"],
    },
  }),
  preset({
    id: "ing",
    name: "ING",
    encoding: "windows-1252",
    delimiter: ";",
    dateFormat: "dd.mm.yyyy",
    decimal: "comma",
    columns: {
      date: ["Buchung"],
      amount: ["Betrag"],
      payee: ["Auftraggeber/Empfänger"],
      payeeIncome: [],
      note: ["Verwendungszweck"],
    },
  }),
  preset({
    id: "commerzbank",
    name: "Commerzbank",
    encoding: "utf-8",
    delimiter: ";",
    dateFormat: "dd.mm.yyyy",
    decimal: "comma",
    columns: {
      date: ["Buchungstag"],
      amount: ["Betrag"],
      payee: ["Buchungstext"],
      payeeIncome: [],
      note: ["Umsatzart"],
    },
  }),
];

/** Generic header names used when no preset matches. */
const GENERIC_COLUMNS: BankPreset["columns"] = {
  date: ["Buchungstag", "Buchungsdatum", "Buchung", "Booking Date", "Datum", "Date", "Valuta"],
  amount: ["Betrag", "Betrag (EUR)", "Betrag (€)", "Amount (EUR)", "Amount", "Umsatz"],
  payee: [
    "Beguenstigter/Zahlungspflichtiger",
    "Begünstigter/Zahlungspflichtiger",
    "Zahlungsempfänger*in",
    "Auftraggeber/Empfänger",
    "Auftraggeber / Begünstigter",
    "Partner Name",
    "Empfänger",
    "Payee",
    "Name",
  ],
  payeeIncome: ["Zahlungspflichtige*r"],
  note: ["Verwendungszweck", "Payment Reference", "Buchungstext", "Beschreibung", "Description"],
};

const normalizeHeader = (h: string) => h.normalize("NFC").trim().toLowerCase().replace(/\s+/g, " ");

/** Maps each field to the first header matching one of its candidate names. */
export function mappingFromColumns(
  header: readonly string[],
  columns: BankPreset["columns"],
): ColumnMapping {
  const normalized = header.map(normalizeHeader);
  const used = new Set<number>();
  const mapping: ColumnMapping = { ...EMPTY_MAPPING };
  for (const field of MAPPING_FIELDS) {
    for (const candidate of columns[field]) {
      const index = normalized.findIndex(
        (h, i) => h === normalizeHeader(candidate) && !used.has(i),
      );
      if (index !== -1) {
        mapping[field] = index;
        used.add(index);
        break;
      }
    }
  }
  return mapping;
}

/** Best guess without a preset. */
export function guessMapping(header: readonly string[]): ColumnMapping {
  return mappingFromColumns(header, GENERIC_COLUMNS);
}

/**
 * The preset all of whose main columns (date, amount and – if the preset
 * defines them – payee and note) exist in the header; the one matching most
 * columns wins. User presets win ties (they are listed first).
 */
export function detectPreset(
  header: readonly string[],
  presets: readonly BankPreset[],
): BankPreset | null {
  const main = ["date", "amount", "payee", "note"] as const;
  let best: { preset: BankPreset; score: number } | null = null;
  for (const p of presets) {
    const mapping = mappingFromColumns(header, p.columns);
    const complete = main.every((f) => p.columns[f].length === 0 || mapping[f] !== null);
    if (!complete || mapping.date === null || mapping.amount === null) continue;
    const score = Object.values(mapping).filter((v) => v !== null).length;
    if (!best || score > best.score) best = { preset: p, score };
  }
  return best?.preset ?? null;
}

/** Turns a mapping into a preset that identifies columns by their header names. */
export function presetFromMapping(
  base: Omit<BankPreset, "columns">,
  header: readonly string[],
  mapping: ColumnMapping,
): BankPreset {
  const columns = Object.fromEntries(
    MAPPING_FIELDS.map((field) => {
      const index = mapping[field];
      const name = index === null ? undefined : header[index];
      return [field, name ? [name] : []];
    }),
  ) as BankPreset["columns"];
  return { ...base, columns };
}
