"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useRepositories } from "@/components/providers/RepositoriesContext";
import { announce, toast } from "@/components/ui";
import { generateDueTransactions } from "@/features/recurring/service";
import { queryKeys } from "@/features/queryKeys";
import { useDataMutation } from "@/features/shared/useDataMutation";
import { todayIso } from "@/lib/utils/dates";
import { type DeadlineInfo, nextDeadline } from "./deadlines";
import type { Contract, ContractCreate, ContractUpdate } from "./schemas";
import {
  type LinkedPayment,
  cancelContract,
  createContract,
  reactivateContract,
  updateContract,
} from "./service";

export interface ContractView {
  contract: Contract;
  /** Deadline info for active contracts; null for cancelled/ended ones. */
  info: DeadlineInfo | null;
}

/** Days until the deadline for sorting (open-ended contracts last). */
const sortKey = ({ info }: ContractView) =>
  info && info.kind !== "open" ? info.daysLeft : Number.MAX_SAFE_INTEGER;

/** All contracts with their next deadline, split into active and inactive. */
export function useContracts() {
  const repos = useRepositories();
  const today = todayIso();
  const query = useQuery({
    queryKey: queryKeys.contracts,
    queryFn: () => repos.contracts.list({ orderBy: [{ field: "name" }] }),
  });
  const data = useMemo(() => {
    if (!query.data) return undefined;
    const views: ContractView[] = query.data.map((contract) => ({
      contract,
      info: contract.status === "active" ? nextDeadline(contract, today) : null,
    }));
    return {
      all: views,
      active: views
        .filter((v) => v.contract.status === "active")
        .sort((a, b) => sortKey(a) - sortKey(b)),
      inactive: views.filter((v) => v.contract.status !== "active"),
    };
  }, [query.data, today]);
  return { ...query, data };
}

export function useContractMutations() {
  const { t } = useTranslation();

  const create = useDataMutation({
    mutationFn: async (
      repos,
      { input, payment }: { input: ContractCreate; payment: LinkedPayment | null },
    ) => {
      const contract = await createContract(repos, input, payment);
      // A first payment today (or earlier) is booked right away, like any recurring rule.
      if (payment) await generateDueTransactions(repos, todayIso());
      return contract;
    },
    onSuccess: () => toast.success(t("contracts.created")),
  });

  const update = useDataMutation({
    mutationFn: (repos, { contract, patch }: { contract: Contract; patch: ContractUpdate }) =>
      updateContract(repos, contract, patch, todayIso()),
    onSuccess: () => toast.success(t("contracts.saved")),
  });

  const cancel = useDataMutation({
    mutationFn: (repos, { contract, endDate }: { contract: Contract; endDate: string }) =>
      cancelContract(repos, contract, endDate),
    onSuccess: () => toast.success(t("contracts.cancelled")),
  });

  const reactivate = useDataMutation({
    mutationFn: (repos, contract: Contract) => reactivateContract(repos, contract),
    onSuccess: () => toast.success(t("contracts.reactivated")),
  });

  const restore = useDataMutation({
    mutationFn: (repos, id: string) => repos.contracts.restore([id]),
    onSuccess: () => announce(t("transactions.restored")),
  });

  const remove = useDataMutation({
    mutationFn: (repos, id: string) => repos.contracts.softDelete([id]),
    onSuccess: (_r, id) =>
      toast.show({
        title: t("contracts.deleted"),
        tone: "success",
        action: {
          label: t("common.undo"),
          altText: t("common.undo"),
          onAction: () => restore.mutate(id),
        },
      }),
  });

  return { create, update, cancel, reactivate, remove };
}
