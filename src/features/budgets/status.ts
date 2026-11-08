import type { Category } from "@/features/categories/schemas";
import { withDescendants } from "@/features/categories/tree";
import type { TxLike } from "@/features/reports/aggregate";
import { type DateRange, inRange } from "@/lib/utils/period";
import type { Budget } from "./schemas";

/** ok < warning (threshold reached) < exceeded (≥ 100 %). */
export type BudgetLevel = "ok" | "warning" | "exceeded";

export const LEVEL_RANK: Record<BudgetLevel, number> = { ok: 0, warning: 1, exceeded: 2 };

export interface BudgetStatus {
  budget: Budget;
  spent: number;
  /** amount − spent (negative when overspent). */
  remaining: number;
  /** spent / amount (may exceed 1). */
  ratio: number;
  level: BudgetLevel;
}

export function budgetLevel(ratio: number, thresholdPercent: number): BudgetLevel {
  if (ratio >= 1) return "exceeded";
  if (ratio * 100 >= thresholdPercent) return "warning";
  return "ok";
}

/** Expenses of a category incl. its subcategories within the period. */
export function spentInCategory(
  txs: readonly TxLike[],
  categories: readonly Category[],
  categoryId: string,
  period: DateRange,
): number {
  const ids = new Set(withDescendants(categories, categoryId));
  return txs.reduce(
    (sum, tx) =>
      tx.type === "expense" && tx.category_id && ids.has(tx.category_id) && inRange(tx.date, period)
        ? sum + tx.amount_cents
        : sum,
    0,
  );
}

/** Status of every budget for one period, most critical (highest ratio) first. */
export function budgetStatuses(
  budgets: readonly Budget[],
  txs: readonly TxLike[],
  categories: readonly Category[],
  period: DateRange,
): BudgetStatus[] {
  return budgets
    .map((budget) => {
      const spent = spentInCategory(txs, categories, budget.category_id, period);
      const ratio = budget.amount_cents > 0 ? spent / budget.amount_cents : 0;
      return {
        budget,
        spent,
        remaining: budget.amount_cents - spent,
        ratio,
        level: budgetLevel(ratio, budget.alert_threshold_percent),
      };
    })
    .sort((a, b) => b.ratio - a.ratio);
}

export interface BudgetSummary {
  budgeted: number;
  spent: number;
  remaining: number;
}

export function summarizeBudgets(statuses: readonly BudgetStatus[]): BudgetSummary {
  const budgeted = statuses.reduce((s, x) => s + x.budget.amount_cents, 0);
  const spent = statuses.reduce((s, x) => s + x.spent, 0);
  return { budgeted, spent, remaining: budgeted - spent };
}

/** Key identifying a budget within one period (for "alert once" bookkeeping). */
export const alertKey = (budgetId: string, period: DateRange) => `${budgetId}:${period.start}`;

export interface BudgetAlert {
  status: BudgetStatus;
  level: Exclude<BudgetLevel, "ok">;
}

/**
 * Budgets whose level rose above what was already notified in this period.
 * Returns the alerts and the updated notified map (old periods are dropped).
 */
export function pendingAlerts(
  statuses: readonly BudgetStatus[],
  notified: Readonly<Record<string, BudgetLevel>>,
  period: DateRange,
): { alerts: BudgetAlert[]; next: Record<string, BudgetLevel> } {
  const alerts: BudgetAlert[] = [];
  const next: Record<string, BudgetLevel> = {};
  for (const status of statuses) {
    const key = alertKey(status.budget.id, period);
    const previous = notified[key] ?? "ok";
    if (status.level !== "ok" && LEVEL_RANK[status.level] > LEVEL_RANK[previous])
      alerts.push({ status, level: status.level });
    // Keep the highest level seen; dropping back below (e.g. after a deletion) re-arms the alert.
    next[key] = status.level;
  }
  return { alerts, next };
}
