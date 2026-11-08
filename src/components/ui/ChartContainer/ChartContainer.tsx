"use client";

import { ChartColumnBig, Table2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";
import { Card } from "../Card";
import { Tabs } from "../Tabs";
import styles from "./ChartContainer.module.css";

export interface ChartTableColumn<R> {
  key: keyof R & string;
  header: string;
  align?: "start" | "end";
  /** Formats the cell for display (e.g. money). */
  format?: (value: R[keyof R & string], row: R) => ReactNode;
}

export interface ChartContainerProps<R> {
  title: string;
  description?: string;
  /** The data behind the chart; rendered as an accessible table alternative. */
  data: readonly R[];
  columns: readonly ChartTableColumn<R>[];
  /** The chart itself (lazy-load heavy chart libraries). */
  children: ReactNode;
  height?: number;
  defaultView?: "chart" | "table";
  actions?: ReactNode;
  className?: string;
}

/**
 * Chart card with a Chart/Table switch. The data table is always present
 * for assistive technology (visually hidden in chart view), so every chart
 * has an accessible equivalent.
 */
export function ChartContainer<R>({
  title,
  description,
  data,
  columns,
  children,
  height = 280,
  defaultView = "chart",
  actions,
  className,
}: ChartContainerProps<R>) {
  const { t } = useTranslation();
  const [view, setView] = useState<"chart" | "table">(defaultView);

  const table = (
    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <caption className="visually-hidden">{title}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={styles[c.align ?? "start"]}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {columns.map((c, j) => {
                const value = row[c.key];
                const content = c.format ? c.format(value, row) : String(value);
                return j === 0 ? (
                  <th key={c.key} scope="row" className={styles[c.align ?? "start"]}>
                    {content}
                  </th>
                ) : (
                  <td key={c.key} className={styles[c.align ?? "start"]}>
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <Card title={title} description={description} actions={actions} className={className}>
      <Tabs
        label={t("chart.views")}
        appearance="segmented"
        value={view}
        onValueChange={setView}
        items={[
          {
            value: "chart",
            label: t("chart.viewChart"),
            icon: <ChartColumnBig />,
            content: (
              <>
                <div className={styles.chart} style={{ blockSize: height }} aria-hidden="true">
                  {children}
                </div>
                <div className="visually-hidden">{table}</div>
              </>
            ),
          },
          { value: "table", label: t("chart.viewTable"), icon: <Table2 />, content: table },
        ]}
        className={cn(styles.tabs)}
      />
    </Card>
  );
}
