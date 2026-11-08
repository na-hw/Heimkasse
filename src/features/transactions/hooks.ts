"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useRepositories } from "@/components/providers/RepositoriesContext";
import { announce, toast } from "@/components/ui";
import { useAccounts } from "@/features/accounts/hooks";
import { categoryDisplayName } from "@/features/categories/displayName";
import { useAllCategories } from "@/features/categories/hooks";
import { withDescendants } from "@/features/categories/tree";
import { queryKeys } from "@/features/queryKeys";
import { useDataMutation } from "@/features/shared/useDataMutation";
import { useUiStore } from "@/lib/preferences/uiStore";
import {
  type TransactionFilters,
  type TransactionSort,
  collectPayees,
  collectTags,
  matchesClientFilters,
  sortTransactions,
  toStorageConditions,
} from "./filters";
import type { Transaction, TransactionCreate, TransactionUpdate } from "./schemas";
import { changeCategory } from "./service";

/** Filtered and sorted transactions. Storage filters hit the DB, text/tags/accounts are applied in memory. */
export function useTransactionList(filters: TransactionFilters, sort: TransactionSort) {
  const { t } = useTranslation();
  const repos = useRepositories();
  const categories = useAllCategories();
  const accounts = useAccounts();

  const expandedCategories = useMemo(
    () => [...new Set(filters.categoryIds.flatMap((id) => withDescendants(categories.data ?? [], id)))],
    [filters.categoryIds, categories.data],
  );
  const storageWhere = toStorageConditions({ ...filters, categoryIds: expandedCategories });

  const query = useQuery({
    queryKey: queryKeys.transactionList(storageWhere),
    queryFn: () => repos.transactions.list({ where: storageWhere }),
  });

  const data = useMemo(() => {
    if (!query.data) return undefined;
    const categoryById = new Map((categories.data ?? []).map((c) => [c.id, c]));
    const accountById = new Map((accounts.data?.all ?? []).map((a) => [a.id, a]));
    const ctx = {
      categoryName: (id: string | null) => {
        const c = id ? categoryById.get(id) : undefined;
        return c ? categoryDisplayName(t, c) : "";
      },
      accountName: (id: string | null) => (id ? (accountById.get(id)?.name ?? "") : ""),
    };
    return sortTransactions(
      query.data.filter((tx) => matchesClientFilters(tx, filters, ctx)),
      sort,
    );
  }, [query.data, filters, sort, categories.data, accounts.data, t]);

  return { ...query, data };
}

/** Known tags and payees for suggestions. */
export function useTransactionMeta() {
  const repos = useRepositories();
  return useQuery({
    queryKey: queryKeys.transactionMeta,
    queryFn: async () => {
      const all = await repos.transactions.list();
      return { tags: collectTags(all), payees: collectPayees(all).slice(0, 200) };
    },
  });
}

const removeIds = (ids: readonly string[]) => (list: Transaction[]) => list.filter((tx) => !ids.includes(tx.id));

export function useTransactionMutations() {
  const { t } = useTranslation();
  const setLastAccountId = useUiStore((s) => s.setLastAccountId);

  const create = useDataMutation({
    mutationFn: (repos, input: TransactionCreate) => repos.transactions.create(input),
    onSuccess: (tx) => {
      setLastAccountId(tx.account_id);
      toast.success(t("transactions.created"));
    },
  });

  const update = useDataMutation({
    mutationFn: (repos, { id, patch }: { id: string; patch: TransactionUpdate }) => repos.transactions.update(id, patch),
    optimistic: ({ id, patch }, cache) =>
      cache.updateLists<Transaction>(queryKeys.transactions, (list) =>
        list.map((tx) => (tx.id === id ? ({ ...tx, ...patch } as Transaction) : tx)),
      ),
    onSuccess: () => toast.success(t("transactions.saved")),
  });

  const restore = useDataMutation({
    mutationFn: (repos, ids: string[]) => repos.transactions.restore(ids),
    onSuccess: () => announce(t("transactions.restored")),
  });

  const remove = useDataMutation({
    mutationFn: (repos, ids: string[]) => repos.transactions.softDelete(ids),
    optimistic: (ids, cache) => cache.updateLists<Transaction>(queryKeys.transactions, removeIds(ids)),
    onSuccess: (_r, ids) =>
      toast.show({
        title: t("transactions.deleted", { count: ids.length }),
        tone: "success",
        action: { label: t("common.undo"), altText: t("common.undo"), onAction: () => restore.mutate(ids) },
      }),
  });

  const setCategory = useDataMutation({
    mutationFn: (repos, { ids, categoryId }: { ids: string[]; categoryId: string | null }) =>
      changeCategory(repos, ids, categoryId),
    optimistic: ({ ids, categoryId }, cache) =>
      cache.updateLists<Transaction>(queryKeys.transactions, (list) =>
        list.map((tx) => (ids.includes(tx.id) ? { ...tx, category_id: categoryId } : tx)),
      ),
    onSuccess: (_r, { ids }) => toast.success(t("transactions.changeCategory.done", { count: ids.length })),
  });

  return { create, update, remove, restore, setCategory };
}
