"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useRepositories } from "@/components/providers/RepositoriesContext";
import { announce, toast } from "@/components/ui";
import { useAllCategories } from "@/features/categories/hooks";
import { queryKeys } from "@/features/queryKeys";
import { combineQueries } from "@/features/shared/combineQueries";
import { useDataMutation } from "@/features/shared/useDataMutation";
import { useAllTransactions } from "@/features/transactions/hooks";
import { usePreferences } from "@/lib/preferences/store";
import { todayIso } from "@/lib/utils/dates";
import { type DateRange, budgetPeriod } from "@/lib/utils/period";
import type { BudgetCreate, BudgetUpdate } from "./schemas";
import { budgetStatuses } from "./status";

/** The current budget month according to the "budget month start day" preference. */
export function useCurrentBudgetPeriod(): DateRange {
  const startDay = usePreferences((s) => s.budgetMonthStartDay);
  const today = todayIso();
  return useMemo(() => budgetPeriod(today, startDay), [today, startDay]);
}

export function useBudgets() {
  const repos = useRepositories();
  return useQuery({ queryKey: queryKeys.budgets, queryFn: () => repos.budgets.list() });
}

/** Budget statuses (spent, remaining, level) for one period, most critical first. */
export function useBudgetStatuses(period: DateRange) {
  const budgets = useBudgets();
  const transactions = useAllTransactions();
  const categories = useAllCategories();
  const data = useMemo(
    () =>
      budgets.data && transactions.data && categories.data
        ? budgetStatuses(budgets.data, transactions.data, categories.data, period)
        : undefined,
    [budgets.data, transactions.data, categories.data, period],
  );
  return { data, ...combineQueries([budgets, transactions, categories]) };
}

export function useBudgetMutations() {
  const { t } = useTranslation();

  const create = useDataMutation({
    mutationFn: (repos, input: BudgetCreate) => repos.budgets.create(input),
    onSuccess: () => toast.success(t("budgets.created")),
  });

  const update = useDataMutation({
    mutationFn: (repos, { id, patch }: { id: string; patch: BudgetUpdate }) =>
      repos.budgets.update(id, patch),
    onSuccess: () => toast.success(t("budgets.saved")),
  });

  const restore = useDataMutation({
    mutationFn: (repos, id: string) => repos.budgets.restore([id]),
    onSuccess: () => announce(t("transactions.restored")),
  });

  const remove = useDataMutation({
    mutationFn: (repos, id: string) => repos.budgets.softDelete([id]),
    onSuccess: (_r, id) =>
      toast.show({
        title: t("budgets.deleted"),
        tone: "success",
        action: {
          label: t("common.undo"),
          altText: t("common.undo"),
          onAction: () => restore.mutate(id),
        },
      }),
  });

  return { create, update, remove };
}
