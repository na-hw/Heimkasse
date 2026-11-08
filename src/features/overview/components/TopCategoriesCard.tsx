"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button, Card, ChartContainer } from "@/components/ui";
import { useCategoryLookup } from "@/features/categories/hooks";
import type { CategoryAmount } from "@/features/reports/aggregate";
import { CategoryBarChart } from "@/features/reports/components/charts";
import { useFormat } from "@/lib/i18n/useFormat";
import styles from "./OverviewScreen.module.css";

interface Row {
  name: string;
  cents: number;
  share: number;
}

/** Largest expense categories of the current budget month, chart with table fallback. */
export function TopCategoriesCard({ items }: { items: readonly CategoryAmount[] }) {
  const { t } = useTranslation();
  const format = useFormat();
  const categories = useCategoryLookup();
  const rows: Row[] = items.map((c) => ({
    name: categories.name(c.categoryId),
    cents: c.cents,
    share: c.share,
  }));
  const reportLink = (
    <Button asChild variant="ghost" size="sm">
      <Link href="/reports/">{t("dashboard.topCategories.report")}</Link>
    </Button>
  );

  if (rows.length === 0) {
    return (
      <Card
        title={t("dashboard.topCategories.title")}
        description={t("dashboard.topCategories.description")}
      >
        <p className={styles.muted}>{t("dashboard.topCategories.empty")}</p>
      </Card>
    );
  }

  return (
    <ChartContainer
      title={t("dashboard.topCategories.title")}
      description={t("dashboard.topCategories.description")}
      actions={reportLink}
      data={rows}
      height={Math.max(160, rows.length * 44)}
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
