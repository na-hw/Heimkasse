"use client";

import { MoreHorizontal, Pencil, PiggyBank, Plus, Trash2, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Amount,
  Button,
  Card,
  CategoryIcon,
  DropdownMenu,
  EmptyState,
  ErrorState,
  IconButton,
  PageHeader,
  StatCard,
} from "@/components/ui";
import { categoryDisplayName } from "@/features/categories/displayName";
import { useAllCategories } from "@/features/categories/hooks";
import { ListSkeleton } from "@/features/shared/components/ListSkeleton";
import { PeriodNavigator } from "@/features/shared/components/PeriodNavigator";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import { useFormat } from "@/lib/i18n/useFormat";
import { usePreferences } from "@/lib/preferences/store";
import { useDocumentTitle } from "@/lib/utils/useDocumentTitle";
import { shiftBudgetPeriod } from "@/lib/utils/period";
import { useBudgetMutations, useBudgetStatuses, useCurrentBudgetPeriod } from "../hooks";
import type { Budget } from "../schemas";
import { summarizeBudgets } from "../status";
import { BudgetFormDialog } from "./BudgetFormDialog";
import { BudgetProgress } from "./BudgetProgress";
import styles from "./BudgetsScreen.module.css";

/** Monthly budgets per category with progress for the current (or a past) budget period. */
export function BudgetsScreen() {
  const { t } = useTranslation();
  const format = useFormat();
  const errorMessage = useErrorMessage();
  useDocumentTitle(t("budgets.title"));
  const startDay = usePreferences((s) => s.budgetMonthStartDay);
  const current = useCurrentBudgetPeriod();
  const [offset, setOffset] = useState(0);
  const period = useMemo(
    () => shiftBudgetPeriod(current, offset, startDay),
    [current, offset, startDay],
  );
  const statuses = useBudgetStatuses(period);
  const categories = useAllCategories();
  const { remove } = useBudgetMutations();
  const [target, setTarget] = useState<{ budget: Budget | null } | null>(null);

  const categoryById = useMemo(
    () => new Map((categories.data ?? []).map((c) => [c.id, c])),
    [categories.data],
  );
  const usedCategoryIds = useMemo(
    () => new Set((statuses.data ?? []).map((s) => s.budget.category_id)),
    [statuses.data],
  );

  const addButton = (
    <Button variant="primary" iconStart={<Plus />} onClick={() => setTarget({ budget: null })}>
      {t("budgets.add")}
    </Button>
  );
  const summary = statuses.data ? summarizeBudgets(statuses.data) : null;

  return (
    <>
      <PageHeader
        title={t("budgets.title")}
        description={t("budgets.description")}
        actions={addButton}
      />
      {statuses.isError ? (
        <ErrorState
          description={errorMessage(statuses.error)}
          onRetry={() => void statuses.refetch()}
        />
      ) : !statuses.data ? (
        <Card padding="none">
          <ListSkeleton />
        </Card>
      ) : statuses.data.length === 0 ? (
        <Card>
          <EmptyState
            icon={<PiggyBank />}
            title={t("budgets.empty.title")}
            description={t("budgets.empty.text")}
            action={addButton}
          />
        </Card>
      ) : (
        <div className={styles.layout}>
          <PeriodNavigator
            label={t("budgets.period", {
              start: format.date(period.start, "medium"),
              end: format.date(period.end, "medium"),
            })}
            previousLabel={t("budgets.previousPeriod")}
            nextLabel={t("budgets.nextPeriod")}
            currentLabel={t("budgets.currentPeriod")}
            isCurrent={offset === 0}
            onPrevious={() => setOffset((o) => o - 1)}
            onNext={() => setOffset((o) => o + 1)}
            onCurrent={() => setOffset(0)}
          />
          {summary && (
            <div className={styles.summary}>
              <StatCard
                label={t("budgets.summary.budgeted")}
                icon={<PiggyBank />}
                value={<Amount cents={summary.budgeted} variant="neutral" size="lg" />}
              />
              <StatCard
                label={t("budgets.summary.spent")}
                icon={<Wallet />}
                value={<Amount cents={summary.spent} variant="neutral" size="lg" />}
              />
              <StatCard
                label={t("budgets.summary.remaining")}
                value={<Amount cents={summary.remaining} variant="signed" size="lg" />}
              />
            </div>
          )}
          <Card padding="none">
            <h2 className="visually-hidden">{t("budgets.title")}</h2>
            <ul role="list" className={styles.list}>
              {statuses.data.map((status) => {
                const category = categoryById.get(status.budget.category_id);
                const name = category ? categoryDisplayName(t, category) : "";
                return (
                  <li key={status.budget.id} className={styles.row}>
                    <CategoryIcon icon={category?.icon ?? "tag"} color={category?.color ?? "gray"} />
                    <div className={styles.main}>
                      <BudgetProgress status={status} name={name} />
                      <p className={styles.meta}>
                        <span>
                          {status.remaining >= 0
                            ? t("budgets.remaining", { amount: format.money(status.remaining) })
                            : t("budgets.over", { amount: format.money(-status.remaining) })}
                        </span>
                        <span>
                          {t("budgets.thresholdInfo", {
                            percent: format.percent(status.budget.alert_threshold_percent / 100),
                          })}
                        </span>
                      </p>
                    </div>
                    <DropdownMenu
                      trigger={
                        <IconButton
                          label={t("common.actionsFor", { name })}
                          icon={<MoreHorizontal />}
                        />
                      }
                      items={[
                        {
                          id: "edit",
                          label: t("common.edit"),
                          icon: <Pencil />,
                          onSelect: () => setTarget({ budget: status.budget }),
                        },
                        { type: "separator", id: "sep" },
                        {
                          id: "delete",
                          label: t("common.delete"),
                          icon: <Trash2 />,
                          tone: "danger",
                          onSelect: () => remove.mutate(status.budget.id),
                        },
                      ]}
                    />
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      )}
      <BudgetFormDialog
        target={target}
        onClose={() => setTarget(null)}
        usedCategoryIds={usedCategoryIds}
      />
    </>
  );
}

