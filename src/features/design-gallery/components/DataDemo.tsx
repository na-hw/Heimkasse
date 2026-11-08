"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import {
  Badge,
  CategoryIcon,
  ChartContainer,
  DataTable,
  Input,
  Skeleton,
  createColumnHelper,
} from "@/components/ui";
import { useCategories } from "@/features/categories/hooks";
import { categoryDisplayName } from "@/features/categories/displayName";
import type { Category } from "@/features/categories/schemas";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import { useFormat } from "@/lib/i18n/useFormat";
import { GallerySection } from "./GallerySection";
import styles from "./DesignGallery.module.css";

const SubcategoryChart = dynamic(() => import("./SubcategoryChart"), {
  ssr: false,
  loading: () => <Skeleton height="100%" radius="md" />,
});

interface Row {
  id: string;
  name: string;
  type: Category["type"];
  parent: string;
  category: Category;
}

const column = createColumnHelper<Row>();

/** DataTable + ChartContainer with the real built-in categories. */
export function DataDemo() {
  const { t } = useTranslation();
  const format = useFormat();
  const errorMessage = useErrorMessage();
  const categories = useCategories();
  const [filter, setFilter] = useState("");

  const rows = useMemo<Row[]>(() => {
    const list = categories.data ?? [];
    const byId = new Map(list.map((c) => [c.id, c]));
    return list.map((c) => {
      const parent = c.parent_id ? byId.get(c.parent_id) : undefined;
      return {
        id: c.id,
        name: categoryDisplayName(t, c),
        type: c.type,
        parent: parent ? categoryDisplayName(t, parent) : "—",
        category: c,
      };
    });
  }, [categories.data, t]);

  const columns = useMemo(
    () => [
      column.accessor("name", {
        header: t("design.data.name"),
        cell: (info) => (
          <span className={styles.nameCell}>
            <CategoryIcon
              icon={info.row.original.category.icon}
              color={info.row.original.category.color}
              size="sm"
            />
            {info.getValue()}
          </span>
        ),
      }),
      column.accessor("type", {
        header: t("design.data.type"),
        cell: (info) => (
          <Badge tone={info.getValue() === "income" ? "success" : "neutral"}>
            {t(`categoryTypes.${info.getValue()}`)}
          </Badge>
        ),
      }),
      column.accessor("parent", { header: t("design.data.parent") }),
    ],
    [t],
  );

  const chartData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows)
      if (row.parent !== "—") counts.set(row.parent, (counts.get(row.parent) ?? 0) + 1);
    return [...counts.entries()].map(([name, count]) => ({ name, count }));
  }, [rows]);

  return (
    <GallerySection title={t("design.sections.data")}>
      <Input
        type="search"
        aria-label={t("common.searchPlaceholder")}
        placeholder={t("common.searchPlaceholder")}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        startAdornment={<Search size={18} aria-hidden="true" />}
      />
      <DataTable
        caption={t("design.data.categoriesTable")}
        showCaption
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        isLoading={categories.isPending}
        error={categories.isError ? errorMessage(categories.error) : undefined}
        onRetry={() => void categories.refetch()}
        globalFilter={filter}
        enableSelection
        pageSize={8}
        emptyState={<p className={styles.emptyRow}>{t("common.noResults")}</p>}
      />
      <ChartContainer
        title={t("design.data.subcategoriesChart")}
        description={t("design.data.subcategoriesChartDescription")}
        data={chartData}
        columns={[
          { key: "name", header: t("design.data.name") },
          {
            key: "count",
            header: t("design.data.count"),
            align: "end",
            format: (v) => format.number(Number(v)),
          },
        ]}
      >
        <SubcategoryChart data={chartData} />
      </ChartContainer>
    </GallerySection>
  );
}
