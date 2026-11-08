"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  Tabs,
} from "@/components/ui";
import { categoryDisplayName } from "@/features/categories/displayName";
import { useAllCategories } from "@/features/categories/hooks";
import { ruleTitle } from "@/features/recurring/ruleTitle";
import { ListSkeleton } from "@/features/shared/components/ListSkeleton";
import styles from "@/features/shared/components/EntityList.module.css";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import { useFormat } from "@/lib/i18n/useFormat";
import { useDocumentTitle } from "@/lib/utils/useDocumentTitle";
import { TRASH_KINDS, type TrashKind, useTrash, useTrashMutations } from "../hooks";

interface TrashEntry {
  id: string;
  name: string;
  detail?: string;
  deletedAt: string;
}

/** Restore or permanently delete trashed items, per entity type. */
export function TrashScreen() {
  const { t } = useTranslation();
  const format = useFormat();
  const errorMessage = useErrorMessage();
  useDocumentTitle(t("trash.title"));
  const trash = useTrash();
  const categories = useAllCategories();
  const { restore, remove } = useTrashMutations();
  const [kind, setKind] = useState<TrashKind>("transactions");
  const [confirm, setConfirm] = useState<{ kind: TrashKind; entries: TrashEntry[] } | null>(null);

  const entriesFor = (k: TrashKind): TrashEntry[] => {
    const data = trash.data;
    if (!data) return [];
    const allCategories = [...(categories.data ?? []), ...data.categories];
    const catName = (id: string | null) => {
      const c = id ? allCategories.find((x) => x.id === id) : undefined;
      return c ? categoryDisplayName(t, c) : "";
    };
    switch (k) {
      case "transactions":
        return data.transactions.map((tx) => ({
          id: tx.id,
          name: tx.payee || catName(tx.category_id) || t(`transactions.types.${tx.type}`),
          detail: `${format.date(tx.date, "medium")} · ${format.money(tx.type === "income" ? tx.amount_cents : -tx.amount_cents)}`,
          deletedAt: tx.deleted_at ?? "",
        }));
      case "accounts":
        return data.accounts.map((a) => ({
          id: a.id,
          name: a.name,
          detail: t(`accountTypes.${a.type}`),
          deletedAt: a.deleted_at ?? "",
        }));
      case "categories":
        return data.categories.map((c) => ({
          id: c.id,
          name: categoryDisplayName(t, c),
          detail: t(`categoryTypes.${c.type}`),
          deletedAt: c.deleted_at ?? "",
        }));
      case "recurring":
        return data.recurring.map((r) => ({
          id: r.id,
          name: ruleTitle(
            t,
            r,
            allCategories.find((c) => c.id === r.category_id),
          ),
          detail: format.money(r.type === "income" ? r.amount_cents : -r.amount_cents),
          deletedAt: r.deleted_at ?? "",
        }));
    }
  };

  const panel = (k: TrashKind) => {
    const entries = entriesFor(k);
    if (entries.length === 0) {
      return (
        <EmptyState
          headingLevel={3}
          icon={<Trash2 />}
          title={t("trash.empty.title")}
          description={t("trash.empty.text")}
        />
      );
    }
    return (
      <>
        <div className={styles.end}>
          <Button
            variant="danger"
            size="sm"
            iconStart={<Trash2 />}
            onClick={() => setConfirm({ kind: k, entries })}
          >
            {t("trash.emptyTrash")}
          </Button>
        </div>
        <Card padding="none">
          <ul role="list" className={styles.list}>
            {entries.map((entry) => (
              <li key={entry.id} className={styles.row}>
                <div className={styles.main}>
                  <span className={styles.title}>{entry.name}</span>
                  <span className={styles.meta}>
                    {[
                      entry.detail,
                      t("trash.deletedAt", { date: format.dateTime(entry.deletedAt) }),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
                <div className={styles.end}>
                  <Button
                    size="sm"
                    iconStart={<RotateCcw />}
                    onClick={() => restore.mutate({ kind: k, ids: [entry.id] })}
                  >
                    {t("trash.restore")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirm({ kind: k, entries: [entry] })}
                  >
                    {t("trash.purge")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </>
    );
  };

  const counts = (k: TrashKind) => entriesFor(k).length;
  const single = confirm?.entries.length === 1 ? confirm.entries[0] : undefined;

  return (
    <>
      <PageHeader title={t("trash.title")} description={t("trash.description")} />
      {trash.isError ? (
        <ErrorState description={errorMessage(trash.error)} onRetry={() => void trash.refetch()} />
      ) : !trash.data ? (
        <Card padding="none">
          <ListSkeleton />
        </Card>
      ) : (
        <Tabs
          label={t("trash.title")}
          value={kind}
          onValueChange={setKind}
          items={TRASH_KINDS.map((k) => ({
            value: k,
            label: `${t(`trash.tabs.${k}`)} (${format.number(counts(k))})`,
            content: panel(k),
          }))}
        />
      )}
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={single ? t("trash.purgeConfirm.title") : t("trash.emptyConfirm.title")}
        description={
          single
            ? t("trash.purgeConfirm.text", { name: single.name })
            : t("trash.emptyConfirm.text", { count: confirm?.entries.length ?? 0 })
        }
        confirmLabel={single ? t("trash.purge") : t("trash.emptyConfirm.confirm")}
        onConfirm={async () => {
          if (confirm)
            await remove.mutateAsync({ kind: confirm.kind, ids: confirm.entries.map((e) => e.id) });
        }}
      />
    </>
  );
}
