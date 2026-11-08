import { describe, expect, it } from "vitest";
import type { Category } from "@/features/categories/schemas";
import { applyPreset, detectFormat, updateFormat } from "./detect";
import { importHashes } from "./duplicates";
import { extractRows } from "./extract";
import { BUILTIN_PRESETS, detectPreset, presetFromMapping } from "./presets";
import { buildCandidates, duplicateContext, summarize } from "./review";
import { applyImportRules } from "./rules";
import type { ImportRule } from "./schemas";

const ACCOUNT = "11111111-1111-4111-8111-111111111111";
const GROCERIES = "22222222-2222-4222-8222-222222222222";
const SALARY = "33333333-3333-4333-8333-333333333333";
const encode = (s: string) => new TextEncoder().encode(s);

const sparkasse = [
  '"Auftragskonto";"Buchungstag";"Valutadatum";"Buchungstext";"Verwendungszweck";"Beguenstigter/Zahlungspflichtiger";"Kontonummer/IBAN";"Betrag";"Waehrung";"Info"',
  '"DE00";"30.10.26";"30.10.26";"KARTENZAHLUNG";"REWE SAGT DANKE";"REWE Markt GmbH";"DE11";"-45,10";"EUR";"Umsatz gebucht"',
  '"DE00";"29.10.26";"29.10.26";"LOHN GEHALT";"Gehalt Oktober";"Arbeitgeber GmbH";"DE22";"2.500,00";"EUR";"Umsatz gebucht"',
  '"DE00";"28.10.26";"28.10.26";"KARTENZAHLUNG";"Kaffee";"Bäckerei";"DE33";"-3,20";"EUR";"Umsatz gebucht"',
  '"DE00";"28.10.26";"28.10.26";"KARTENZAHLUNG";"Kaffee";"Bäckerei";"DE33";"-3,20";"EUR";"Umsatz gebucht"',
].join("\r\n");

const n26 = [
  '"Booking Date","Value Date","Partner Name","Partner Iban","Type","Payment Reference","Account Name","Amount (EUR)","Original Amount","Original Currency","Exchange Rate"',
  '"2026-10-30","2026-10-30","Spotify","","Presentment","-","Main","-10.99","","",""',
  '"2026-10-29","2026-10-29","Arbeitgeber","DE00","Income","Gehalt","Main","2500.00","","",""',
].join("\n");

const rule = (overrides: Partial<ImportRule>): ImportRule => ({
  id: crypto.randomUUID(),
  created_at: "2026-11-08T10:00:00.000Z",
  updated_at: "2026-11-08T10:00:00.000Z",
  deleted_at: null,
  match_field: "any",
  match_text: "x",
  category_id: null,
  payee_rename: null,
  sort_order: 0,
  ...overrides,
});

const category = (id: string, type: "income" | "expense"): Category =>
  ({
    id,
    type,
    archived: false,
    deleted_at: null,
  }) as Category;

describe("format detection", () => {
  it("recognises a Sparkasse export end to end", () => {
    const { format, preset } = detectFormat(encode(sparkasse), BUILTIN_PRESETS);
    expect(preset?.id).toBe("sparkasse");
    expect(format).toMatchObject({
      delimiter: ";",
      headerRow: 0,
      dateFormat: "dd.mm.yy",
      decimal: "comma",
      mapping: { date: 1, amount: 7, payee: 5, note: 4 },
    });
  });

  it("recognises N26 with ISO dates and dot decimals", () => {
    const { format, preset, file } = detectFormat(encode(n26), BUILTIN_PRESETS);
    expect(preset?.id).toBe("n26");
    expect(format).toMatchObject({ delimiter: ",", dateFormat: "yyyy-mm-dd", decimal: "dot" });
    const rows = extractRows(file.rows, format);
    expect(rows.map((r) => [r.date, r.amountCents, r.payee])).toEqual([
      ["2026-10-30", -1099, "Spotify"],
      ["2026-10-29", 250000, "Arbeitgeber"],
    ]);
  });

  it("falls back to detected formats when a preset's default does not fit", () => {
    const dkbOld =
      "Buchungstag;Wertstellung;Auftraggeber / Begünstigter;Verwendungszweck;Betrag (EUR)\n30.10.2026;30.10.2026;REWE;Einkauf;-12,00";
    const { format, preset } = detectFormat(encode(dkbOld), BUILTIN_PRESETS);
    expect(preset?.id).toBe("dkb");
    expect(format.dateFormat).toBe("dd.mm.yyyy");
  });

  it("uses the income payee column for credits (DKB)", () => {
    const dkb =
      '"Buchungsdatum";"Zahlungspflichtige*r";"Zahlungsempfänger*in";"Verwendungszweck";"Betrag (€)"\n' +
      '"30.10.26";"Ich";"REWE";"Einkauf";"-45,10"\n"29.10.26";"Arbeitgeber";"Ich";"Gehalt";"2.500,00"';
    const { format, file } = detectFormat(encode(dkb), BUILTIN_PRESETS);
    expect(extractRows(file.rows, format).map((r) => r.payee)).toEqual(["REWE", "Arbeitgeber"]);
  });

  it("guesses a mapping for unknown banks and supports inverted signs", () => {
    const csv = "Datum;Empfänger;Beschreibung;Betrag\n01.11.2026;Miete;November;850,00";
    const { format, preset, file } = detectFormat(encode(csv), BUILTIN_PRESETS);
    expect(preset).toBeNull();
    expect(format.mapping).toMatchObject({ date: 0, payee: 1, note: 2, amount: 3 });
    const [row] = extractRows(file.rows, { ...format, invertAmounts: true });
    expect(row?.amountCents).toBe(-85000);
  });

  it("round-trips a user preset by header names and prefers it", () => {
    const { format, file } = detectFormat(encode(sparkasse), BUILTIN_PRESETS);
    const custom = presetFromMapping(
      {
        id: "mine",
        name: "Meine Sparkasse",
        encoding: "utf-8",
        delimiter: ";",
        dateFormat: "dd.mm.yy",
        decimal: "comma",
        invertAmounts: false,
      },
      file.header,
      { ...format.mapping, note: 3 },
    );
    expect(custom.columns.note).toEqual(["Buchungstext"]);
    expect(detectPreset(file.header, [custom, ...BUILTIN_PRESETS])?.id).toBe("mine");
    expect(applyPreset(file, format, custom).mapping.note).toBe(3);
  });

  it("marks rows with unreadable values", () => {
    const { format, file } = detectFormat(encode("Datum;Betrag\nfoo;1,00\n01.11.2026;x"), []);
    expect(extractRows(file.rows, format).map((r) => r.errors)).toEqual([["date"], ["amount"]]);
  });
});

