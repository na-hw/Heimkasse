"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useRepositories } from "@/components/providers/RepositoriesContext";
import { announce, toast } from "@/components/ui";
import { queryKeys } from "@/features/queryKeys";
import { useDataMutation } from "@/features/shared/useDataMutation";
import { todayIso } from "@/lib/utils/dates";
import { type GoalProgress, goalProgress } from "./projection";
import type {
  GoalContribution,
  GoalContributionCreate,
  SavingsGoal,
  SavingsGoalCreate,
  SavingsGoalUpdate,
} from "./schemas";

export interface GoalView {
  goal: SavingsGoal;
  /** Newest first. */
  contributions: GoalContribution[];
  progress: GoalProgress;
}

/** Savings goals with contributions and progress, split into active and archived. */
export function useGoals() {
  const repos = useRepositories();
  const today = todayIso();
  const query = useQuery({
    queryKey: queryKeys.goals,
    queryFn: async () => {
      const [goals, contributions] = await Promise.all([
        repos.savingsGoals.list({ orderBy: [{ field: "created_at" }] }),
        repos.goalContributions.list({ orderBy: [{ field: "date", direction: "desc" }] }),
      ]);
      return { goals, contributions };
    },
  });
  const data = useMemo(() => {
    if (!query.data) return undefined;
    const views: GoalView[] = query.data.goals.map((goal) => {
      const contributions = query.data.contributions.filter((c) => c.goal_id === goal.id);
      return { goal, contributions, progress: goalProgress(goal, contributions, today) };
    });
    return {
      all: views,
      active: views.filter((v) => !v.goal.archived),
      archived: views.filter((v) => v.goal.archived),
    };
  }, [query.data, today]);
  return { ...query, data };
}

export function useGoalMutations() {
  const { t } = useTranslation();
  const undoToast = (title: string, onAction: () => void) =>
    toast.show({
      title,
      tone: "success",
      action: { label: t("common.undo"), altText: t("common.undo"), onAction },
    });

  const create = useDataMutation({
    mutationFn: (repos, input: SavingsGoalCreate) => repos.savingsGoals.create(input),
    onSuccess: () => toast.success(t("goals.created")),
  });
  const update = useDataMutation({
    mutationFn: (repos, { id, patch }: { id: string; patch: SavingsGoalUpdate }) =>
      repos.savingsGoals.update(id, patch),
    onSuccess: () => toast.success(t("goals.savedToast")),
  });
  const setArchived = useDataMutation({
    mutationFn: (repos, { id, archived }: { id: string; archived: boolean }) =>
      repos.savingsGoals.update(id, { archived }),
    onSuccess: (_r, { archived }) =>
      toast.success(t(archived ? "goals.archived" : "goals.unarchived")),
  });
  const restore = useDataMutation({
    mutationFn: (repos, id: string) => repos.savingsGoals.restore([id]),
    onSuccess: () => announce(t("transactions.restored")),
  });
  const remove = useDataMutation({
    mutationFn: (repos, id: string) => repos.savingsGoals.softDelete([id]),
    onSuccess: (_r, id) => undoToast(t("goals.deleted"), () => restore.mutate(id)),
  });

  const addContribution = useDataMutation({
    mutationFn: (repos, input: GoalContributionCreate) => repos.goalContributions.create(input),
    onSuccess: () => toast.success(t("goals.contribution.created")),
  });
  const restoreContribution = useDataMutation({
    mutationFn: (repos, id: string) => repos.goalContributions.restore([id]),
    onSuccess: () => announce(t("transactions.restored")),
  });
  const removeContribution = useDataMutation({
    mutationFn: (repos, id: string) => repos.goalContributions.softDelete([id]),
    onSuccess: (_r, id) =>
      undoToast(t("goals.contribution.deleted"), () => restoreContribution.mutate(id)),
  });

  return { create, update, setArchived, remove, addContribution, removeContribution };
}
