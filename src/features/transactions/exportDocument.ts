import type { TFunction } from "i18next";
import { csvAmount, csvDate } from "@/lib/export/csv";
import type { ExportDocument, ExportTable } from "@/lib/export/document";
import type { Transaction } from "./schemas";

interface Lookups {
  money: (cents: number) => string;
  date: (iso: string) => string;
  accountName: (id: string | null) => string;
  categoryName: (id: string | null) => string;
}

/** Signed amount: income +, expense −, transfers unsigned. */
export const signedCents = (tx: Pick<Transaction, "type" | "amount_cents">) =>
  tx.type === "expense" ? -tx.amount_cents : tx.amount_cents;

/** Every field of the given transactions as a flat table (CSV). */
export function transactionsCsvTable(
  transactions: readonly Transaction[],
  t: TFunction,
  l: Lookups,
): ExportTable {
  return {
    heading: t("transactions.title"),
    columns: [
      { header: t("transactions.fields.date") },
      { header: t("transactions.fields.type") },
      { header: t("transactions.fields.amount"), align: "end" },
      { header: t("transactions.fields.account") },
      { header: t("transactions.fields.toAccount") },
      { header: t("transactions.fields.category") },
      { header: t("transactions.fields.payee") },
      { header: t("transactions.fields.note") },
      { header: t("transactions.fields.paymentMethod") },
      { header: t("transactions.fields.tags") },
      { header: t("transactions.fields.taxCategory") },
    ],
    rows: transactions.map((tx) => [
      csvDate(tx.date),
      t(`transactions.types.${tx.type}`),
      csvAmount(signedCents(tx)),
      l.accountName(tx.account_id),
      tx.type === "transfer" ? l.accountName(tx.transfer_account_id) : "",
      tx.type === "transfer" ? "" : l.categoryName(tx.category_id),
      tx.payee ?? "",
      tx.note ?? "",
      tx.payment_method ? t(`paymentMethods.${tx.payment_method}`) : "",
      tx.tags.join(", "),
      tx.tax_category ? t(`taxCategories.${tx.tax_category}`) : "",
    ]),
  };
}

/** Compact, printable list (PDF). */
export function transactionsDocument(
  transactions: readonly Transaction[],
  t: TFunction,
  l: Lookups,
  meta: { subtitle: string; footnote: string; language: string; direction: "ltr" | "rtl" },
): ExportDocument {
  return {
    title: t("transactions.title"),
    subtitle: meta.subtitle,
    footnote: meta.footnote,
    language: meta.language,
    direction: meta.direction,
    tables: [
      {
        heading: t("transactions.count", { count: transactions.length }),
        columns: [
          { header: t("transactions.fields.date"), weight: 0.9 },
          { header: t("transactions.fields.payee"), weight: 1.6 },
          { header: t("transactions.fields.category"), weight: 1.3 },
          { header: t("transactions.fields.account"), weight: 1.1 },
          { header: t("transactions.fields.amount"), align: "end" },
        ],
        rows: transactions.map((tx) => [
          l.date(tx.date),
          tx.payee ?? "",
          tx.type === "transfer"
            ? `${t("transactions.types.transfer")} → ${l.accountName(tx.transfer_account_id)}`
            : l.categoryName(tx.category_id),
          l.accountName(tx.account_id),
          l.money(signedCents(tx)),
        ]),
      },
    ],
  };
}
