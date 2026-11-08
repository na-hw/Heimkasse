import { describe, expect, it } from "vitest";
import type { Category } from "@/features/categories/schemas";
import type { TxLike } from "@/features/reports/aggregate";
import type { Budget } from "./schemas";
import { budgetLevel, budgetStatuses, pendingAlerts, summarizeBudgets } from "./status";

const base = { created_at: "", updated_at: "", deleted_at: null };
const category = (id: string, parent_id: string | null = null): Category => ({
  ...base,
  id,
  parent_id,
  name: id,
  name_key: null,
  type: "expense",
  color: "gray",
  icon: "tag",
  archived: false,
  sort_order: 0,
  is_system: false,
});
const budget = (id: string, category_id: string, amount_cents: number, threshold = 80): Budget => ({
  ...base,
  id,
  category_id,
  period: "monthly",
  amount_cents,
  alert_threshold_percent: threshold,
});
const tx = (category_id: string, amount_cents: number, date = "2026-11-05"): TxLike => ({
  type: "expense",
  amount_cents,
  date,
  category_id,
  account_id: "a",
  transfer_account_id: null,
});

const categories = [category("food"), category("bakery", "food"), category("fun")];
const period = { start: "2026-11-01", end: "2026-11-30" };

describe("budgetLevel", () => {
  it("maps ratios to levels", () => {
    expect(budgetLevel(0.5, 80)).toBe("ok");
    expect(budgetLevel(0.8, 80)).toBe("warning");
    expect(budgetLevel(1, 80)).toBe("exceeded");
    expect(budgetLevel(1, 100)).toBe("exceeded");
  });
});

describe("budgetStatuses", () => {
  it("includes subcategories, ignores other periods and sorts by ratio", () => {
    const statuses = budgetStatuses(
      [budget("b1", "food", 10000), budget("b2", "fun", 5000)],
      [
        tx("food", 3000),
        tx("bakery", 5000),
        tx("food", 9999, "2026-10-31"),
        tx("fun", 6000),
        { ...tx("food", 100000), type: "income" },
      ],
      categories,
      period,
    );
    expect(statuses.map((s) => [s.budget.id, s.spent, s.remaining, s.level])).toEqual([
      ["b2", 6000, -1000, "exceeded"],
      ["b1", 8000, 2000, "warning"],
    ]);
    expect(summarizeBudgets(statuses)).toEqual({ budgeted: 15000, spent: 14000, remaining: 1000 });
  });
});

describe("pendingAlerts", () => {
  const statuses = budgetStatuses(
    [budget("b1", "food", 10000)],
    [tx("food", 8500)],
    categories,
    period,
  );

  it("alerts once per level and period", () => {
    const first = pendingAlerts(statuses, {}, period);
    expect(first.alerts.map((a) => a.level)).toEqual(["warning"]);
    expect(pendingAlerts(statuses, first.next, period).alerts).toEqual([]);
  });

  it("alerts again when the level rises", () => {
    const exceeded = budgetStatuses(
      [budget("b1", "food", 10000)],
      [tx("food", 12000)],
      categories,
      period,
    );
    const { alerts } = pendingAlerts(exceeded, { "b1:2026-11-01": "warning" }, period);
    expect(alerts.map((a) => a.level)).toEqual(["exceeded"]);
  });

  it("drops bookkeeping of old periods", () => {
    const { next } = pendingAlerts(statuses, { "b1:2026-10-01": "exceeded" }, period);
    expect(next).toEqual({ "b1:2026-11-01": "warning" });
  });
});
