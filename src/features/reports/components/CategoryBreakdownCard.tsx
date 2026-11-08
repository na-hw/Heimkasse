"use client";

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Card, ChartContainer } from "@/components/ui";
import { useCategoryLookup } from "@/features/categories/hooks";
import { useFormat } from "@/lib/i18n/useFormat";
import type { CategoryAmount } from "../aggregate";
import { CategoryBarChart } from "./charts";
import styles from "./ReportsScreen.module.css";

interface Row {
  name: string;
  cents: number;
  share: number;
}

interface CategoryBreakdownCardProps {
  title: string;
  description?: string;
  items: readonly CategoryAmount[];
  emptyText: string;
  actions?: ReactNode;
}

/** Amount per top-level category as horizontal bars, with an accessible table view. */
export function CategoryBreakdownCard({
  title,
  description,
  items,
  emptyText,
  actions,
}: CategoryBreakdownCardProps) {
  const { t } = useTranslation();
  const format = useFormat();
  const categories = useCategoryLookup();
  const rows: Row[] = items.map((c) => ({
    name: categories.name(c.categoryId),
    cents: c.cents,
    share: c.share,
  }));

  if (rows.length === 0) {
    return (
      <Card title={title} description={description} actions={actions}>
        <p className={styles.muted}>{emptyText}</p>
      </Card>
    );
  }

  return (
    <ChartContainer
      title={title}
      description={description}
      actions={actions}
      data={rows}
      height={Math.max(160, rows.length * 40)}
      columns={[
        { key: "name", header: t("reports.columns.category") },
        {
          key: "cents",
          header: t("reports.columns.amount"),
          align: "end",
          format: (v) => format.money(Number(v)),
        },
        {
          key: "share",
          header: t("reports.columns.share"),
          align: "end",
          format: (v) => format.percent(Number(v), { maximumFractionDigits: 1 }),
        },
      ]}
    >
      <CategoryBarChart data={rows} />
    </ChartContainer>
  );
}
