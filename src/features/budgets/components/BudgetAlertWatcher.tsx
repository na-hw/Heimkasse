"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useRepositories } from "@/components/providers/RepositoriesContext";
import { toast } from "@/components/ui";
import { categoryDisplayName } from "@/features/categories/displayName";
import { useAllCategories } from "@/features/categories/hooks";
import { useFormat } from "@/lib/i18n/useFormat";
import { useBudgetStatuses, useCurrentBudgetPeriod } from "../hooks";
import { type BudgetStatus, pendingAlerts } from "../status";

const SETTINGS_KEY = "budget_alerts";
const notifiedSchema = z.record(z.string(), z.enum(["ok", "warning", "exceeded"]));

/**
 * Shows a toast when a budget reaches its alert threshold or 100 % in the
 * current period – once per budget, period and level (remembered in settings).
 */
export function BudgetAlertWatcher() {
  const { t } = useTranslation();
  const format = useFormat();
  const repos = useRepositories();
  const period = useCurrentBudgetPeriod();
  const statuses = useBudgetStatuses(period);
  const categories = useAllCategories();
  const running = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    const data = statuses.data;
    const allCategories = categories.data;
    if (!data || !allCategories) return;

    const nameOf = (status: BudgetStatus) => {
      const category = allCategories.find((c) => c.id === status.budget.category_id);
      return category ? categoryDisplayName(t, category) : "";
    };

    // Serialize checks so quick successive changes never alert twice.
    running.current = running.current
      .then(async () => {
        const notified = await repos.settings.getValue(SETTINGS_KEY, notifiedSchema, {});
        const { alerts, next } = pendingAlerts(data, notified, period);
        for (const { status, level } of alerts) {
          const name = nameOf(status);
          toast.show({
            tone: level === "exceeded" ? "error" : "info",
            title:
              level === "exceeded"
                ? t("budgets.alert.exceeded", { name })
                : t("budgets.alert.warning", {
                    name,
                    percent: format.percent(status.ratio, { maximumFractionDigits: 0 }),
                  }),
            description: t("budgets.alert.detail", {
              spent: format.money(status.spent),
              amount: format.money(status.budget.amount_cents),
            }),
          });
        }
        if (JSON.stringify(next) !== JSON.stringify(notified))
          await repos.settings.setValue(SETTINGS_KEY, next);
      })
      .catch(() => {
        // Alerts are best-effort; the budget screen always shows the current state.
      });
  }, [statuses.data, categories.data, period, repos, t, format]);

  return null;
}
