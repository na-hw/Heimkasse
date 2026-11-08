"use client";

import { useTranslation } from "react-i18next";
import { useAccounts } from "@/features/accounts/hooks";
import { useCategoryLookup } from "@/features/categories/hooks";
import { ExportMenu } from "@/features/shared/components/ExportMenu";
import { useExport } from "@/features/shared/useExport";
import { tableToCsv } from "@/lib/export/document";
import { useFormat } from "@/lib/i18n/useFormat";
import { todayIso } from "@/lib/utils/dates";
import { transactionsCsvTable, transactionsDocument } from "../exportDocument";
import type { Transaction } from "../schemas";

interface Props {
  /** The currently shown (filtered and sorted) transactions. */
  transactions: readonly Transaction[];
  isFiltered: boolean;
}

/** Exports the visible transaction list as CSV (all fields) or PDF (compact). */
export function TransactionsExportMenu({ transactions, isFiltered }: Props) {
  const { t, i18n } = useTranslation();
  const format = useFormat();
  const accounts = useAccounts();
  const categories = useCategoryLookup();
  const exporter = useExport();

  const run = (kind: "csv" | "pdf") => {
    const accountById = new Map((accounts.data?.all ?? []).map((a) => [a.id, a.name]));
    const lookups = {
      money: (c: number) => format.money(c, { signDisplay: "exceptZero" }),
      date: (d: string) => format.date(d, "medium"),
      accountName: (id: string | null) => (id ? (accountById.get(id) ?? "") : ""),
      categoryName: categories.name,
    };
    const doc = transactionsDocument(transactions, t, lookups, {
      subtitle: t(isFiltered ? "transactions.export.filtered" : "transactions.export.all"),
      footnote: t("export.createdOn", { date: format.date(todayIso(), "medium") }),
      language: i18n.language,
      direction: i18n.dir() === "rtl" ? "rtl" : "ltr",
    });
    if (kind === "csv")
      void exporter.exportCsv(doc, tableToCsv(transactionsCsvTable(transactions, t, lookups)));
    else void exporter.exportPdf(doc);
  };

  return (
    <ExportMenu onExport={run} pending={exporter.pending} disabled={transactions.length === 0} />
  );
}
