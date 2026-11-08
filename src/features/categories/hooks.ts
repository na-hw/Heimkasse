"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useRepositories } from "@/components/providers/RepositoriesContext";
import { announce, toast } from "@/components/ui";
import { categoryDisplayName } from "./displayName";
import { queryKeys } from "@/features/queryKeys";
import { useDataMutation } from "@/features/shared/useDataMutation";
import type { Category, CategoryCreate, CategoryType, CategoryUpdate } from "./schemas";
import { categoryUsage, moveCategory, setCategoryArchived, softDeleteCategory } from "./service";
import { withDescendants } from "./tree";

/** All non-deleted categories (active and archived) in display order. */
export function useAllCategories() {
  const repos = useRepositories();
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => repos.categories.list({ orderBy: [{ field: "sort_order" }] }),
  });
}

/** Active categories (optionally of one type) in display order. */
export function useCategories(type?: CategoryType) {
  const query = useAllCategories();
  const data = query.data?.filter((c) => !c.archived && (!type || c.type === type));
  return { ...query, data } as typeof query;
}

/** Returns how many transactions/rules/budgets use a category incl. subcategories. */
export function useCategoryUsageCheck() {
  const repos = useRepositories();
  return (all: Category[], id: string) => categoryUsage(repos, all, id);
}

export function useCategoryMutations() {
  const { t } = useTranslation();

  const create = useDataMutation({
    mutationFn: (repos, input: CategoryCreate) => repos.categories.create(input),
    onSuccess: () => toast.success(t("categories.created")),
  });

  const update = useDataMutation({
    mutationFn: async (
      repos,
      { id, patch, all }: { id: string; patch: CategoryUpdate; all: Category[] },
    ) => {
      // Subcategories always share the type of their parent.
      const childOps = patch.type
        ? all
            .filter((c) => c.parent_id === id)
            .map((c) => repos.categories.prepareUpdate(c.id, { type: patch.type }))
        : [];
      await repos.storage.write([repos.categories.prepareUpdate(id, patch), ...childOps]);
    },
    optimistic: ({ id, patch }, cache) =>
      cache.updateLists<Category>(queryKeys.categories, (list) =>
        list.map((c) => (c.id === id ? ({ ...c, ...patch } as Category) : c)),
      ),
    onSuccess: () => toast.success(t("categories.saved")),
  });

  const setArchived = useDataMutation({
    mutationFn: (
      repos,
      { id, archived, all }: { id: string; archived: boolean; all: Category[] },
    ) => setCategoryArchived(repos, all, id, archived),
    onSuccess: (_r, { archived }) =>
      toast.success(t(archived ? "categories.archived" : "categories.unarchived")),
  });

  const restore = useDataMutation({
    mutationFn: (repos, ids: string[]) => repos.categories.restore(ids),
    onSuccess: () => announce(t("transactions.restored")),
  });

  const remove = useDataMutation({
    mutationFn: (repos, { id, all }: { id: string; all: Category[] }) =>
      softDeleteCategory(repos, all, id),
    optimistic: ({ id, all }, cache) => {
      const ids = new Set(withDescendants(all, id));
      return cache.updateLists<Category>(queryKeys.categories, (list) =>
        list.filter((c) => !ids.has(c.id)),
      );
    },
    onSuccess: (_r, { id, all }) =>
      toast.show({
        title: t("categories.deleted"),
        tone: "success",
        action: {
          label: t("common.undo"),
          altText: t("common.undo"),
          onAction: () => restore.mutate(withDescendants(all, id)),
        },
      }),
  });

  const move = useDataMutation({
    mutationFn: (
      repos,
      { siblings, id, direction }: { siblings: Category[]; id: string; direction: "up" | "down" },
    ) => moveCategory(repos, siblings, id, direction),
    onSuccess: () => announce(t("common.moved")),
  });

  return { create, update, setArchived, remove, restore, move };
}

/** Lookup for display name and appearance by category id (null/unknown = "uncategorized"). */
export function useCategoryLookup() {
  const { t } = useTranslation();
  const categories = useAllCategories();
  return useMemo(() => {
    const byId = new Map((categories.data ?? []).map((c) => [c.id, c]));
    return {
      get: (id: string | null) => (id ? byId.get(id) : undefined),
      name: (id: string | null) => {
        const category = id ? byId.get(id) : undefined;
        return category ? categoryDisplayName(t, category) : t("categories.uncategorized");
      },
    };
  }, [categories.data, t]);
}
