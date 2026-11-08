"use client";

import { ArrowDownLeft, ArrowUpRight, ChartPie, PiggyBank, Plus, Scale } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Amount,
  Button,
  Card,
  ChartContainer,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  StatCard,
  Tabs,
} from "@/components/ui";
import { useCategoryLookup } from "@/features/categories/hooks";
import { ExportMenu } from "@/features/shared/components/ExportMenu";
import { PeriodNavigator } from "@/features/shared/components/PeriodNavigator";
import { useExport } from "@/features/shared/useExport";
import { useTransactionEditor } from "@/features/transactions/editorStore";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import { useFormat } from "@/lib/i18n/useFormat";
import { todayIso } from "@/lib/utils/dates";
import { useDocumentTitle } from "@/lib/utils/useDocumentTitle";
import { trendKey } from "../aggregate";
import { useReport } from "../hooks";
import { type ReportMode, reportPeriodFor, shiftReportPeriod } from "../report";
import { buildReportDocument } from "../reportDocument";
import { CategoryBreakdownCard } from "./CategoryBreakdownCard";
import { IncomeExpenseChart, LineSeriesChart } from "./charts";
import styles from "./ReportsScreen.module.css";

/** Monthly/yearly reports: by category, income vs. expense, trends and net worth. */
export function ReportsScreen() {
  const { t, i18n } = useTranslation();
  const format = useFormat();
  const errorMessage = useErrorMessage();
  useDocumentTitle(t("reports.title"));
  const today = todayIso();
  const [mode, setMode] = useState<ReportMode>("month");
  const [offset, setOffset] = useState(0);
  const period = useMemo(
    () => shiftReportPeriod(reportPeriodFor(mode, today), offset),
    [mode, offset, today],
  );
  const report = useReport(period);
  const categories = useCategoryLookup();
  const exporter = useExport();
  const openCreate = useTransactionEditor((s) => s.openCreate);
  const data = report.data;

  const periodLabel = format.date(
    mode === "month" ? `${period.key}-01` : `${period.key}-01-01`,
    mode === "month" ? "monthYear" : "year",
  );
  const monthLabel = (key: string) => format.date(`${key}-01`, "monthShortYear");

  const monthlyRows = (data?.monthly ?? []).map((m, i) => ({
    label: monthLabel(m.month),
    income: m.income,
    expense: m.expense,
    net: m.net,
    balance: data?.netWorth[i]?.balance ?? 0,
  }));
  const trendSeries = (data?.trends.categoryIds ?? []).map((id) => ({
    key: trendKey(id),
    name: categories.name(id),
  }));
  const trendRows: ({ label: string } & Record<string, number | string>)[] = (
    data?.trends.rows ?? []
  ).map((r) => ({
    label: monthLabel(r.month),
    ...r.values,
  }));

  const exportReport = (kind: "csv" | "pdf") => {
    if (!data) return;
    const doc = buildReportDocument(
      data,
      t,
      {
        money: (c) => format.money(c),
        percent: (r) => format.percent(r, { maximumFractionDigits: 1 }),
        month: (k) => format.date(`${k}-01`, "monthYear"),
        categoryName: categories.name,
      },
      {
        periodLabel,
        createdOn: t("export.createdOn", { date: format.date(today, "medium") }),
        language: i18n.language,
        direction: i18n.dir() === "rtl" ? "rtl" : "ltr",
      },
    );
    void (kind === "csv" ? exporter.exportCsv(doc) : exporter.exportPdf(doc));
  };

  const header = (
    <PageHeader
      title={t("reports.title")}
      description={t("reports.description")}
      actions={
        <ExportMenu
          onExport={exportReport}
          pending={exporter.pending}
          disabled={!data || !report.hasTransactions}
        />
      }
    />
  );

  if (report.isError)
    return (
      <>
        {header}
        <ErrorState
          description={errorMessage(report.error)}
          onRetry={() => void report.refetch()}
        />
      </>
    );

  if (report.hasTransactions === false)
    return (
      <>
        {header}
        <Card>
          <EmptyState
            icon={<ChartPie />}
            title={t("reports.empty.title")}
            description={t("reports.empty.text")}
            action={
              <Button variant="primary" iconStart={<Plus />} onClick={() => openCreate()}>
                {t("reports.empty.action")}
              </Button>
            }
          />
        </Card>
      </>
    );

  const panel = (
    <div className={styles.layout}>
      <div className={styles.toolbar}>
        <PeriodNavigator
          label={periodLabel}
          previousLabel={t(`reports.previous.${mode}`)}
          nextLabel={t(`reports.next.${mode}`)}
          currentLabel={t(`reports.current.${mode}`)}
          isCurrent={offset === 0}
          onPrevious={() => setOffset((o) => o - 1)}
          onNext={() => setOffset((o) => o + 1)}
          onCurrent={() => setOffset(0)}
        />
      </div>
      {!data ? (
        <Skeleton height="20rem" />
      ) : (
        <>
          <h2 className="visually-hidden">{t("reports.summaryTitle")}</h2>
          <div className={styles.kpis}>
            <StatCard
              label={t("reports.columns.income")}
              icon={<ArrowDownLeft />}
              value={<Amount cents={data.totals.income} variant="neutral" size="lg" />}
            />
            <StatCard
              label={t("reports.columns.expense")}
              icon={<ArrowUpRight />}
              value={<Amount cents={data.totals.expense} variant="neutral" size="lg" />}
            />
            <StatCard
              label={t("reports.columns.net")}
              icon={<Scale />}
              value={<Amount cents={data.totals.net} size="lg" />}
            />
            <StatCard
              label={t("dashboard.savingsRate")}
              icon={<PiggyBank />}
              value={
                data.totals.savingsRate === null ? (
                  <span className={styles.muted}>{t("dashboard.noIncome")}</span>
                ) : (
                  format.percent(data.totals.savingsRate, { maximumFractionDigits: 0 })
                )
              }
            />
          </div>

          <div className={styles.columns}>
            <CategoryBreakdownCard
              title={t("reports.expensesByCategory")}
              description={periodLabel}
              items={data.expenses}
              emptyText={t("reports.noData")}
            />
            <CategoryBreakdownCard
              title={t("reports.incomeByCategory")}
              description={periodLabel}
              items={data.income}
              emptyText={t("reports.noData")}
            />
          </div>

          <ChartContainer
            title={t("reports.monthlyTitle")}
            description={t("reports.monthlyDescription")}
            data={monthlyRows}
            columns={[
              { key: "label", header: t("reports.columns.month") },
              ...(["income", "expense", "net"] as const).map((key) => ({
                key,
                header: t(`reports.columns.${key}`),
                align: "end" as const,
                format: (v: unknown) => format.money(Number(v)),
              })),
            ]}
          >
            <IncomeExpenseChart
              data={monthlyRows}
              labels={{
                income: t("reports.columns.income"),
                expense: t("reports.columns.expense"),
                net: t("reports.columns.net"),
              }}
            />
          </ChartContainer>

          {trendSeries.length > 0 && (
            <ChartContainer
              title={t("reports.trendsTitle")}
              description={t("reports.trendsDescription")}
              data={trendRows}
              columns={[
                { key: "label", header: t("reports.columns.month") },
                ...trendSeries.map((s) => ({
                  key: s.key,
                  header: s.name,
                  align: "end" as const,
                  format: (v: unknown) => format.money(Number(v)),
                })),
              ]}
            >
              <LineSeriesChart data={trendRows} series={trendSeries} />
            </ChartContainer>
          )}

          <ChartContainer
            title={t("reports.netWorthTitle")}
            description={t("reports.netWorthDescription")}
            data={monthlyRows}
            columns={[
              { key: "label", header: t("reports.columns.month") },
              {
                key: "balance",
                header: t("reports.columns.balance"),
                align: "end",
                format: (v) => format.money(Number(v)),
              },
            ]}
          >
            <LineSeriesChart
              data={monthlyRows}
              series={[{ key: "balance", name: t("reports.columns.balance") }]}
            />
          </ChartContainer>
        </>
      )}
    </div>
  );

  return (
    <>
      {header}
      <Tabs
        label={t("reports.mode.label")}
        appearance="segmented"
        value={mode}
        onValueChange={(m) => {
          setMode(m);
          setOffset(0);
        }}
        items={(["month", "year"] as const).map((m) => ({
          value: m,
          label: t(`reports.mode.${m}`),
          content: panel,
        }))}
      />
    </>
  );
}
