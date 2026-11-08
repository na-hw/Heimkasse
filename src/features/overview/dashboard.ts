import { computeBalances, totalBalance } from "@/features/accounts/balances";
import type { Account } from "@/features/accounts/schemas";
import type { Category } from "@/features/categories/schemas";
import type { RecurringRule } from "@/features/recurring/schemas";
import { type UpcomingItem, upcomingOccurrences } from "@/features/recurring/service";
import {
  type CategoryAmount,
  type Totals,
  type TxLike,
  byCategory,
  relativeChange,
  totals,
} from "@/features/reports/aggregate";
import type { DateRange } from "@/lib/utils/period";

export const UPCOMING_DAYS = 14;
export const TOP_CATEGORY_COUNT = 5;

export interface DashboardData {
  /** Balance across active accounts. */
  balance: number;
  current: Totals;
  previous: Totals;
  change: { income: number | null; expense: number | null };
  topCategories: CategoryAmount[];
  upcoming: UpcomingItem[];
}

interface DashboardInput {
  accounts: readonly Account[];
  transactions: readonly TxLike[];
  categories: readonly Category[];
  rules: readonly RecurringRule[];
  period: DateRange;
  previousPeriod: DateRange;
  today: string;
}

/** Key figures for the dashboard (pure; the hook only wires the data in). */
export function buildDashboard(input: DashboardInput): DashboardData {
  const { accounts, transactions, categories, rules, period, previousPeriod, today } = input;
  const balances = computeBalances(accounts, transactions);
  const current = totals(transactions, period);
  const previous = totals(transactions, previousPeriod);
  return {
    balance: totalBalance(
      balances,
      accounts.filter((a) => !a.archived).map((a) => a.id),
    ),
    current,
    previous,
    change: {
      income: relativeChange(current.income, previous.income),
      expense: relativeChange(current.expense, previous.expense),
    },
    topCategories: byCategory(transactions, categories, period, "expense").slice(
      0,
      TOP_CATEGORY_COUNT,
    ),
    upcoming: upcomingOccurrences(rules, today, UPCOMING_DAYS),
  };
}
