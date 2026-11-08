"use client";

import { Copy, MoreHorizontal, Pencil, Repeat, Trash2 } from "lucide-react";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Amount, Badge, CategoryIcon, Checkbox, DropdownMenu, IconButton } from "@/components/ui";
import type { Account } from "@/features/accounts/schemas";
import { categoryDisplayName } from "@/features/categories/displayName";
import type { Category } from "@/features/categories/schemas";
import { useFormat } from "@/lib/i18n/useFormat";
import { cn } from "@/lib/utils/cn";
import type { Transaction } from "../schemas";
import styles from "./TransactionList.module.css";

export interface TransactionRowProps {
  tx: Transaction;
  category: Category | undefined;
  account: Account | undefined;
  transferAccount: Account | undefined;
  selectMode: boolean;
  selected: boolean;
  onToggle: (id: string) => void;
  onEdit: (tx: Transaction) => void;
  onDuplicate: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

/** One transaction: icon, title, meta, amount (with sign + screen-reader text) and actions. */
export const TransactionRow = memo(function TransactionRow({
  tx,
  category,
  account,
  transferAccount,
  selectMode,
  selected,
  onToggle,
  onEdit,
  onDuplicate,
  onDelete,
}: TransactionRowProps) {
  const { t } = useTranslation();
  const format = useFormat();
  const categoryName = category ? categoryDisplayName(t, category) : "";
  const isTransfer = tx.type === "transfer";
  const title =
    tx.payee || (isTransfer ? t("transactions.types.transfer") : categoryName || t("categories.uncategorized"));
  const meta = [
    isTransfer ? null : tx.payee ? categoryName || t("categories.uncategorized") : null,
    isTransfer
      ? `${account?.name ?? ""} ${t("transactions.transferTo", { account: transferAccount?.name ?? "" })}`
      : account?.name,
  ]
    .filter(Boolean)
    .join(" · ");
  const signed = tx.type === "income" ? tx.amount_cents : tx.type === "expense" ? -tx.amount_cents : tx.amount_cents;

  return (
    <div className={cn(styles.row, selected && styles.selected)}>
      {selectMode && (
        <Checkbox
          aria-label={t("dataTable.selectRow")}
          checked={selected}
          onCheckedChange={() => onToggle(tx.id)}
        />
      )}
      <button
        type="button"
        className={styles.rowButton}
        onClick={() => (selectMode ? onToggle(tx.id) : onEdit(tx))}
        aria-label={t("transactions.rowSummary", {
          title,
          amount: format.money(signed, { signDisplay: isTransfer ? "auto" : "exceptZero" }),
          date: format.date(tx.date, "medium"),
        })}
      >
        {isTransfer ? (
          <CategoryIcon icon="repeat" color="gray" />
        ) : (
          <CategoryIcon icon={category?.icon ?? "circle"} color={category?.color ?? "gray"} />
        )}
        <span className={styles.text}>
          <span className={styles.title}>
            {title}
            {tx.recurring_rule_id && <Repeat size={14} aria-hidden="true" className={styles.recurringIcon} />}
          </span>
          <span className={styles.meta}>{meta}</span>
          {tx.tags.length > 0 && (
            <span className={styles.tags}>
              {tx.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </span>
          )}
        </span>
        <span className={styles.amount} aria-hidden="true">
          <Amount cents={signed} variant={isTransfer ? "neutral" : "signed"} withIcon={!isTransfer} />
        </span>
      </button>
      {!selectMode && (
        <DropdownMenu
          trigger={<IconButton label={t("common.actionsFor", { name: title })} icon={<MoreHorizontal />} showTooltip={false} />}
          items={[
            { id: "edit", label: t("common.edit"), icon: <Pencil />, onSelect: () => onEdit(tx) },
            { id: "dup", label: t("common.duplicate"), icon: <Copy />, onSelect: () => onDuplicate(tx) },
            { type: "separator", id: "sep" },
            { id: "del", label: t("common.delete"), icon: <Trash2 />, tone: "danger", onSelect: () => onDelete(tx) },
          ]}
        />
      )}
    </div>
  );
});
