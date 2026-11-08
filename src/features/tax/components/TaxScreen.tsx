"use client";

import { ChevronDown, Plus, Receipt } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Amount,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  StatCard,
} from "@/components/ui";
import { ExportMenu } from "@/features/shared/components/ExportMenu";
import { ListSkeleton } from "@/features/shared/components/ListSkeleton";
import { PeriodNavigator } from "@/features/shared/components/PeriodNavigator";
import list from "@/features/shared/components/EntityList.module.css";
import { useExport } from "@/features/shared/useExport";
import { useTransactionEditor } from "@/features/transactions/editorStore";
import { useAllTransactions } from "@/features/transactions/hooks";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import { useFormat } from "@/lib/i18n/useFormat";
import { cn } from "@/lib/utils/cn";
import { todayIso } from "@/lib/utils/dates";
import { useDocumentTitle } from "@/lib/utils/useDocumentTitle";
import { taxAmount, taxReport } from "../report";
import { buildTaxDocument } from "../taxDocument";
import styles from "./TaxScreen.module.css";

/** Yearly totals per tax category with the underlying bookings and CSV/PDF export. */
export function TaxScreen() {
  const { t, i18n } = useTranslation();
  const format = useFormat();
  const errorMessage = useErrorMessage();
  useDocumentTitle(t("tax.title"));
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const transactions = useAllTransactions();
  const editor = useTransactionEditor();
  const exporter = useExport();
  const report = useMemo(
    () => (transactions.data ? taxReport(transactions.data, year) : undefined),
    [transactions.data, year],
  );
  const yearText = format.date(`${year}-01-01`, "year");

  const toggle = (category: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });

  const exportReport = (kind: "csv" | "pdf") => {
    if (!report) return;
    const doc = buildTaxDocument(
      report,
      t,
      { money: (c) => format.money(c), date: (d) => format.date(d, "medium"), year: yearText },
      {
        footnote: t("export.createdOn", { date: format.date(todayIso(), "medium") }),
        language: i18n.language,
        direction: i18n.dir() === "rtl" ? "rtl" : "ltr",
      },
    );
    void (kind === "csv" ? exporter.exportCsv(doc) : exporter.exportPdf(doc));
  };

  return (
    <>
      <PageHeader
        title={t("tax.title")}
        description={t("tax.description")}
        actions={
          <ExportMenu
            onExport={exportReport}
            pending={exporter.pending}
            disabled={!report || report.categories.length === 0}
          />
        }
      />
      <div className={styles.layout}>
        <PeriodNavigator
          label={t("tax.yearLabel", { year: yearText })}
          previousLabel={t("tax.previous")}
          nextLabel={t("tax.next")}
          currentLabel={t("tax.current")}
          isCurrent={year === currentYear}
          onPrevious={() => setYear((y) => y - 1)}
          onNext={() => setYear((y) => y + 1)}
          onCurrent={() => setYear(currentYear)}
        />
        {transactions.isError ? (
          <ErrorState
            description={errorMessage(transactions.error)}
            onRetry={() => void transactions.refetch()}
          />
        ) : !report ? (
          <Card padding="none">
            <ListSkeleton />
          </Card>
        ) : report.categories.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Receipt />}
              title={t("tax.empty.title")}
              description={t("tax.empty.text")}
              action={
                <Button variant="primary" iconStart={<Plus />} onClick={() => editor.openCreate()}>
                  {t("transactions.add")}
                </Button>
              }
            />
          </Card>
        ) : (
          <>
            <StatCard
              className={styles.total}
              label={t("tax.total")}
              icon={<Receipt />}
              value={<Amount cents={report.total} variant="neutral" size="lg" />}
              hint={t("tax.refundNote")}
            />
            <ul role="list" className={styles.categories}>
              {report.categories.map((c) => {
                const open = expanded.has(c.category);
                const panelId = `tax-${c.category}`;
                return (
                  <li key={c.category}>
                    <Card padding="none">
                      <div className={styles.header}>
                        <div className={list.main}>
                          <h2 className={styles.name}>{t(`taxCategories.${c.category}`)}</h2>
                          <span className={styles.hint}>{t(`tax.hints.${c.category}`)}</span>
                        </div>
                        <div className={styles.sum}>
                          <Amount cents={c.total} variant="neutral" />
                          <span className={list.meta}>
                            {t("tax.count", { count: c.transactions.length })}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={styles.toggle}
                        aria-expanded={open}
                        aria-controls={panelId}
                        onClick={() => toggle(c.category)}
                      >
                        <ChevronDown
                          size={18}
                          aria-hidden="true"
                          className={cn(styles.chevron, open && styles.open)}
                        />
                        {open ? t("tax.hideTransactions") : t("tax.showTransactions")}
                      </button>
                      {open && (
                        <ul role="list" id={panelId} className={list.list}>
                          {c.transactions.map((tx) => (
                            <li key={tx.id}>
                              <button
                                type="button"
                                className={cn(list.row, styles.txButton)}
                                onClick={() => editor.openEdit(tx)}
                              >
                                <span className={list.main}>
                                  <span className={list.title}>
                                    {tx.payee || t(`transactions.types.${tx.type}`)}
                                  </span>
                                  <span className={list.meta}>
                                    {[format.date(tx.date, "medium"), tx.note]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </span>
                                </span>
                                <Amount cents={-taxAmount(tx)} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </Card>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
