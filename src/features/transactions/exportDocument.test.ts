import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";
import type { Transaction } from "./schemas";
import { transactionsCsvTable, transactionsDocument } from "./exportDocument";

const t = ((key: string, opts?: { count?: number }) =>
  opts?.count !== undefined ? `${key}:${opts.count}` : key) as unknown as TFunction;
const lookups = {
  money: (c: number) => `${c}c`,
  date: (d: string) => d,
  accountName: (id: string | null) => (id ? `acc-${id}` : ""),
  categoryName: (id: string | null) => (id ? `cat-${id}` : "none"),
};
const tx = (over: Partial<Transaction>): Transaction => ({
  id: "1",
  created_at: "",
  updated_at: "",
  deleted_at: null,
  account_id: "a",
  category_id: "c",
  type: "expense",
  amount_cents: 4599,
  date: "2026-11-08",
  payee: "REWE",
  note: null,
  payment_method: "card",
  tags: ["food", "weekly"],
  tax_category: null,
  recurring_rule_id: null,
  transfer_account_id: null,
  import_hash: null,
  ...over,
});

describe("transaction export", () => {
  it("writes every field for CSV with signed German amounts", () => {
    const table = transactionsCsvTable(
      [tx({}), tx({ type: "transfer", transfer_account_id: "b", payee: null, category_id: null })],
      t,
      lookups,
    );
    expect(table.rows[0]).toEqual([
      "08.11.2026",
      "transactions.types.expense",
      "-45,99",
      "acc-a",
      "",
      "cat-c",
      "REWE",
      "",
      "paymentMethods.card",
      "food, weekly",
      "",
    ]);
    expect(table.rows[1]?.slice(2, 6)).toEqual(["45,99", "acc-a", "acc-b", ""]);
  });

  it("builds a compact PDF table", () => {
    const doc = transactionsDocument([tx({ type: "income", amount_cents: 100 })], t, lookups, {
      subtitle: "",
      footnote: "",
      language: "de",
      direction: "ltr",
    });
    expect(doc.tables[0]?.heading).toBe("transactions.count:1");
    expect(doc.tables[0]?.rows[0]).toEqual(["2026-11-08", "REWE", "cat-c", "acc-a", "100c"]);
  });
});
