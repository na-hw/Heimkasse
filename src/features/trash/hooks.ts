"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useRepositories } from "@/components/providers/RepositoriesContext";
import { toast } from "@/components/ui";
import { purgeAccount } from "@/features/accounts/service";
import { purgeCategory } from "@/features/categories/service";
import { purgeGoals } from "@/features/goals/service";
import { purgeMeters } from "@/features/meters/service";
import { queryKeys } from "@/features/queryKeys";
import type { Repositories } from "@/features/repositories";
import { useDataMutation } from "@/features/shared/useDataMutation";

export const TRASH_KINDS = [
  "transactions",
  "accounts",
  "categories",
  "recurring",
  "budgets",
  "contracts",
  "meters",
  "settlements",
  "goals",
] as const;
export type TrashKind = (typeof TRASH_KINDS)[number];

const repoFor = (repos: Repositories, kind: TrashKind) =>
  ({
    transactions: repos.transactions,
    accounts: repos.accounts,
    categories: repos.categories,
    recurring: repos.recurringRules,
    budgets: repos.budgets,
    contracts: repos.contracts,
    meters: repos.meters,
    settlements: repos.utilitySettlements,
    goals: repos.savingsGoals,
  })[kind];

/** All soft-deleted entities, newest deletions first. */
export function useTrash() {
  const repos = useRepositories();
  return useQuery({
    queryKey: queryKeys.trash,
    queryFn: async () => {
      const opts = {
        deleted: "only" as const,
        orderBy: [{ field: "deleted_at", direction: "desc" as const }],
      };
      const [
        transactions,
        accounts,
        categories,
        recurring,
        budgets,
        contracts,
        meters,
        settlements,
        goals,
      ] = await Promise.all([
        repos.transactions.list(opts),
        repos.accounts.list(opts),
        repos.categories.list(opts),
        repos.recurringRules.list(opts),
        repos.budgets.list(opts),
        repos.contracts.list(opts),
        repos.meters.list(opts),
        repos.utilitySettlements.list(opts),
        repos.savingsGoals.list(opts),
      ]);
      return {
        transactions,
        accounts,
        categories,
        recurring,
        budgets,
        contracts,
        meters,
        settlements,
        goals,
      };
    },
  });
}

async function purge(repos: Repositories, kind: TrashKind, ids: readonly string[]) {
  if (kind === "accounts") for (const id of ids) await purgeAccount(repos, id);
  else if (kind === "categories") for (const id of ids) await purgeCategory(repos, id);
  else if (kind === "meters") await purgeMeters(repos, ids);
  else if (kind === "goals") await purgeGoals(repos, ids);
  else await repoFor(repos, kind).purge(ids);
}

export function useTrashMutations() {
  const { t } = useTranslation();
  const restore = useDataMutation({
    mutationFn: (repos, { kind, ids }: { kind: TrashKind; ids: string[] }) =>
      repoFor(repos, kind).restore(ids),
    onSuccess: () => toast.success(t("trash.restored")),
  });
  const remove = useDataMutation({
    mutationFn: (repos, { kind, ids }: { kind: TrashKind; ids: string[] }) =>
      purge(repos, kind, ids),
    onSuccess: () => toast.success(t("trash.purged")),
  });
  return { restore, remove };
}
