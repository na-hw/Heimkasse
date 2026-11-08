// @vitest-environment node
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { createRepositories, type Repositories } from "@/features/repositories";
import { ADAPTER_FACTORIES } from "@/test/adapters";
import type { BankPreset } from "./format";
import type { ImportCandidate } from "./review";
import {
  deleteUserPreset,
  importCandidates,
  loadDuplicateContext,
  loadUserPresets,
  moveImportRule,
  saveUserPreset,
} from "./service";

const candidate = (over: Partial<ImportCandidate>): ImportCandidate => ({
  line: 1,
  status: "new",
  errors: [],
  selected: true,
  date: "2026-10-30",
  type: "expense",
  amountCents: 4510,
  payee: "REWE",
  note: "Einkauf",
  categoryId: null,
  ruleApplied: false,
  importHash: "v1:abc",
  ...over,
});

const preset = (id: string, name: string): BankPreset => ({
  id,
  name,
  encoding: "utf-8",
  delimiter: ";",
  dateFormat: "dd.mm.yyyy",
  decimal: "comma",
  invertAmounts: false,
  columns: { date: ["Datum"], amount: ["Betrag"], payee: [], payeeIncome: [], note: [] },
});

describe.each(ADAPTER_FACTORIES)("import service on $name", ({ create }) => {
  let repos: Repositories;
  let accountId: string;

  beforeEach(async () => {
    const storage = create();
    await storage.init();
    repos = createRepositories({ storage });
    accountId = (await repos.accounts.create({ name: "Giro", type: "bank" })).id;
  });

  it("saves only selected, valid candidates with their import hash", async () => {
    const count = await importCandidates(repos, accountId, [
      candidate({ line: 1 }),
      candidate({ line: 2, selected: false, importHash: "v1:b" }),
      candidate({ line: 3, status: "invalid", importHash: null }),
      candidate({ line: 4, type: "income", amountCents: 100, importHash: "v1:c" }),
    ]);
    expect(count).toBe(2);
    const stored = await repos.transactions.list({ orderBy: [{ field: "amount_cents" }] });
    expect(stored.map((t) => [t.type, t.amount_cents, t.import_hash])).toEqual([
      ["income", 100, "v1:c"],
      ["expense", 4510, "v1:abc"],
    ]);
  });

  it("builds the duplicate context incl. trashed imports", async () => {
    await importCandidates(repos, accountId, [candidate({})]);
    const [imported] = await repos.transactions.list();
    await repos.transactions.softDelete([imported?.id ?? ""]);
    await repos.transactions.create({
      account_id: accountId,
      type: "expense",
      amount_cents: 999,
      date: "2026-10-01",
    });
    const context = await loadDuplicateContext(repos, accountId);
    expect(context.hashes.has("v1:abc")).toBe(true);
    expect(context.manual.map((t) => t.amount_cents)).toEqual([999]);
  });

  it("stores, replaces and deletes user presets", async () => {
    expect(await loadUserPresets(repos)).toEqual([]);
    await saveUserPreset(repos, preset("a", "Meine Bank"));
    await saveUserPreset(repos, preset("b", "Zweite"));
    await saveUserPreset(repos, preset("a", "Umbenannt"));
    expect((await loadUserPresets(repos)).map((p) => p.name)).toEqual(["Umbenannt", "Zweite"]);
    await deleteUserPreset(repos, "a");
    expect((await loadUserPresets(repos)).map((p) => p.id)).toEqual(["b"]);
  });

  it("reorders import rules", async () => {
    const a = await repos.importRules.create({
      match_field: "any",
      match_text: "a",
      sort_order: 0,
    });
    const b = await repos.importRules.create({
      match_field: "any",
      match_text: "b",
      sort_order: 1,
    });
    expect(await moveImportRule(repos, [a, b], b.id, "up")).toBe(true);
    const ordered = await repos.importRules.list({ orderBy: [{ field: "sort_order" }] });
    expect(ordered.map((r) => r.match_text)).toEqual(["b", "a"]);
    expect(await moveImportRule(repos, ordered, b.id, "up")).toBe(false);
  });
});
