"use client";

import { ListChecks, Plus, Receipt, Search, SearchX, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Kbd,
  PageHeader,
  Select,
  Sheet,
  announce,
} from "@/components/ui";
import { useAccounts } from "@/features/accounts/hooks";
import { useAllCategories } from "@/features/categories/hooks";
import { ListSkeleton } from "@/features/shared/components/ListSkeleton";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import { shortcutLabel } from "@/lib/utils/useHotkey";
import { useDocumentTitle } from "@/lib/utils/useDocumentTitle";
import { useTransactionEditor } from "../editorStore";
import { countActiveFilters, type TransactionSort } from "../filters";
import { useTransactionFilters } from "../filtersStore";
import { useTransactionList, useTransactionMeta, useTransactionMutations } from "../hooks";
import type { Transaction } from "../schemas";
import { BulkActionsBar } from "./BulkActionsBar";
import { ChangeCategoryDialog } from "./ChangeCategoryDialog";
import { TransactionFiltersPanel } from "./TransactionFiltersPanel";
import { TransactionList } from "./TransactionList";
import styles from "./TransactionsScreen.module.css";

const SORTS: TransactionSort[] = ["dateDesc", "dateAsc", "amountDesc", "amountAsc"];

/** Searchable, filterable, virtualized transaction list with bulk actions. */
export function TransactionsScreen() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  useDocumentTitle(t("transactions.title"));
  const { filters, sort, setFilter, setSort, reset } = useTransactionFilters();
  const list = useTransactionList(filters, sort);
  const accounts = useAccounts();
  const categories = useAllCategories();
  const meta = useTransactionMeta();
  const editor = useTransactionEditor();
  const { remove, setCategory } = useTransactionMutations();
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [changeOpen, setChangeOpen] = useState(false);
  const activeFilters = countActiveFilters(filters);
  const transactions = useMemo(() => list.data ?? [], [list.data]);

  // Announce the number of results after search/filter changes.
  useEffect(() => {
    if (!list.data) return;
    const id = setTimeout(() => announce(t("transactions.count", { count: list.data?.length ?? 0 })), 600);
    return () => clearTimeout(id);
  }, [list.data, t]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const endSelection = () => {
    setSelected(new Set());
    setSelectMode(false);
  };

  const hasAccounts = (accounts.data?.all.length ?? 0) > 0;
  const isFiltered = activeFilters > 0 || filters.search.trim() !== "";

  const content = () => {
    if (list.isError) return <ErrorState description={errorMessage(list.error)} onRetry={() => void list.refetch()} />;
    if (!list.data || !accounts.data || !categories.data) {
      return (
        <Card padding="none">
          <ListSkeleton rows={6} />
        </Card>
      );
    }
    if (transactions.length === 0) {
      return (
        <Card>
          {isFiltered ? (
            <EmptyState
              icon={<SearchX />}
              title={t("transactions.emptyFiltered.title")}
              description={t("transactions.emptyFiltered.text")}
              action={
                <Button
                  onClick={() => {
                    reset();
                    setFilter("search", "");
                  }}
                >
                  {t("transactions.filters.reset")}
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<Receipt />}
              title={hasAccounts ? t("transactions.empty.title") : t("transactions.needAccount.title")}
              description={hasAccounts ? t("transactions.empty.text") : t("transactions.needAccount.text")}
              action={
                <Button variant="primary" iconStart={<Plus />} onClick={() => editor.openCreate()}>
                  {hasAccounts ? t("transactions.add") : t("transactions.needAccount.action")}
                </Button>
              }
            />
          )}
        </Card>
      );
    }
    return (
      <TransactionList
        transactions={transactions}
        sort={sort}
        categories={categories.data}
        accounts={accounts.data.all}
        selectMode={selectMode}
        selected={selected}
        onToggle={toggle}
        onEdit={editor.openEdit}
        onDuplicate={editor.openDuplicate}
        onDelete={(tx: Transaction) => remove.mutate([tx.id])}
      />
    );
  };

  return (
    <>
      <PageHeader
        title={t("transactions.title")}
        description={t("transactions.description")}
        actions={
          <Button variant="primary" iconStart={<Plus />} onClick={() => editor.openCreate()} aria-keyshortcuts="Meta+N Control+N">
            {t("transactions.add")}
            <Kbd>{shortcutLabel("n")}</Kbd>
          </Button>
        }
      />
      <div className={styles.toolbar} role="search">
        <Input
          type="search"
          aria-label={t("transactions.search")}
          placeholder={t("transactions.search")}
          value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
          startAdornment={<Search size={18} aria-hidden="true" />}
          wrapperClassName={styles.search}
        />
        <Sheet
          title={t("transactions.filters.title")}
          trigger={
            <Button iconStart={<SlidersHorizontal />} aria-label={t("transactions.filters.open")}>
              <span className={styles.hideSmall}>{t("transactions.filters.title")}</span>
              {activeFilters > 0 && (
                <Badge tone="primary">
                  <span aria-hidden="true">{activeFilters}</span>
                  <span className="visually-hidden">{t("transactions.filters.active", { count: activeFilters })}</span>
                </Badge>
              )}
            </Button>
          }
        >
          <TransactionFiltersPanel
            accounts={accounts.data?.all ?? []}
            categories={categories.data ?? []}
            tags={meta.data?.tags ?? []}
          />
        </Sheet>
        <div className={styles.sort}>
          <Select
            aria-label={t("transactions.sort.label")}
            value={sort}
            onValueChange={setSort}
            options={SORTS.map((s) => ({ value: s, label: t(`transactions.sort.${s}`) }))}
          />
        </div>
        <Button
          variant={selectMode ? "primary" : "secondary"}
          iconStart={<ListChecks />}
          aria-pressed={selectMode}
          onClick={() => (selectMode ? endSelection() : setSelectMode(true))}
        >
          <span className={styles.hideSmall}>{selectMode ? t("common.done") : t("common.selectMode")}</span>
        </Button>
      </div>
      {list.data && (
        <p className={styles.count}>
          {t("transactions.count", { count: transactions.length })}
          {activeFilters > 0 && (
            <>
              {" · "}
              <button type="button" className={styles.linkButton} onClick={reset}>
                {t("transactions.filters.reset")}
              </button>
            </>
          )}
        </p>
      )}
      {content()}
      {selectMode && (
        <BulkActionsBar
          count={selected.size}
          onSelectAll={() => setSelected(new Set(transactions.map((tx) => tx.id)))}
          onChangeCategory={() => setChangeOpen(true)}
          onDelete={() => {
            remove.mutate([...selected]);
            endSelection();
          }}
          onClear={endSelection}
        />
      )}
      <ChangeCategoryDialog
        open={changeOpen}
        count={selected.size}
        onOpenChange={setChangeOpen}
        onApply={(categoryId) => {
          setCategory.mutate({ ids: [...selected], categoryId });
          endSelection();
        }}
      />
    </>
  );
}
