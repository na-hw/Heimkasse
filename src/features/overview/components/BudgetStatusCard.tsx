"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button, Card, ErrorState, Skeleton } from "@/components/ui";
import { BudgetProgress } from "@/features/budgets/components/BudgetProgress";
import { useBudgetStatuses, useCurrentBudgetPeriod } from "@/features/budgets/hooks";
import { useCategoryLookup } from "@/features/categories/hooks";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import styles from "./OverviewScreen.module.css";

const MAX_ITEMS = 5;

/** The most critical budgets of the current period. */
export function BudgetStatusCard() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const period = useCurrentBudgetPeriod();
  const statuses = useBudgetStatuses(period);
  const categories = useCategoryLookup();
  const data = statuses.data;

  return (
    <Card
      title={t("dashboard.budgets.title")}
      description={t("dashboard.budgets.description")}
      actions={
        data && data.length > 0 ? (
          <Button asChild variant="ghost" size="sm">
            <Link href="/budgets/">{t("dashboard.budgets.all")}</Link>
          </Button>
        ) : undefined
      }
    >
      {statuses.isError ? (
        <ErrorState
          description={errorMessage(statuses.error)}
          onRetry={() => void statuses.refetch()}
        />
      ) : !data ? (
        <Skeleton height="6rem" />
      ) : data.length === 0 ? (
        <div className={styles.emptyInline}>
          <p className={styles.muted}>{t("dashboard.budgets.empty")}</p>
          <Button asChild>
            <Link href="/budgets/">{t("dashboard.budgets.create")}</Link>
          </Button>
        </div>
      ) : (
        <ul role="list" className={styles.stack}>
          {data.slice(0, MAX_ITEMS).map((status) => (
            <li key={status.budget.id}>
              <BudgetProgress status={status} name={categories.name(status.budget.category_id)} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
