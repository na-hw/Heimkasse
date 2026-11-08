import {
  TAX_CATEGORIES,
  type TaxCategory,
  type Transaction,
} from "@/features/transactions/schemas";
import { inRange, yearRange } from "@/lib/utils/period";

export interface TaxCategoryTotal {
  category: TaxCategory;
  /** Expenses minus refunds (income with the same tax category). */
  total: number;
  transactions: Transaction[];
}

export interface TaxReport {
  year: number;
  categories: TaxCategoryTotal[];
  total: number;
}

/** Signed tax-relevant amount: expenses count, refunds (income) reduce. */
export const taxAmount = (tx: Pick<Transaction, "type" | "amount_cents">) =>
  tx.type === "expense" ? tx.amount_cents : tx.type === "income" ? -tx.amount_cents : 0;

/** Totals per tax category for a calendar year (only categories with bookings, in fixed order). */
export function taxReport(transactions: readonly Transaction[], year: number): TaxReport {
  const range = yearRange(year);
  const groups = new Map<TaxCategory, Transaction[]>();
  for (const tx of transactions) {
    if (!tx.tax_category || tx.type === "transfer" || !inRange(tx.date, range)) continue;
    groups.set(tx.tax_category, [...(groups.get(tx.tax_category) ?? []), tx]);
  }
  const categories = TAX_CATEGORIES.filter((c) => groups.has(c)).map((category) => {
    const txs = (groups.get(category) ?? []).sort((a, b) => a.date.localeCompare(b.date));
    return { category, transactions: txs, total: txs.reduce((s, tx) => s + taxAmount(tx), 0) };
  });
  return { year, categories, total: categories.reduce((s, c) => s + c.total, 0) };
}
