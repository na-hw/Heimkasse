import { describe, expect, it } from "vitest";
import {
  type TxLike,
  byCategory,
  categoryTrends,
  monthlySeries,
  netWorthSeries,
  relativeChange,
  totals,
} from "./aggregate";

const tx = (over: Partial<TxLike>): TxLike => ({
  type: "expense",
  amount_cents: 1000,
  date: "2026-11-05",
  category_id: null,
  account_id: "a1",
  transfer_account_id: null,
  ...over,
});

const categories = [
  { id: "food", parent_id: null },
  { id: "bakery", parent_id: "food" },
  { id: "rent", parent_id: null },
  { id: "salary", parent_id: null },
];

const nov = { start: "2026-11-01", end: "2026-11-30" };

describe("totals", () => {
  it("sums income and expense in range and ignores transfers", () => {
    const result = totals(
      [
        tx({ type: "income", amount_cents: 300000 }),
        tx({ amount_cents: 120000 }),
        tx({ type: "transfer", amount_cents: 50000, transfer_account_id: "a2" }),
        tx({ amount_cents: 999, date: "2026-10-31" }),
      ],
      nov,
    );
    expect(result).toEqual({ income: 300000, expense: 120000, net: 180000, savingsRate: 0.6 });
  });

  it("has no savings rate without income", () => {
    expect(totals([tx({})], nov).savingsRate).toBeNull();
  });
});

describe("relativeChange", () => {
  it("returns the ratio or null without a base", () => {
    expect(relativeChange(120, 100)).toBeCloseTo(0.2);
    expect(relativeChange(80, 100)).toBeCloseTo(-0.2);
    expect(relativeChange(5, 0)).toBeNull();
  });
});

describe("byCategory", () => {
  it("rolls subcategories up and computes shares", () => {
    const result = byCategory(
      [
        tx({ category_id: "food", amount_cents: 2000 }),
        tx({ category_id: "bakery", amount_cents: 1000 }),
        tx({ category_id: "rent", amount_cents: 6000 }),
        tx({ category_id: null, amount_cents: 1000 }),
        tx({ type: "income", category_id: "salary", amount_cents: 9999 }),
      ],
      categories,
      nov,
      "expense",
    );
    expect(result).toEqual([
      { categoryId: "rent", cents: 6000, share: 0.6 },
      { categoryId: "food", cents: 3000, share: 0.3 },
      { categoryId: null, cents: 1000, share: 0.1 },
    ]);
  });
});

describe("monthlySeries", () => {
  it("returns one row per month including empty ones", () => {
    const rows = monthlySeries(
      [
        tx({ type: "income", amount_cents: 5000, date: "2026-10-01" }),
        tx({ amount_cents: 2000, date: "2026-10-15" }),
        tx({ amount_cents: 700, date: "2026-12-24" }),
      ],
      ["2026-10", "2026-11", "2026-12"],
    );
    expect(rows).toEqual([
      { month: "2026-10", income: 5000, expense: 2000, net: 3000 },
      { month: "2026-11", income: 0, expense: 0, net: 0 },
      { month: "2026-12", income: 0, expense: 700, net: -700 },
    ]);
  });
});

describe("netWorthSeries", () => {
  it("accumulates balances at month ends; transfers between own accounts are neutral", () => {
    const accounts = [
      { id: "a1", initial_balance_cents: 10000 },
      { id: "a2", initial_balance_cents: 0 },
    ];
    const points = netWorthSeries(
      accounts,
      [
        tx({ type: "income", amount_cents: 5000, date: "2026-10-03" }),
        tx({ type: "transfer", amount_cents: 3000, date: "2026-10-04", transfer_account_id: "a2" }),
        tx({ amount_cents: 2000, date: "2026-11-30" }),
        tx({ amount_cents: 1, date: "2026-12-01" }),
      ],
      ["2026-09", "2026-10", "2026-11"],
    );
    expect(points).toEqual([
      { month: "2026-09", balance: 10000 },
      { month: "2026-10", balance: 15000 },
      { month: "2026-11", balance: 13000 },
    ]);
  });
});

describe("categoryTrends", () => {
  it("returns the top categories per month", () => {
    const trend = categoryTrends(
      [
        tx({ category_id: "rent", amount_cents: 6000, date: "2026-10-01" }),
        tx({ category_id: "rent", amount_cents: 6000, date: "2026-11-01" }),
        tx({ category_id: "bakery", amount_cents: 500, date: "2026-11-02" }),
        tx({ category_id: null, amount_cents: 100, date: "2026-11-03" }),
      ],
      categories,
      ["2026-10", "2026-11"],
      "expense",
      2,
    );
    expect(trend.categoryIds).toEqual(["rent", "food"]);
    expect(trend.rows).toEqual([
      { month: "2026-10", values: { rent: 6000, food: 0 } },
      { month: "2026-11", values: { rent: 6000, food: 500 } },
    ]);
  });
});
