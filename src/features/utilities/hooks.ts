"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useRepositories } from "@/components/providers/RepositoriesContext";
import { announce, toast } from "@/components/ui";
import { queryKeys } from "@/features/queryKeys";
import { useDataMutation } from "@/features/shared/useDataMutation";
import type { UtilitySettlementCreate, UtilitySettlementUpdate } from "./schemas";

/** Settlements, newest year first. */
export function useSettlements() {
  const repos = useRepositories();
  return useQuery({
    queryKey: queryKeys.settlements,
    queryFn: () =>
      repos.utilitySettlements.list({ orderBy: [{ field: "year", direction: "desc" }] }),
  });
}

export function useSettlementMutations() {
  const { t } = useTranslation();
  const create = useDataMutation({
    mutationFn: (repos, input: UtilitySettlementCreate) => repos.utilitySettlements.create(input),
    onSuccess: () => toast.success(t("settlements.created")),
  });
  const update = useDataMutation({
    mutationFn: (repos, { id, patch }: { id: string; patch: UtilitySettlementUpdate }) =>
      repos.utilitySettlements.update(id, patch),
    onSuccess: () => toast.success(t("settlements.saved")),
  });
  const restore = useDataMutation({
    mutationFn: (repos, id: string) => repos.utilitySettlements.restore([id]),
    onSuccess: () => announce(t("transactions.restored")),
  });
  const remove = useDataMutation({
    mutationFn: (repos, id: string) => repos.utilitySettlements.softDelete([id]),
    onSuccess: (_r, id) =>
      toast.show({
        title: t("settlements.deleted"),
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
