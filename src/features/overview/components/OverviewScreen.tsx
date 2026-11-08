"use client";

import { Landmark, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, EmptyState, ErrorState, PageHeader } from "@/components/ui";
import { AccountFormDialog } from "@/features/accounts/components/AccountFormDialog";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import { useFormat } from "@/lib/i18n/useFormat";
import { useDocumentTitle } from "@/lib/utils/useDocumentTitle";
import { greetingKey } from "../greeting";
import { useDashboard } from "../hooks";
import { BudgetStatusCard } from "./BudgetStatusCard";
import { DashboardKpis } from "./DashboardKpis";
import { TopCategoriesCard } from "./TopCategoriesCard";
import { UpcomingPaymentsCard } from "./UpcomingPaymentsCard";
import styles from "./OverviewScreen.module.css";

/** Dashboard: key figures of the budget month, budgets, upcoming payments, top categories. */
export function OverviewScreen() {
  const { t } = useTranslation();
  const format = useFormat();
  const errorMessage = useErrorMessage();
  const dashboard = useDashboard();
  const [accountFormOpen, setAccountFormOpen] = useState(false);
  useDocumentTitle(t("nav.home"));
  const { data, period } = dashboard;

  return (
    <>
      <PageHeader
        title={t(greetingKey(new Date()))}
        description={t("dashboard.period", {
          start: format.date(period.start, "medium"),
          end: format.date(period.end, "medium"),
        })}
      />
      {dashboard.isError ? (
        <ErrorState
          description={errorMessage(dashboard.error)}
          onRetry={() => void dashboard.refetch()}
        />
      ) : dashboard.hasAccounts === false ? (
        <Card>
          <EmptyState
            icon={<Landmark />}
            title={t("dashboard.welcome.title")}
            description={t("dashboard.welcome.text")}
            action={
              <Button
                variant="primary"
                iconStart={<Plus />}
                onClick={() => setAccountFormOpen(true)}
              >
                {t("dashboard.welcome.action")}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className={styles.layout}>
          <DashboardKpis data={data} />
          <div className={styles.columns}>
            <BudgetStatusCard />
            {data && <UpcomingPaymentsCard items={data.upcoming} />}
          </div>
          {data && <TopCategoriesCard items={data.topCategories} />}
        </div>
      )}
      <AccountFormDialog
        open={accountFormOpen}
        onOpenChange={setAccountFormOpen}
        nextSortOrder={0}
      />
    </>
  );
}
