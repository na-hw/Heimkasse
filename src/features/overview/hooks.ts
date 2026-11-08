"use client";

import { useMemo } from "react";
import { useAccounts } from "@/features/accounts/hooks";
import { useCurrentBudgetPeriod } from "@/features/budgets/hooks";
import { useAllCategories } from "@/features/categories/hooks";
import { useRecurringRules } from "@/features/recurring/hooks";
import { combineQueries } from "@/features/shared/combineQueries";
import { useAllTransactions } from "@/features/transactions/hooks";
import { usePreferences } from "@/lib/preferences/store";
import { todayIso } from "@/lib/utils/dates";
import { shiftBudgetPeriod } from "@/lib/utils/period";
import { buildDashboard } from "./dashboard";

/** Dashboard figures for the current budget month compared with the previous one. */
export function useDashboard() {
  const accounts = useAccounts();
  const transactions = useAllTransactions();
  const categories = useAllCategories();
  const rules = useRecurringRules();
  const period = useCurrentBudgetPeriod();
  const startDay = usePreferences((s) => s.budgetMonthStartDay);
  const today = todayIso();

  const data = useMemo(
    () =>
      accounts.data && transactions.data && categories.data && rules.data
        ? buildDashboard({
            accounts: accounts.data.all,
            transactions: transactions.data,
            categories: categories.data,
            rules: rules.data,
            period,
            previousPeriod: shiftBudgetPeriod(period, -1, startDay),
            today,
          })
        : undefined,
    [accounts.data, transactions.data, categories.data, rules.data, period, startDay, today],
  );

  return {
    data,
    hasAccounts: accounts.data ? accounts.data.all.length > 0 : undefined,
    period,
    ...combineQueries([accounts, transactions, categories, rules]),
  };
}
