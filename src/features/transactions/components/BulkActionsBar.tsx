"use client";

import { CheckCheck, FolderInput, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, IconButton } from "@/components/ui";
import styles from "./TransactionsScreen.module.css";

interface Props {
  count: number;
  onSelectAll: () => void;
  onChangeCategory: () => void;
  onDelete: () => void;
  onClear: () => void;
}

/** Sticky action bar for the current selection. */
export function BulkActionsBar({ count, onSelectAll, onChangeCategory, onDelete, onClear }: Props) {
  const { t } = useTranslation();
  return (
    <section className={styles.bulkBar} aria-label={t("transactions.bulk.selected", { count })}>
      <IconButton label={t("transactions.bulk.clear")} icon={<X />} onClick={onClear} />
      <span className={styles.bulkCount} aria-live="polite">
        {t("transactions.bulk.selected", { count })}
      </span>
      <div className={styles.bulkActions}>
        <Button size="sm" variant="ghost" iconStart={<CheckCheck />} onClick={onSelectAll}>
          {t("transactions.bulk.selectAll")}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          iconStart={<FolderInput />}
          onClick={onChangeCategory}
          disabled={count === 0}
        >
          {t("transactions.bulk.changeCategory")}
        </Button>
        <Button
          size="sm"
          variant="danger"
          iconStart={<Trash2 />}
          onClick={onDelete}
          disabled={count === 0}
        >
          {t("transactions.bulk.delete")}
        </Button>
      </div>
    </section>
  );
}
