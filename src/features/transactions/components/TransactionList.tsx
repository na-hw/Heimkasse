"use client";

import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Amount } from "@/components/ui";
import type { Account } from "@/features/accounts/schemas";
import type { Category } from "@/features/categories/schemas";
import { useFormat } from "@/lib/i18n/useFormat";
import type { TransactionSort } from "../filters";
import { type ListItem, flattenGroups, groupByDay } from "../grouping";
import type { Transaction } from "../schemas";
import { TransactionRow } from "./TransactionRow";
import styles from "./TransactionList.module.css";

interface TransactionListProps {
  transactions: Transaction[];
  sort: TransactionSort;
  categories: Category[];
  accounts: Account[];
  selectMode: boolean;
  selected: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onEdit: (tx: Transaction) => void;
  onDuplicate: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  attachmentCounts: ReadonlyMap<string, number>;
  onAttachments: (tx: Transaction, title: string) => void;
}

/**
 * Virtualized list (window scrolling). Date sorts are grouped by day with a
 * daily net total; amount sorts are a flat list.
 */
export function TransactionList({
  transactions,
  sort,
  categories,
  accounts,
  ...rowProps
}: TransactionListProps) {
  const { t } = useTranslation();
  const format = useFormat();
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  const items = useMemo<ListItem[]>(
    () =>
      sort.startsWith("date")
        ? flattenGroups(groupByDay(transactions))
        : transactions.map((tx) => ({ kind: "row" as const, key: tx.id, tx })),
    [transactions, sort],
  );
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  useLayoutEffect(() => {
    setScrollMargin(listRef.current?.offsetTop ?? 0);
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: (i) => (items[i]?.kind === "header" ? 44 : 72),
    overscan: 8,
    scrollMargin,
    getItemKey: (i) => items[i]?.key ?? i,
  });

  const measure = useCallback(
    (el: HTMLElement | null) => virtualizer.measureElement(el),
    [virtualizer],
  );

  return (
    <div
      ref={listRef}
      role="list"
      aria-label={t("transactions.listLabel")}
      className={styles.list}
      style={{ blockSize: virtualizer.getTotalSize() }}
    >
      {virtualizer.getVirtualItems().map((v) => {
        const item = items[v.index];
        if (!item) return null;
        return (
          <div
            key={v.key}
            role="listitem"
            data-index={v.index}
            ref={measure}
            className={styles.item}
            style={{ transform: `translateY(${v.start - scrollMargin}px)` }}
          >
            {item.kind === "header" ? (
              <h3 className={styles.dayHeader}>
                <span>{format.date(item.group.date, "full")}</span>
                <span className={styles.dayNet}>
                  <span className="visually-hidden">{t("transactions.dayNet")}: </span>
                  <Amount cents={item.group.netCents} size="sm" />
                </span>
              </h3>
            ) : (
              <TransactionRow
                tx={item.tx}
                category={item.tx.category_id ? categoryById.get(item.tx.category_id) : undefined}
                account={accountById.get(item.tx.account_id)}
                transferAccount={
                  item.tx.transfer_account_id
                    ? accountById.get(item.tx.transfer_account_id)
                    : undefined
                }
                selected={rowProps.selected.has(item.tx.id)}
                selectMode={rowProps.selectMode}
                onToggle={rowProps.onToggle}
                onEdit={rowProps.onEdit}
                onDuplicate={rowProps.onDuplicate}
                onDelete={rowProps.onDelete}
                attachmentCount={rowProps.attachmentCounts.get(item.tx.id) ?? 0}
                onAttachments={rowProps.onAttachments}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
