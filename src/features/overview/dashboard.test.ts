import { describe, expect, it } from "vitest";
import type { Account } from "@/features/accounts/schemas";
import type { RecurringRule } from "@/features/recurring/schemas";
import type { TxLike } from "@/features/reports/aggregate";
import { buildDashboard } from "./dashboard";

const base = { created_at: "", updated_at: "", deleted_at: null };
const account = (id: string, initial: number, archived = false): Account => ({
  ...base,
  id,
  name: id,
  type: "bank",
  initial_balance_cents: initial,
  color: "teal",
  icon: "landmark",
  archived,
  sort_order: 0,
});
const tx = (type: TxLike["type"], amount_cents: number, date: string): TxLike => ({
  type,
  amount_cents,
  date,
  category_id: null,
  account_id: "a1",
  transfer_account_id: null,
});
const rule: RecurringRule = {
  ...base,
  id: "r1",
  type: "expense",
  amount_cents: 80000,
  account_id: "a1",
  transfer_account_id: null,
  category_id: null,
  payee: "Miete",
  note: null,
  payment_method: null,
  tags: [],
  tax_category: null,
  frequency: "monthly",
  interval: 1,
  start_date: "2026-12-01",
  end_date: null,
  next_run_date: "2026-12-01",
  auto_create: true,
  paused: false,
};

describe("buildDashboard", () => {
  const data = buildDashboard({
    accounts: [account("a1", 100000), account("old", 5000, true)],
    transactions: [
      tx("income", 300000, "2026-11-01"),
      tx("expense", 150000, "2026-11-03"),
      tx("income", 300000, "2026-10-01"),
      tx("expense", 100000, "2026-10-10"),
    ],
    categories: [],
    rules: [rule],
    period: { start: "2026-11-01", end: "2026-11-30" },
    previousPeriod: { start: "2026-10-01", end: "2026-10-31" },
    today: "2026-11-20",
  });

  it("sums the balance of active accounts only", () => {
    expect(data.balance).toBe(100000 + 600000 - 250000);
  });

  it("compares the period with the previous one", () => {
    expect(data.current.savingsRate).toBeCloseTo(0.5);
    expect(data.change.income).toBe(0);
    expect(data.change.expense).toBeCloseTo(0.5);
  });

  it("lists payments due within 14 days", () => {
    expect(data.upcoming.map((u) => u.date)).toEqual(["2026-12-01"]);
  });
});
