"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useRepositories } from "@/components/providers/RepositoriesContext";
import { announce, toast } from "@/components/ui";
import { queryKeys } from "@/features/queryKeys";
import { useDataMutation } from "@/features/shared/useDataMutation";
import { todayIso } from "@/lib/utils/dates";
import type { RecurringRule, RecurringRuleCreate, RecurringRuleUpdate } from "./schemas";
import {
  bookNext,
  createRule,
  generateDueTransactions,
  resumeRule,
  skipNext,
  updateRule,
} from "./service";

export function useRecurringRules() {
  const repos = useRepositories();
  return useQuery({
    queryKey: queryKeys.recurring,
    queryFn: () => repos.recurringRules.list({ orderBy: [{ field: "next_run_date" }] }),
  });
}

export function useRecurringMutations() {
  const { t } = useTranslation();

  const create = useDataMutation({
    mutationFn: (repos, input: Omit<RecurringRuleCreate, "next_run_date">) =>
      createRule(repos, input),
    onSuccess: () => toast.success(t("recurring.created")),
  });

  const update = useDataMutation({
    mutationFn: (repos, { rule, patch }: { rule: RecurringRule; patch: RecurringRuleUpdate }) =>
      updateRule(repos, rule, patch, todayIso()),
    onSuccess: () => toast.success(t("recurring.saved")),
  });

  const setPaused = useDataMutation({
    mutationFn: (repos, { id, paused }: { id: string; paused: boolean }) =>
      repos.recurringRules.update(id, { paused }),
    onSuccess: (_r, { paused }) =>
      toast.success(t(paused ? "recurring.paused" : "recurring.resumed")),
  });

  const skip = useDataMutation({
    mutationFn: (repos, rule: RecurringRule) => skipNext(repos, rule),
    onSuccess: () => toast.success(t("recurring.skipped")),
  });

  const book = useDataMutation({
    mutationFn: (repos, rule: RecurringRule) => bookNext(repos, rule),
    onSuccess: () => toast.success(t("recurring.upcoming.booked")),
  });

  const restore = useDataMutation({
    mutationFn: (repos, id: string) => repos.recurringRules.restore([id]),
    onSuccess: () => announce(t("transactions.restored")),
  });

  const remove = useDataMutation({
    mutationFn: (repos, id: string) => repos.recurringRules.softDelete([id]),
    onSuccess: (_r, id) =>
      toast.show({
        title: t("recurring.deleted"),
        tone: "success",
        action: {
          label: t("common.undo"),
          altText: t("common.undo"),
          onAction: () => restore.mutate(id),
        },
      }),
  });

  return { create, update, setPaused, skip, book, remove };
}

/** Books due recurring transactions; used once on app start. */
export function useGenerateDue() {
  const { t } = useTranslation();
  return useDataMutation({
    mutationFn: (repos, today: string) => generateDueTransactions(repos, today),
    onSuccess: (count) => {
      if (count > 0) toast.success(t("recurring.generated", { count }));
    },
  });
}
