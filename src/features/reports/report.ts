import type { Account } from "@/features/accounts/schemas";
import type { Category } from "@/features/categories/schemas";
import { type DateRange, lastMonthKeys, monthRange, yearRange } from "@/lib/utils/period";
import {
  type CategoryAmount,
  type CategoryTrend,
  type MonthTotals,
  type NetWorthPoint,
  type Totals,
  type TxLike,
  byCategory,
  categoryTrends,
  monthlySeries,
  netWorthSeries,
  totals,
} from "./aggregate";

export type ReportMode = "month" | "year";

export interface ReportPeriod {
  mode: ReportMode;
  /** `YYYY-MM` for month mode, `YYYY` for year mode. */
  key: string;
}

export interface Report {
  range: DateRange;
  /** Months shown in time series (12 months ending with the period). */
  months: string[];
  totals: Totals;
  expenses: CategoryAmount[];
  income: CategoryAmount[];
  monthly: MonthTotals[];
  netWorth: NetWorthPoint[];
  trends: CategoryTrend;
}

export function reportRange(period: ReportPeriod): DateRange {
  return period.mode === "month" ? monthRange(period.key) : yearRange(Number(period.key));
}

/** The period `offset` steps away (months or years). */
export function shiftReportPeriod(period: ReportPeriod, offset: number): ReportPeriod {
  if (period.mode === "year") return { mode: "year", key: String(Number(period.key) + offset) };
  const [y, m] = period.key.split("-").map(Number) as [number, number];
  const index = y * 12 + (m - 1) + offset;
  return {
    mode: "month",
    key: `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`,
  };
}

/** The period containing `date` in the given mode. */
export function reportPeriodFor(mode: ReportMode, date: string): ReportPeriod {
  return { mode, key: mode === "month" ? date.slice(0, 7) : date.slice(0, 4) };
}

export function buildReport(input: {
  period: ReportPeriod;
  transactions: readonly TxLike[];
  categories: readonly Category[];
  accounts: readonly Account[];
}): Report {
  const { period, transactions, categories, accounts } = input;
  const range = reportRange(period);
  const months = lastMonthKeys(range.end, 12);
  return {
    range,
    months,
    totals: totals(transactions, range),
    expenses: byCategory(transactions, categories, range, "expense"),
    income: byCategory(transactions, categories, range, "income"),
    monthly: monthlySeries(transactions, months),
    netWorth: netWorthSeries(accounts, transactions, months),
    trends: categoryTrends(transactions, categories, months, "expense", 5),
  };
}
