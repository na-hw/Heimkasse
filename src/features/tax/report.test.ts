import { describe, expect, it } from "vitest";
import type { Transaction } from "@/features/transactions/schemas";
import { taxReport } from "./report";

const tx = (over: Partial<Transaction>): Transaction => ({
  id: crypto.randomUUID(),
  created_at: "",
  updated_at: "",
  deleted_at: null,
  account_id: "a",
  category_id: null,
  type: "expense",
  amount_cents: 1000,
  date: "2026-03-01",
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

describe("taxReport", () => {
  it("totals per category for the year, refunds reduce", () => {
    const report = taxReport(
      [
        tx({ tax_category: "donations", amount_cents: 5000, date: "2026-12-01" }),
        tx({ tax_category: "work_expenses", amount_cents: 12000, date: "2026-02-01" }),
        tx({ tax_category: "work_expenses", amount_cents: 3000, date: "2026-01-15" }),
        tx({ tax_category: "medical_costs", amount_cents: 8000 }),
        tx({ tax_category: "medical_costs", type: "income", amount_cents: 2000 }),
        tx({ tax_category: "donations", date: "2025-12-31" }),
        tx({}),
      ],
      2026,
    );
    expect(report.categories.map((c) => [c.category, c.total, c.transactions.length])).toEqual([
      ["work_expenses", 15000, 2],
      ["medical_costs", 6000, 2],
      ["donations", 5000, 1],
    ]);
    expect(report.categories[0]?.transactions[0]?.date).toBe("2026-01-15");
    expect(report.total).toBe(26000);
  });
});
