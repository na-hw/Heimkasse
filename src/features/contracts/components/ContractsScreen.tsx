"use client";

import {
  CalendarClock,
  CalendarX2,
  FileText,
  Link2,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Wallet,
} from "lucide-react";
import { useState } from "react";
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
  type MenuEntry,
  PageHeader,
  StatCard,
} from "@/components/ui";
import { useCategoryLookup } from "@/features/categories/hooks";
import { ListSkeleton } from "@/features/shared/components/ListSkeleton";
import styles from "@/features/shared/components/EntityList.module.css";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import { useFormat } from "@/lib/i18n/useFormat";
import { useDocumentTitle } from "@/lib/utils/useDocumentTitle";
import { monthlyCents } from "../deadlines";
import { type ContractView, useContractMutations, useContracts } from "../hooks";
import type { Contract } from "../schemas";
import { CancelContractDialog } from "./CancelContractDialog";
import { ContractDeadline } from "./ContractDeadline";
import { ContractFormDialog } from "./ContractFormDialog";
import screen from "./ContractsScreen.module.css";

/** Contracts with next cancellation deadline, monthly costs and cancel/reactivate. */
export function ContractsScreen() {
  const { t } = useTranslation();
  const format = useFormat();
  const errorMessage = useErrorMessage();
  useDocumentTitle(t("contracts.title"));
  const contracts = useContracts();
  const categories = useCategoryLookup();
  const mutations = useContractMutations();
  const [target, setTarget] = useState<{ contract: Contract | null } | null>(null);
  const [cancelling, setCancelling] = useState<ContractView | null>(null);
  const data = contracts.data;

  const addButton = (
    <Button variant="primary" iconStart={<Plus />} onClick={() => setTarget({ contract: null })}>
      {t("contracts.add")}
    </Button>
  );

  const menu = (view: ContractView): MenuEntry[] => [
    {
      id: "edit",
      label: t("common.edit"),
      icon: <Pencil />,
      onSelect: () => setTarget({ contract: view.contract }),
    },
    view.contract.status === "active"
      ? {
          id: "cancel",
          label: t("contracts.cancel"),
          icon: <CalendarX2 />,
          onSelect: () => setCancelling(view),
        }
      : {
          id: "reactivate",
          label: t("contracts.reactivate"),
          icon: <RotateCcw />,
          onSelect: () => mutations.reactivate.mutate(view.contract),
        },
    { type: "separator", id: "sep" },
    {
      id: "delete",
      label: t("common.delete"),
      icon: <Trash2 />,
      tone: "danger",
      onSelect: () => mutations.remove.mutate(view.contract.id),
    },
  ];

  const renderList = (views: ContractView[]) => (
    <ul role="list" className={styles.list}>
      {views.map((view) => {
        const { contract } = view;
        const category = categories.get(contract.category_id);
        return (
          <li key={contract.id} className={styles.row}>
            {category ? (
              <CategoryIcon icon={category.icon} color={category.color} />
            ) : (
              <CategoryIcon icon="receipt" color="gray" />
            )}
            <div className={styles.main}>
              <span className={styles.title}>
                {contract.name}
                {contract.recurring_rule_id && (
                  <Link2
                    size={16}
                    aria-label={t("contracts.linkedPayment")}
                    className={screen.linkIcon}
                  />
                )}
              </span>
              <span className={styles.meta}>
                {[contract.provider, category ? categories.name(category.id) : null]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              <span className={screen.deadline}>
                <ContractDeadline view={view} />
              </span>
            </div>
            <div className={styles.end}>
              <div className={screen.amount}>
                <Amount cents={-contract.amount_cents} />
                <span className={styles.meta}>
                  {t(`contracts.frequencies.${contract.billing_frequency}`)}
                </span>
              </div>
              <DropdownMenu
                trigger={
                  <IconButton
                    label={t("common.actionsFor", { name: contract.name })}
                    icon={<MoreHorizontal />}
                  />
                }
                items={menu(view)}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );

  const monthly = (data?.active ?? []).reduce(
    (sum, v) => sum + monthlyCents(v.contract.amount_cents, v.contract.billing_frequency),
    0,
  );
  const next = data?.active.find((v) => v.info && v.info.kind !== "open");

  return (
    <>
      <PageHeader
        title={t("contracts.title")}
        description={t("contracts.description")}
        actions={addButton}
      />
      {contracts.isError ? (
        <ErrorState
          description={errorMessage(contracts.error)}
          onRetry={() => void contracts.refetch()}
        />
      ) : !data ? (
        <Card padding="none">
          <ListSkeleton />
        </Card>
      ) : data.all.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText />}
            title={t("contracts.empty.title")}
            description={t("contracts.empty.text")}
            action={addButton}
          />
        </Card>
      ) : (
        <div className={screen.layout}>
          <div className={screen.summary}>
            <StatCard
              label={t("contracts.summary.monthly")}
              icon={<Wallet />}
              value={<Amount cents={monthly} variant="neutral" size="lg" />}
            />
            <StatCard
              label={t("contracts.summary.yearly")}
              value={<Amount cents={monthly * 12} variant="neutral" size="lg" />}
            />
            <StatCard
              label={t("contracts.summary.nextDeadline")}
              icon={<CalendarClock />}
              value={
                <span className={screen.small}>
                  {next?.info && next.info.kind !== "open"
                    ? format.date(next.info.deadline, "medium")
                    : t("contracts.summary.none")}
                </span>
              }
              hint={next?.contract.name}
            />
          </div>
          {data.active.length > 0 && (
            <section aria-labelledby="contracts-active">
              <h2 id="contracts-active" className={styles.sectionTitle}>
                {t("contracts.sections.active")}
              </h2>
              <Card padding="none">{renderList(data.active)}</Card>
            </section>
          )}
          {data.inactive.length > 0 && (
            <section aria-labelledby="contracts-inactive">
              <h2 id="contracts-inactive" className={styles.sectionTitle}>
                {t("contracts.sections.inactive")}
              </h2>
              <Card padding="none">{renderList(data.inactive)}</Card>
            </section>
          )}
        </div>
      )}
      <ContractFormDialog target={target} onClose={() => setTarget(null)} />
      <CancelContractDialog view={cancelling} onClose={() => setCancelling(null)} />
    </>
  );
}
