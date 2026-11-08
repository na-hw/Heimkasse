"use client";

import { ArrowDownLeft, ArrowUpRight, PiggyBank, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Amount, StatCard } from "@/components/ui";
import { useFormat } from "@/lib/i18n/useFormat";
import type { DashboardData } from "../dashboard";
import styles from "./OverviewScreen.module.css";

/** Balance, income, expenses and savings rate of the current budget month. */
export function DashboardKpis({ data }: { data: DashboardData | undefined }) {
  const { t } = useTranslation();
  const format = useFormat();
  const loading = !data;
  const context = t("dashboard.vsPrevious");

  return (
    <div className={styles.kpis}>
      <StatCard
        label={t("dashboard.balance")}
        icon={<Wallet />}
        loading={loading}
        value={data ? <Amount cents={data.balance} variant="neutral" size="lg" /> : null}
      />
      <StatCard
        label={t("dashboard.income")}
        icon={<ArrowDownLeft />}
        loading={loading}
        value={data ? <Amount cents={data.current.income} variant="neutral" size="lg" /> : null}
        trend={
          data?.change.income != null
            ? { ratio: data.change.income, goodWhen: "up", context }
            : undefined
        }
        hint={
          data
            ? t("dashboard.previousValue", { amount: format.money(data.previous.income) })
            : undefined
        }
      />
      <StatCard
        label={t("dashboard.expense")}
        icon={<ArrowUpRight />}
        loading={loading}
        value={data ? <Amount cents={data.current.expense} variant="neutral" size="lg" /> : null}
        trend={
          data?.change.expense != null
            ? { ratio: data.change.expense, goodWhen: "down", context }
            : undefined
        }
        hint={
          data
            ? t("dashboard.previousValue", { amount: format.money(data.previous.expense) })
            : undefined
        }
      />
      <StatCard
        label={t("dashboard.savingsRate")}
        icon={<PiggyBank />}
        loading={loading}
        value={
          data ? (
            data.current.savingsRate === null ? (
              <span className={styles.muted}>{t("dashboard.noIncome")}</span>
            ) : (
              format.percent(data.current.savingsRate, { maximumFractionDigits: 0 })
            )
          ) : null
        }
        hint={data ? t("dashboard.net", { amount: format.money(data.current.net) }) : undefined}
      />
    </div>
  );
}
