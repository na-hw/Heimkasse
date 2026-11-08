import type { TFunction } from "i18next";
import { csvAmount, csvPercent } from "@/lib/export/csv";
import type { ExportDocument, ExportTable } from "@/lib/export/document";
import { type CategoryAmount, trendKey } from "./aggregate";
import type { Report } from "./report";

interface Formatters {
  money: (cents: number) => string;
  percent: (ratio: number) => string;
  /** Label for a month key `YYYY-MM`. */
  month: (key: string) => string;
  categoryName: (id: string | null) => string;
}

function categoryTable(
  t: TFunction,
  f: Formatters,
  heading: string,
  items: readonly CategoryAmount[],
): ExportTable {
  const max = Math.max(1, ...items.map((i) => i.cents));
  return {
    heading,
    columns: [
      { header: t("reports.columns.category"), weight: 2 },
      { header: t("reports.columns.amount"), align: "end" },
      { header: t("reports.columns.share"), align: "end", weight: 0.8 },
    ],
    rows: items.map((i) => [f.categoryName(i.categoryId), f.money(i.cents), f.percent(i.share)]),
    csvRows: items.map((i) => [
      f.categoryName(i.categoryId),
      csvAmount(i.cents),
      csvPercent(i.share),
    ]),
    bars: items.map((i) => i.cents / max),
  };
}

/** Turns a report into a format-neutral export document (CSV/PDF). */
export function buildReportDocument(
  report: Report,
  t: TFunction,
  f: Formatters,
  meta: { periodLabel: string; createdOn: string; language: string; direction: "ltr" | "rtl" },
): ExportDocument {
  const { totals } = report;
  const netWorthByMonth = new Map(report.netWorth.map((p) => [p.month, p.balance]));
  const trendIds = report.trends.categoryIds;
  const savingsRate =
    totals.savingsRate === null ? t("dashboard.noIncome") : f.percent(totals.savingsRate);

  return {
    title: t("reports.title"),
    subtitle: meta.periodLabel,
    footnote: meta.createdOn,
    language: meta.language,
    direction: meta.direction,
    tables: [
      {
        heading: t("reports.summaryTitle"),
        columns: [
          { header: t("reports.columns.metric"), weight: 2 },
          { header: t("reports.columns.amount"), align: "end" },
        ],
        rows: [
          [t("reports.columns.income"), f.money(totals.income)],
          [t("reports.columns.expense"), f.money(totals.expense)],
          [t("reports.columns.net"), f.money(totals.net)],
          [t("dashboard.savingsRate"), savingsRate],
        ],
        csvRows: [
          [t("reports.columns.income"), csvAmount(totals.income)],
          [t("reports.columns.expense"), csvAmount(totals.expense)],
          [t("reports.columns.net"), csvAmount(totals.net)],
          [
            t("dashboard.savingsRate"),
            totals.savingsRate === null ? "" : csvPercent(totals.savingsRate),
          ],
        ],
      },
      categoryTable(t, f, t("reports.expensesByCategory"), report.expenses),
      categoryTable(t, f, t("reports.incomeByCategory"), report.income),
      {
        heading: t("reports.monthlyTitle"),
        columns: [
          { header: t("reports.columns.month") },
          { header: t("reports.columns.income"), align: "end" },
          { header: t("reports.columns.expense"), align: "end" },
          { header: t("reports.columns.net"), align: "end" },
          { header: t("reports.columns.balance"), align: "end" },
        ],
        rows: report.monthly.map((m) => [
          f.month(m.month),
          f.money(m.income),
          f.money(m.expense),
          f.money(m.net),
          f.money(netWorthByMonth.get(m.month) ?? 0),
        ]),
        csvRows: report.monthly.map((m) => [
          m.month,
          csvAmount(m.income),
          csvAmount(m.expense),
          csvAmount(m.net),
          csvAmount(netWorthByMonth.get(m.month) ?? 0),
        ]),
      },
      ...(trendIds.length > 0
        ? [
            {
              heading: t("reports.trendsTitle"),
              columns: [
                { header: t("reports.columns.month") },
                ...trendIds.map((id) => ({ header: f.categoryName(id), align: "end" as const })),
              ],
              rows: report.trends.rows.map((r) => [
                f.month(r.month),
                ...trendIds.map((id) => f.money(r.values[trendKey(id)] ?? 0)),
              ]),
              csvRows: report.trends.rows.map((r) => [
                r.month,
                ...trendIds.map((id) => csvAmount(r.values[trendKey(id)] ?? 0)),
              ]),
            },
          ]
        : []),
    ],
  };
}
