"use client";

import { CircleAlert, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge, ProgressBar } from "@/components/ui";
import { useFormat } from "@/lib/i18n/useFormat";
import type { BudgetStatus } from "../status";
import styles from "./BudgetsScreen.module.css";

interface BudgetProgressProps {
  status: BudgetStatus;
  /** Display name of the budget's category. */
  name: string;
}

/** Category name, level badge and a threshold-aware progress bar ("120 € of 300 €"). */
export function BudgetProgress({ status, name }: BudgetProgressProps) {
  const { t } = useTranslation();
  const format = useFormat();
  const { budget, spent, level } = status;
  return (
    <div className={styles.progress}>
      <ProgressBar
        value={spent}
        max={budget.amount_cents}
        warnAt={budget.alert_threshold_percent}
        label={
          <span className={styles.name}>
            {name}
            {level !== "ok" && (
              <Badge
                tone={level === "exceeded" ? "danger" : "warning"}
                icon={level === "exceeded" ? <CircleAlert /> : <TriangleAlert />}
              >
                {t(`budgets.level.${level}`)}
              </Badge>
            )}
          </span>
        }
        valueText={t("budgets.spentOf", {
          spent: format.money(spent),
          amount: format.money(budget.amount_cents),
        })}
      />
    </div>
  );
}
