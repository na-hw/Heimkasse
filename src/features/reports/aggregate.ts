import { effectOnAccount } from "@/features/accounts/balances";
import type { Account } from "@/features/accounts/schemas";
import type { Category } from "@/features/categories/schemas";
import type { Transaction } from "@/features/transactions/schemas";
import { type DateRange, inRange, monthKey, monthRange } from "@/lib/utils/period";

/** Pure aggregations for the dashboard and reports. All amounts in cents. */

export type TxLike = Pick<
  Transaction,
  "type" | "amount_cents" | "date" | "category_id" | "account_id" | "transfer_account_id"
>;
export type FlowType = "income" | "expense";

export interface Totals {
  income: number;
  expense: number;
  /** income − expense */
  net: number;
  /** net / income, or null without income. */
  savingsRate: number | null;
}

/** Income and expense in a range (transfers are ignored – they move money, they don't earn or spend it). */
export function totals(txs: readonly TxLike[], range: DateRange): Totals {
  let income = 0;
  let expense = 0;
  for (const tx of txs) {
    if (!inRange(tx.date, range)) continue;
    if (tx.type === "income") income += tx.amount_cents;
    else if (tx.type === "expense") expense += tx.amount_cents;
  }
  const net = income - expense;
  return { income, expense, net, savingsRate: income > 0 ? net / income : null };
}

/** Relative change from `previous` to `current`, or null if there is no base to compare with. */
export function relativeChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}

/** Top-level category id (subcategories roll up to their parent); null = uncategorized. */
export function rootCategoryId(
  categoryById: ReadonlyMap<string, Pick<Category, "id" | "parent_id">>,
  id: string | null,
): string | null {
  if (!id) return null;
  const category = categoryById.get(id);
  if (!category) return null;
  return category.parent_id && categoryById.has(category.parent_id) ? category.parent_id : id;
}

export interface CategoryAmount {
  /** Top-level category id; null = uncategorized. */
  categoryId: string | null;
  cents: number;
  /** Share of the total (0–1). */
  share: number;
}

/** Amounts per top-level category for one flow type, largest first. */
export function byCategory(
  txs: readonly TxLike[],
  categories: readonly Pick<Category, "id" | "parent_id">[],
  range: DateRange,
  type: FlowType,
): CategoryAmount[] {
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const sums = new Map<string | null, number>();
  for (const tx of txs) {
    if (tx.type !== type || !inRange(tx.date, range)) continue;
    const root = rootCategoryId(categoryById, tx.category_id);
    sums.set(root, (sums.get(root) ?? 0) + tx.amount_cents);
  }
  const total = [...sums.values()].reduce((a, b) => a + b, 0);
  return [...sums.entries()]
    .map(([categoryId, cents]) => ({ categoryId, cents, share: total > 0 ? cents / total : 0 }))
    .sort((a, b) => b.cents - a.cents);
}

export interface MonthTotals {
  month: string;
  income: number;
  expense: number;
  net: number;
}

/** Income/expense per calendar month for the given month keys (`YYYY-MM`). */
export function monthlySeries(txs: readonly TxLike[], months: readonly string[]): MonthTotals[] {
  const rows = new Map(months.map((month) => [month, { month, income: 0, expense: 0, net: 0 }]));
  for (const tx of txs) {
    const row = rows.get(monthKey(tx.date));
    if (!row) continue;
    if (tx.type === "income") row.income += tx.amount_cents;
    else if (tx.type === "expense") row.expense += tx.amount_cents;
  }
  for (const row of rows.values()) row.net = row.income - row.expense;
  return [...rows.values()];
}

export interface NetWorthPoint {
  month: string;
  /** Sum of all account balances at the end of the month. */
  balance: number;
}

/** Total balance of the given accounts at the end of each month. */
export function netWorthSeries(
  accounts: readonly Pick<Account, "id" | "initial_balance_cents">[],
  txs: readonly TxLike[],
  months: readonly string[],
): NetWorthPoint[] {
  const ids = new Set(accounts.map((a) => a.id));
  const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date));
  let balance = accounts.reduce((sum, a) => sum + a.initial_balance_cents, 0);
  let i = 0;
  return months.map((month) => {
    const end = monthRange(month).end;
    for (; i < sorted.length && (sorted[i] as TxLike).date <= end; i += 1) {
      const tx = sorted[i] as TxLike;
      for (const id of new Set([tx.account_id, tx.transfer_account_id])) {
        if (id && ids.has(id)) balance += effectOnAccount(tx, id);
      }
    }
    return { month, balance };
  });
}

export interface CategoryTrend {
  /** Top-level categories shown as series (largest total first). */
  categoryIds: (string | null)[];
  /** One row per month: amount per category id (key "none" for uncategorized). */
  rows: { month: string; values: Record<string, number> }[];
}

/** Key for a category id in trend rows (uncategorized = "none"). */
export const trendKey = (categoryId: string | null) => categoryId ?? "none";

/** Monthly amounts of the `top` largest top-level categories over the given months. */
export function categoryTrends(
  txs: readonly TxLike[],
  categories: readonly Pick<Category, "id" | "parent_id">[],
  months: readonly string[],
  type: FlowType,
  top = 5,
): CategoryTrend {
  if (months.length === 0) return { categoryIds: [], rows: [] };
  const range = {
    start: monthRange(months[0] as string).start,
    end: monthRange(months[months.length - 1] as string).end,
  };
  const categoryIds = byCategory(txs, categories, range, type)
    .slice(0, top)
    .map((c) => c.categoryId);
  const keys = new Set(categoryIds.map(trendKey));
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const rows = new Map(
    months.map((month) => [
      month,
      { month, values: Object.fromEntries([...keys].map((k) => [k, 0])) as Record<string, number> },
    ]),
  );
  for (const tx of txs) {
    if (tx.type !== type) continue;
    const row = rows.get(monthKey(tx.date));
    const key = trendKey(rootCategoryId(categoryById, tx.category_id));
    if (row && keys.has(key)) row.values[key] = (row.values[key] ?? 0) + tx.amount_cents;
  }
  return { categoryIds, rows: [...rows.values()] };
}
