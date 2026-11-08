import { describe, expect, it } from "vitest";
import {
  EMPTY_FILTERS,
  collectPayees,
  collectTags,
  countActiveFilters,
  matchesClientFilters,
  sortTransactions,
  toStorageConditions,
} from "./filters";
import { flattenGroups, groupByDay, netEffect } from "./grouping";
import type { Transaction } from "./schemas";

let n = 0;
const tx = (over: Partial<Transaction>): Transaction => ({
  id: `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`,
  created_at: `2026-11-08T10:00:${String(n).padStart(2, "0")}.000Z`,
  updated_at: "2026-11-08T10:00:00.000Z",
  deleted_at: null,
  account_id: "acc-a",
  category_id: null,
  type: "expense",
  amount_cents: 1000,
  date: "2026-11-08",
  payee: null,
  note: null,
  payment_method: null,
  tags: [],
  tax_category: null,
  recurring_rule_id: null,
  transfer_account_id: null,
  import_hash: null,
  ...over,
});

const ctx = {
  categoryName: (id: string | null) => (id === "food" ? "Lebensmittel" : ""),
  accountName: () => "Giro",
};

describe("transaction filters", () => {
  it("counts active filters", () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
    expect(
      countActiveFilters({ ...EMPTY_FILTERS, search: "x", dateFrom: "2026-01-01", tags: ["a"] }),
    ).toBe(2);
  });

  it("builds storage conditions", () => {
    const where = toStorageConditions({
      ...EMPTY_FILTERS,
      dateFrom: "2026-01-01",
      types: ["expense"],
      amountMax: 500,
    });
    expect(where).toEqual([
      { field: "date", op: "gte", value: "2026-01-01" },
      { field: "type", op: "in", values: ["expense"] },
      { field: "amount_cents", op: "lte", value: 500 },
    ]);
  });

  it("matches accounts including transfer targets", () => {
    const transfer = tx({ type: "transfer", account_id: "acc-a", transfer_account_id: "acc-b" });
    expect(matchesClientFilters(transfer, { ...EMPTY_FILTERS, accountIds: ["acc-b"] }, ctx)).toBe(
      true,
    );
    expect(matchesClientFilters(transfer, { ...EMPTY_FILTERS, accountIds: ["acc-c"] }, ctx)).toBe(
      false,
    );
  });

  it("searches payee, note, tags and category name (all words)", () => {
    const t = tx({ payee: "REWE Markt", category_id: "food", tags: ["urlaub"] });
    expect(matchesClientFilters(t, { ...EMPTY_FILTERS, search: "rewe" }, ctx)).toBe(true);
    expect(matchesClientFilters(t, { ...EMPTY_FILTERS, search: "lebensmittel urlaub" }, ctx)).toBe(
      true,
    );
    expect(matchesClientFilters(t, { ...EMPTY_FILTERS, search: "rewe aldi" }, ctx)).toBe(false);
  });

  it("filters by any selected tag", () => {
    expect(
      matchesClientFilters(tx({ tags: ["a", "b"] }), { ...EMPTY_FILTERS, tags: ["b", "c"] }, ctx),
    ).toBe(true);
    expect(matchesClientFilters(tx({ tags: ["a"] }), { ...EMPTY_FILTERS, tags: ["c"] }, ctx)).toBe(
      false,
    );
  });

  it("sorts by date and amount with newest-created tiebreak", () => {
    const a = tx({ date: "2026-11-01", amount_cents: 300 });
    const b = tx({ date: "2026-11-05", amount_cents: 100 });
    const c = tx({ date: "2026-11-05", amount_cents: 200 });
    expect(sortTransactions([a, b, c], "dateDesc").map((t) => t.id)).toEqual([c.id, b.id, a.id]);
    expect(sortTransactions([a, b, c], "amountAsc").map((t) => t.amount_cents)).toEqual([
      100, 200, 300,
    ]);
  });

  it("collects tags and payees", () => {
    expect(collectTags([tx({ tags: ["b", "a"] }), tx({ tags: ["a"] })])).toEqual(["a", "b"]);
    expect(
      collectPayees([tx({ payee: "Aldi" }), tx({ payee: "REWE" }), tx({ payee: "REWE" })]),
    ).toEqual(["REWE", "Aldi"]);
  });
});

describe("grouping", () => {
  it("groups by day with net totals; transfers are neutral", () => {
    const list = [
      tx({ date: "2026-11-08", type: "income", amount_cents: 5000 }),
      tx({ date: "2026-11-08", amount_cents: 1200 }),
      tx({ date: "2026-11-07", type: "transfer", amount_cents: 999, transfer_account_id: "b" }),
    ];
    const groups = groupByDay(list);
    expect(groups.map((g) => [g.date, g.netCents])).toEqual([
      ["2026-11-08", 3800],
      ["2026-11-07", 0],
    ]);
    expect(flattenGroups(groups).map((i) => i.kind)).toEqual([
      "header",
      "row",
      "row",
      "header",
      "row",
    ]);
    expect(netEffect({ type: "expense", amount_cents: 5 })).toBe(-5);
  });
});
