"use client";

import { useMemo } from "react";
import { useAccounts } from "@/features/accounts/hooks";
import { useAllCategories } from "@/features/categories/hooks";
import { combineQueries } from "@/features/shared/combineQueries";
import { useAllTransactions } from "@/features/transactions/hooks";
import { type ReportPeriod, buildReport } from "./report";

/** Report for a month or year, computed from all local data. */
export function useReport(period: ReportPeriod) {
  const transactions = useAllTransactions();
  const categories = useAllCategories();
  const accounts = useAccounts();
  const data = useMemo(
    () =>
      transactions.data && categories.data && accounts.data
        ? buildReport({
            period,
            transactions: transactions.data,
            categories: categories.data,
            accounts: accounts.data.all,
          })
        : undefined,
    [period, transactions.data, categories.data, accounts.data],
  );
  return {
    data,
    hasTransactions: transactions.data ? transactions.data.length > 0 : undefined,
    ...combineQueries([transactions, categories, accounts]),
  };
}
