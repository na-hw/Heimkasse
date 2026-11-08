"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useRepositories } from "@/components/providers/RepositoriesContext";
import { announce, toast } from "@/components/ui";
import { queryKeys } from "@/features/queryKeys";
import { useDataMutation } from "@/features/shared/useDataMutation";
import { computeBalances } from "./balances";
import type { Account, AccountCreate, AccountUpdate } from "./schemas";
import { accountUsage, moveAccount } from "./service";

/** All non-deleted accounts in display order, split into active and archived. */
export function useAccounts() {
  const repos = useRepositories();
  return useQuery({
    queryKey: queryKeys.accounts,
    queryFn: async () => {
      const all = await repos.accounts.list({
        orderBy: [{ field: "sort_order" }, { field: "name" }],
      });
      return {
        all,
        active: all.filter((a) => !a.archived),
        archived: all.filter((a) => a.archived),
      };
    },
  });
}

/** Current balance per account id. */
export function useAccountBalances() {
  const repos = useRepositories();
  return useQuery({
    queryKey: queryKeys.balances,
    queryFn: async () => {
      const [accounts, transactions] = await Promise.all([
        repos.accounts.list(),
        repos.transactions.list(),
      ]);
      return computeBalances(accounts, transactions);
    },
  });
}

/** Returns how many transactions/rules use an account (for archive-instead-of-delete). */
export function useAccountUsageCheck() {
  const repos = useRepositories();
  return (id: string) => accountUsage(repos, id);
}

export function useAccountMutations() {
  const { t } = useTranslation();

  const create = useDataMutation({
    mutationFn: (repos, input: AccountCreate) => repos.accounts.create(input),
    onSuccess: () => toast.success(t("accounts.created")),
  });

  const update = useDataMutation({
    mutationFn: (repos, { id, patch }: { id: string; patch: AccountUpdate }) =>
      repos.accounts.update(id, patch),
    optimistic: ({ id, patch }, cache) =>
      cache.updateLists<Account>(queryKeys.accounts, (list) =>
        list.map((a) => (a.id === id ? ({ ...a, ...patch } as Account) : a)),
      ),
    onSuccess: () => toast.success(t("accounts.saved")),
  });

  const setArchived = useDataMutation({
    mutationFn: (repos, { id, archived }: { id: string; archived: boolean }) =>
      repos.accounts.update(id, { archived }),
    onSuccess: (_r, { archived }) =>
      toast.success(t(archived ? "accounts.archived" : "accounts.unarchived")),
  });

  const restore = useDataMutation({
    mutationFn: (repos, id: string) => repos.accounts.restore([id]),
    onSuccess: () => announce(t("transactions.restored")),
  });

  const remove = useDataMutation({
    mutationFn: (repos, id: string) => repos.accounts.softDelete([id]),
    onSuccess: (_r, id) =>
      toast.show({
        title: t("accounts.deleted"),
        tone: "success",
        action: {
          label: t("common.undo"),
          altText: t("common.undo"),
          onAction: () => restore.mutate(id),
        },
      }),
  });

  const move = useDataMutation({
    mutationFn: (
      repos,
      { siblings, id, direction }: { siblings: Account[]; id: string; direction: "up" | "down" },
    ) => moveAccount(repos, siblings, id, direction),
    onSuccess: () => announce(t("common.moved")),
  });

  return { create, update, setArchived, remove, restore, move };
}
