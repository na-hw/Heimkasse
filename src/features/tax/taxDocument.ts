import type { TFunction } from "i18next";
import { csvAmount, csvDate } from "@/lib/export/csv";
import type { ExportDocument } from "@/lib/export/document";
import { type TaxReport, taxAmount } from "./report";

interface Formatters {
  money: (cents: number) => string;
  date: (iso: string) => string;
  year: string;
}

/** Yearly tax report as export document: totals per category plus every booking. */
export function buildTaxDocument(
  report: TaxReport,
  t: TFunction,
  f: Formatters,
  meta: { footnote: string; language: string; direction: "ltr" | "rtl" },
): ExportDocument {
  const label = (c: TaxReport["categories"][number]["category"]) => t(`taxCategories.${c}`);
  const details = report.categories.flatMap((c) => c.transactions.map((tx) => ({ c, tx })));
  return {
    title: t("tax.title"),
    subtitle: t("tax.yearLabel", { year: f.year }),
    footnote: meta.footnote,
    language: meta.language,
    direction: meta.direction,
    tables: [
      {
        heading: t("tax.total"),
        columns: [
          { header: t("tax.columns.category"), weight: 2 },
          { header: t("tax.columns.count"), align: "end", weight: 0.6 },
          { header: t("tax.columns.amount"), align: "end" },
        ],
        rows: [
          ...report.categories.map((c) => [
            label(c.category),
            String(c.transactions.length),
            f.money(c.total),
          ]),
          [t("tax.total"), "", f.money(report.total)],
        ],
        csvRows: [
          ...report.categories.map((c) => [
            label(c.category),
            String(c.transactions.length),
            csvAmount(c.total),
          ]),
          [t("tax.total"), "", csvAmount(report.total)],
        ],
      },
      {
        heading: t("tax.detailsTitle"),
        columns: [
          { header: t("tax.columns.date"), weight: 0.8 },
          { header: t("tax.columns.category"), weight: 1.3 },
          { header: t("tax.columns.payee"), weight: 1.3 },
          { header: t("tax.columns.note"), weight: 1.3 },
          { header: t("tax.columns.amount"), align: "end" },
        ],
        rows: details.map(({ c, tx }) => [
          f.date(tx.date),
          label(c.category),
          tx.payee ?? "",
          tx.note ?? "",
          f.money(taxAmount(tx)),
        ]),
        csvRows: details.map(({ c, tx }) => [
          csvDate(tx.date),
          label(c.category),
          tx.payee ?? "",
          tx.note ?? "",
          csvAmount(taxAmount(tx)),
        ]),
      },
    ],
  };
}
