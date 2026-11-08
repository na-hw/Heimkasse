"use client";

import {
  CircleAlert,
  CircleCheck,
  MoreHorizontal,
  Pencil,
  Plus,
  Receipt,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Badge,
  Button,
  Card,
  DropdownMenu,
  EmptyState,
  ErrorState,
  IconButton,
} from "@/components/ui";
import { useAllCategories } from "@/features/categories/hooks";
import { ListSkeleton } from "@/features/shared/components/ListSkeleton";
import list from "@/features/shared/components/EntityList.module.css";
import { useAllTransactions } from "@/features/transactions/hooks";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import { useFormat } from "@/lib/i18n/useFormat";
import { useSettlementMutations, useSettlements } from "../hooks";
import type { UtilitySettlement } from "../schemas";
import { bookedUtilities, prepaidTotal, suggestedPrepayment } from "../settlement";
import { SettlementFormDialog } from "./SettlementFormDialog";
import styles from "./SettlementsPanel.module.css";

/** Yearly Nebenkosten settlements: prepayments vs. actual costs. */
export function SettlementsPanel() {
  const { t } = useTranslation();
  const format = useFormat();
  const errorMessage = useErrorMessage();
  const settlements = useSettlements();
  const transactions = useAllTransactions();
  const categories = useAllCategories();
  const { remove } = useSettlementMutations();
  const [target, setTarget] = useState<{ settlement: UtilitySettlement | null } | null>(null);
  const usedYears = useMemo(
    () => new Set((settlements.data ?? []).map((s) => s.year)),
    [settlements.data],
  );
  const year = (y: number) => format.date(`${y}-01-01`, "year");

  const addButton = (
    <Button variant="primary" iconStart={<Plus />} onClick={() => setTarget({ settlement: null })}>
      {t("settlements.add")}
    </Button>
  );
  const dialog = (
    <SettlementFormDialog target={target} onClose={() => setTarget(null)} usedYears={usedYears} />
  );

  if (settlements.isError)
    return (
      <ErrorState
        description={errorMessage(settlements.error)}
        onRetry={() => void settlements.refetch()}
      />
    );
  if (!settlements.data)
    return (
      <Card padding="none">
        <ListSkeleton />
      </Card>
    );
  if (settlements.data.length === 0)
    return (
      <>
        <Card>
          <EmptyState
            icon={<Receipt />}
            title={t("settlements.empty.title")}
            description={t("settlements.empty.text")}
            action={addButton}
          />
        </Card>
        {dialog}
      </>
    );

  return (
    <div className={styles.layout}>
      <div className={styles.toolbar}>{addButton}</div>
      <Card padding="none">
        <ul role="list" className={list.list}>
          {settlements.data.map((s) => {
            const booked =
              transactions.data && categories.data
                ? bookedUtilities(transactions.data, categories.data, s.year)
                : 0;
            return (
              <li key={s.id} className={styles.row}>
                <div className={list.main}>
                  <span className={list.title}>
                    {year(s.year)}
                    {s.result_cents > 0 ? (
                      <Badge tone="success" icon={<CircleCheck />}>
                        {t("settlements.refund")} {format.money(s.result_cents)}
                      </Badge>
                    ) : s.result_cents < 0 ? (
                      <Badge tone="danger" icon={<CircleAlert />}>
                        {t("settlements.backPayment")} {format.money(-s.result_cents)}
                      </Badge>
                    ) : (
                      <Badge>{t("settlements.balanced")}</Badge>
                    )}
                  </span>
                  <dl className={styles.figures}>
                    <div>
                      <dt>{t("settlements.columns.prepaid")}</dt>
                      <dd>{format.money(prepaidTotal(s.monthly_prepayment_cents))}</dd>
                    </div>
                    <div>
                      <dt>{t("settlements.columns.actual")}</dt>
                      <dd>{format.money(s.actual_cost_cents)}</dd>
                    </div>
                  </dl>
                  <span className={list.meta}>
                    {t("settlements.suggestion", {
                      amount: format.money(suggestedPrepayment(s.actual_cost_cents)),
                    })}
                  </span>
                  {booked > 0 && (
                    <span className={list.meta}>
                      {t("settlements.booked", { amount: format.money(booked) })}
                    </span>
                  )}
                  {s.notes && <span className={list.meta}>{s.notes}</span>}
                </div>
                <DropdownMenu
                  trigger={
                    <IconButton
                      label={t("common.actionsFor", { name: year(s.year) })}
                      icon={<MoreHorizontal />}
                    />
                  }
                  items={[
                    {
                      id: "edit",
                      label: t("common.edit"),
                      icon: <Pencil />,
                      onSelect: () => setTarget({ settlement: s }),
                    },
                    {
                      id: "delete",
                      label: t("common.delete"),
                      icon: <Trash2 />,
                      tone: "danger",
                      onSelect: () => remove.mutate(s.id),
                    },
                  ]}
                />
              </li>
            );
          })}
        </ul>
      </Card>
      {dialog}
    </div>
  );
}
