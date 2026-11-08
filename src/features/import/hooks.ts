"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useRepositories } from "@/components/providers/RepositoriesContext";
import { announce, toast } from "@/components/ui";
import { queryKeys } from "@/features/queryKeys";
import { useDataMutation } from "@/features/shared/useDataMutation";
import type { BankPreset } from "./format";
import { BUILTIN_PRESETS } from "./presets";
import type { ImportCandidate } from "./review";
import type { ImportRule, ImportRuleCreate, ImportRuleUpdate } from "./schemas";
import {
  deleteUserPreset,
  importCandidates,
  loadDuplicateContext,
  loadUserPresets,
  moveImportRule,
  saveUserPreset,
} from "./service";

/** Import rules in the order they are applied. */
export function useImportRules() {
  const repos = useRepositories();
  return useQuery({
    queryKey: queryKeys.importRules,
    queryFn: () => repos.importRules.list({ orderBy: [{ field: "sort_order" }] }),
  });
}

/** User presets first (they win detection ties), then the built-in bank presets. */
export function useBankPresets() {
  const repos = useRepositories();
  const query = useQuery({
    queryKey: queryKeys.importPresets,
    queryFn: () => loadUserPresets(repos),
  });
  const user = query.data ?? [];
  return { ...query, user, all: [...user, ...BUILTIN_PRESETS] };
}

/** Loads the duplicate context lazily for the review step. */
export function useDuplicateLoader() {
  const repos = useRepositories();
  return (accountId: string) => loadDuplicateContext(repos, accountId);
}

export function useImportMutations() {
  const { t } = useTranslation();
  const run = useDataMutation({
    mutationFn: (
      repos,
      { accountId, candidates }: { accountId: string; candidates: ImportCandidate[] },
    ) => importCandidates(repos, accountId, candidates),
    onSuccess: () => announce(t("import.doneTitle")),
  });
  const savePreset = useDataMutation({
    mutationFn: (repos, preset: BankPreset) => saveUserPreset(repos, preset),
    onSuccess: () => toast.success(t("import.presets.saved")),
  });
  const deletePreset = useDataMutation({
    mutationFn: (repos, id: string) => deleteUserPreset(repos, id),
    onSuccess: () => toast.success(t("import.presets.deleted")),
  });
  return { run, savePreset, deletePreset };
}

export function useImportRuleMutations() {
  const { t } = useTranslation();
  const create = useDataMutation({
    mutationFn: (repos, input: ImportRuleCreate) => repos.importRules.create(input),
    onSuccess: () => toast.success(t("import.rules.created")),
  });
  const update = useDataMutation({
    mutationFn: (repos, { id, patch }: { id: string; patch: ImportRuleUpdate }) =>
      repos.importRules.update(id, patch),
    onSuccess: () => toast.success(t("import.rules.saved")),
  });
  const move = useDataMutation({
    mutationFn: (
      repos,
      { rules, id, direction }: { rules: ImportRule[]; id: string; direction: "up" | "down" },
    ) => moveImportRule(repos, rules, id, direction),
    onSuccess: (moved) => moved && announce(t("common.moved")),
  });
  const restore = useDataMutation({
    mutationFn: (repos, id: string) => repos.importRules.restore([id]),
    onSuccess: () => announce(t("transactions.restored")),
  });
  const remove = useDataMutation({
    mutationFn: (repos, id: string) => repos.importRules.softDelete([id]),
    onSuccess: (_r, id) =>
      toast.show({
        title: t("import.rules.deleted"),
        tone: "success",
        action: {
          label: t("common.undo"),
          altText: t("common.undo"),
          onAction: () => restore.mutate(id),
        },
      }),
  });
  return { create, update, move, remove };
}
