"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button, Card, CategoryIcon, ErrorState, Skeleton } from "@/components/ui";
import { useCategoryLookup } from "@/features/categories/hooks";
import { ContractDeadline } from "@/features/contracts/components/ContractDeadline";
import { useContracts } from "@/features/contracts/hooks";
import list from "@/features/shared/components/EntityList.module.css";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import styles from "./OverviewScreen.module.css";

const WINDOW_DAYS = 60;

/** Contracts whose cancellation deadline is within the next 60 days. */
export function ContractDeadlinesCard() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const contracts = useContracts();
  const categories = useCategoryLookup();
  const upcoming = (contracts.data?.active ?? []).filter(
    (v) => v.info && v.info.kind !== "open" && v.info.daysLeft <= WINDOW_DAYS,
  );

  return (
    <Card
      title={t("contracts.dashboard.title")}
      description={t("contracts.dashboard.description")}
      padding="none"
      actions={
        <Button asChild variant="ghost" size="sm">
          <Link href="/contracts/">{t("contracts.dashboard.all")}</Link>
        </Button>
      }
    >
      {contracts.isError ? (
        <div className={styles.cardBody}>
          <ErrorState
            description={errorMessage(contracts.error)}
            onRetry={() => void contracts.refetch()}
          />
        </div>
      ) : !contracts.data ? (
        <div className={styles.cardBody}>
          <Skeleton height="4rem" />
        </div>
      ) : upcoming.length === 0 ? (
        <p className={styles.cardBody}>{t("contracts.dashboard.empty")}</p>
      ) : (
        <ul role="list" className={list.list}>
          {upcoming.map((view) => {
            const category = categories.get(view.contract.category_id);
            return (
              <li key={view.contract.id} className={list.row}>
                <CategoryIcon
                  icon={category?.icon ?? "receipt"}
                  color={category?.color ?? "gray"}
                />
                <div className={list.main}>
                  <span className={list.title}>{view.contract.name}</span>
                  <span className={list.meta}>
                    <ContractDeadline view={view} />
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