describe("rules", () => {
  it("applies the first matching rule by order", () => {
    const rules = [
      rule({ match_text: "rewe", category_id: GROCERIES, payee_rename: "REWE", sort_order: 1 }),
      rule({ match_text: "markt", sort_order: 0, match_field: "note" }),
    ];
    expect(applyImportRules({ payee: "REWE Markt GmbH", note: null }, rules)).toMatchObject({
      categoryId: GROCERIES,
      payee: "REWE",
    });
    expect(applyImportRules({ payee: "Aldi", note: "Markt" }, rules).categoryId).toBeNull();
    expect(applyImportRules({ payee: "Aldi", note: null }, rules).ruleId).toBeNull();
  });
});

describe("duplicates and review", () => {
  const { format, file } = detectFormat(encode(sparkasse), BUILTIN_PRESETS);
  const rows = extractRows(file.rows, format);
  const rules = [
    rule({ match_text: "rewe", category_id: GROCERIES }),
    // Wrong type for income → ignored for the salary row
    rule({ match_text: "gehalt", category_id: GROCERIES, sort_order: 1 }),
  ];
  const categories = [category(GROCERIES, "expense"), category(SALARY, "income")];
  const empty = duplicateContext([]);

  it("hashes identical rows in a file differently but stably", () => {
    const input = {
      accountId: ACCOUNT,
      date: "2026-10-28",
      amountCents: -320,
      payee: "B",
      note: "K",
    };
    const [a, b] = importHashes([input, input]);
    expect(a).not.toBe(b);
    expect(importHashes([input, input])).toEqual([a, b]);
    expect(a?.length).toBeLessThanOrEqual(128);
  });

  it("builds candidates with categories from fitting rules", () => {
    const candidates = buildCandidates({
      rows,
      accountId: ACCOUNT,
      rules,
      categories,
      context: empty,
    });
    expect(candidates.map((c) => [c.type, c.amountCents, c.categoryId, c.status])).toEqual([
      ["expense", 4510, GROCERIES, "new"],
      ["income", 250000, null, "new"],
      ["expense", 320, null, "new"],
      ["expense", 320, null, "new"],
    ]);
    expect(summarize(candidates).selected).toBe(4);
  });

  it("marks re-imports as duplicates and same-day manual bookings as possible duplicates", () => {
    const first = buildCandidates({ rows, accountId: ACCOUNT, rules, categories, context: empty });
    const stored = first.slice(0, 3).map((c) => ({
      date: c.date ?? "",
      type: c.type,
      amount_cents: c.amountCents,
      import_hash: c.importHash,
      deleted_at: null,
    }));
    const manual = {
      date: "2026-10-28",
      type: "expense",
      amount_cents: 320,
      import_hash: null,
      deleted_at: null,
    };
    const context = duplicateContext([...stored, manual] as unknown as Parameters<
      typeof duplicateContext
    >[0]);
    const second = buildCandidates({ rows, accountId: ACCOUNT, rules, categories, context });
    expect(second.map((c) => [c.status, c.selected])).toEqual([
      ["duplicate", false],
      ["duplicate", false],
      ["duplicate", false],
      ["possibleDuplicate", false],
    ]);
    expect(summarize(second)).toMatchObject({ selected: 0, duplicates: 3, possibleDuplicates: 1 });
  });
});

describe("updateFormat", () => {
  it("re-parses and re-maps when the delimiter changes", () => {
    const bytes = encode(sparkasse);
    const detected = detectFormat(bytes, BUILTIN_PRESETS);
    const broken = updateFormat(bytes, detected, { delimiter: "," }, BUILTIN_PRESETS, null);
    expect(broken.format.mapping.amount).toBeNull();
    const fixed = updateFormat(bytes, broken, { delimiter: ";" }, BUILTIN_PRESETS, null);
    expect(fixed.presetId).toBe("sparkasse");
    expect(fixed.format.mapping.amount).toBe(7);
  });

  it("keeps the file for non-structural changes", () => {
    const bytes = encode(sparkasse);
    const detected = detectFormat(bytes, BUILTIN_PRESETS);
    const next = updateFormat(bytes, detected, { invertAmounts: true }, BUILTIN_PRESETS, "x");
    expect(next.file).toBe(detected.file);
    expect(next.format.invertAmounts).toBe(true);
  });
});
