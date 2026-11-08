"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui";
import type { CategoryAmount } from "@/features/reports/aggregate";
import { CategoryBreakdownCard } from "@/features/reports/components/CategoryBreakdownCard";

/** Largest expense categories of the current budget month. */
export function TopCategoriesCard({ items }: { items: readonly CategoryAmount[] }) {
  const { t } = useTranslation();
  return (
    <CategoryBreakdownCard
      title={t("dashboard.topCategories.title")}
      description={t("dashboard.topCategories.description")}
      emptyText={t("dashboard.topCategories.empty")}
      items={items}
      actions={
        <Button asChild variant="ghost" size="sm">
          <Link href="/reports/">{t("dashboard.topCategories.report")}</Link>
        </Button>
      }
    />
  );
}
