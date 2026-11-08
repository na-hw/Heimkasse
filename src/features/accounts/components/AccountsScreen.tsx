"use client";

import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  Landmark,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Amount,
  Badge,
  Button,
  Card,
  CategoryIcon,
  ConfirmDialog,
  DropdownMenu,
  EmptyState,
  ErrorState,
  IconButton,
  type MenuEntry,
  PageHeader,
  StatCard,
} from "@/components/ui";
import { ListSkeleton } from "@/features/shared/components/ListSkeleton";
import styles from "@/features/shared/components/EntityList.module.css";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import { useDocumentTitle } from "@/lib/utils/useDocumentTitle";
import { totalBalance } from "../balances";
import {
  useAccountBalances,
  useAccountMutations,
  useAccounts,
  useAccountUsageCheck,
} from "../hooks";
import type { Account } from "../schemas";
import { AccountFormDialog } from "./AccountFormDialog";

/** Accounts with balances; create, edit, reorder, archive and delete. */
export function AccountsScreen() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  useDocumentTitle(t("accounts.title"));
  const accounts = useAccounts();
  const balances = useAccountBalances();
  const mutations = useAccountMutations();
  const usageOf = useAccountUsageCheck();
  const [editing, setEditing] = useState<Account | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [archiveCandidate, setArchiveCandidate] = useState<{
    account: Account;
    usage: number;
  } | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const requestDelete = async (account: Account) => {
    const usage = await usageOf(account.id);
    if (usage > 0) setArchiveCandidate({ account, usage });
    else mutations.remove.mutate(account.id);
  };

  const menu = (account: Account, siblings: Account[], index: number): MenuEntry[] => [
    {
      id: "edit",
      label: t("common.edit"),
      icon: <Pencil />,
      onSelect: () => (setEditing(account), setFormOpen(true)),
    },
    {
      id: "up",
      label: t("common.moveUp"),
      icon: <ArrowUp />,
      disabled: index === 0,
      onSelect: () => mutations.move.mutate({ siblings, id: account.id, direction: "up" }),
    },
    {
      id: "down",
      label: t("common.moveDown"),
      icon: <ArrowDown />,
      disabled: index === siblings.length - 1,
      onSelect: () => mutations.move.mutate({ siblings, id: account.id, direction: "down" }),
    },
    { type: "separator", id: "sep" },
    account.archived
      ? {
          id: "unarchive",
          label: t("common.unarchive"),
          icon: <ArchiveRestore />,
          onSelect: () => mutations.setArchived.mutate({ id: account.id, archived: false }),
        }
      : {
          id: "archive",
          label: t("common.archive"),
          icon: <Archive />,
          onSelect: () => mutations.setArchived.mutate({ id: account.id, archived: true }),
        },
    {
      id: "delete",
      label: t("common.delete"),
      icon: <Trash2 />,
      tone: "danger",
      onSelect: () => void requestDelete(account),
    },
  ];

  const renderList = (list: Account[]) => (
    <ul role="list" className={styles.list}>
      {list.map((account, index) => (
        <li key={account.id} className={styles.row}>
          <CategoryIcon icon={account.icon} color={account.color} />
          <div className={styles.main}>
            <span className={styles.title}>
              {account.name}
              {account.archived && <Badge>{t("common.archivedBadge")}</Badge>}
            </span>
            <span className={styles.meta}>{t(`accountTypes.${account.type}`)}</span>
          </div>
          <div className={styles.end}>
            <Amount
              cents={balances.data?.get(account.id) ?? account.initial_balance_cents}
              variant="neutral"
            />
            <DropdownMenu
              trigger={
                <IconButton
                  label={t("common.actionsFor", { name: account.name })}
                  icon={<MoreHorizontal />}
                />
              }
              items={menu(account, list, index)}
            />
          </div>
        </li>
      ))}
    </ul>
  );

  const data = accounts.data;
  return (
    <>
      <PageHeader
        title={t("accounts.title")}
        description={t("accounts.description")}
        actions={
          <Button variant="primary" iconStart={<Plus />} onClick={openCreate}>
            {t("accounts.add")}
          </Button>
        }
      />
      {accounts.isError ? (
        <ErrorState
          description={errorMessage(accounts.error)}
          onRetry={() => void accounts.refetch()}
        />
      ) : !data ? (
        <Card padding="none">
          <ListSkeleton />
        </Card>
      ) : data.all.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Landmark />}
            title={t("accounts.empty.title")}
            description={t("accounts.empty.text")}
            action={
              <Button variant="primary" iconStart={<Plus />} onClick={openCreate}>
                {t("accounts.add")}
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <StatCard
            className={styles.summary}
            label={t("accounts.totalBalance")}
            icon={<Wallet />}
            loading={balances.isPending}
            value={
              balances.data ? (
                <Amount
                  cents={totalBalance(
                    balances.data,
                    data.active.map((a) => a.id),
                  )}
                  variant="neutral"
                  size="lg"
                />
              ) : null
            }
          />
          <h2 className="visually-hidden">{t("accounts.title")}</h2>
          <Card padding="none">{renderList(data.active)}</Card>
          {data.archived.length > 0 && (
            <>
              <h2 className={styles.sectionTitle}>{t("accounts.archivedSection")}</h2>
              <Card padding="none">{renderList(data.archived)}</Card>
            </>
          )}
        </>
      )}

      <AccountFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        account={editing}
        nextSortOrder={data?.all.length ?? 0}
      />
      <ConfirmDialog
        open={archiveCandidate !== null}
        onOpenChange={(open) => !open && setArchiveCandidate(null)}
        tone="primary"
        title={t("accounts.archiveInstead.title")}
        description={t("accounts.archiveInstead.text", {
          name: archiveCandidate?.account.name ?? "",
          count: archiveCandidate?.usage ?? 0,
        })}
        confirmLabel={t("accounts.archiveInstead.confirm")}
        onConfirm={async () => {
          if (archiveCandidate)
            await mutations.setArchived.mutateAsync({
              id: archiveCandidate.account.id,
              archived: true,
            });
        }}
      />
    </>
  );
}
