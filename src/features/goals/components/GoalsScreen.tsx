"use client";

import { Plus, Target } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, EmptyState, ErrorState, PageHeader, Skeleton } from "@/components/ui";
import list from "@/features/shared/components/EntityList.module.css";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import { useDocumentTitle } from "@/lib/utils/useDocumentTitle";
import { type GoalView, useGoals } from "../hooks";
import type { SavingsGoal } from "../schemas";
import { ContributionDialog } from "./ContributionDialog";
import { GoalCard } from "./GoalCard";
import { GoalFormDialog } from "./GoalFormDialog";
import styles from "./GoalsScreen.module.css";

/** Savings goals with progress, projection and contributions. */
export function GoalsScreen() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  useDocumentTitle(t("goals.title"));
  const goals = useGoals();
  const [target, setTarget] = useState<{ goal: SavingsGoal | null } | null>(null);
  const [contribution, setContribution] = useState<{
    goal: SavingsGoal;
    kind: "deposit" | "withdrawal";
  } | null>(null);
  const data = goals.data;

  const addButton = (
    <Button variant="primary" iconStart={<Plus />} onClick={() => setTarget({ goal: null })}>
      {t("goals.add")}
    </Button>
  );
  const grid = (views: GoalView[]) => (
    <div className={styles.grid}>
      {views.map((view) => (
        <GoalCard
          key={view.goal.id}
          view={view}
          onEdit={(goal) => setTarget({ goal })}
          onContribute={(goal, kind) => setContribution({ goal, kind })}
        />
      ))}
    </div>
  );

  return (
    <>
      <PageHeader
        title={t("goals.title")}
        description={t("goals.description")}
        actions={addButton}
      />
      {goals.isError ? (
        <ErrorState description={errorMessage(goals.error)} onRetry={() => void goals.refetch()} />
      ) : !data ? (
        <div className={styles.grid}>
          <Skeleton height="14rem" />
          <Skeleton height="14rem" />
        </div>
      ) : data.all.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Target />}
            title={t("goals.empty.title")}
            description={t("goals.empty.text")}
            action={addButton}
          />
        </Card>
      ) : (
        <>
          <h2 className="visually-hidden">{t("goals.title")}</h2>
          {grid(data.active)}
          {data.archived.length > 0 && (
            <>
              <h2 className={list.sectionTitle}>{t("goals.archivedSection")}</h2>
              {grid(data.archived)}
            </>
          )}
        </>
      )}
      <GoalFormDialog target={target} onClose={() => setTarget(null)} />
      <ContributionDialog target={contribution} onClose={() => setContribution(null)} />
    </>
  );
}
