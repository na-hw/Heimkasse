import type { Condition } from "@/lib/db/types";
import type { TaxCategory, Transaction, TransactionType } from "./schemas";

export interface TransactionFilters {
  search: string;
  dateFrom: string | null;
  dateTo: string | null;
  accountIds: string[];
  /** Selected categories; subcategories are included automatically by the caller. */
  categoryIds: string[];
  types: TransactionType[];
  amountMin: number | null;
  amountMax: number | null;
  tags: string[];
  taxCategory: TaxCategory | null;
}

export type TransactionSort = "dateDesc" | "dateAsc" | "amountDesc" | "amountAsc";

export const EMPTY_FILTERS: TransactionFilters = {
  search: "",
  dateFrom: null,
  dateTo: null,
  accountIds: [],
  categoryIds: [],
  types: [],
  amountMin: null,
  amountMax: null,
  tags: [],
  taxCategory: null,
};

/** Number of active filters (search is shown separately). */
export function countActiveFilters(f: TransactionFilters): number {
  return [
    f.dateFrom !== null || f.dateTo !== null,
    f.accountIds.length > 0,
    f.categoryIds.length > 0,
    f.types.length > 0,
    f.amountMin !== null || f.amountMax !== null,
    f.tags.length > 0,
    f.taxCategory !== null,
  ].filter(Boolean).length;
}

/** Filters the storage layer can evaluate (indexed / simple comparisons). */
export function toStorageConditions(f: TransactionFilters): Condition[] {
  const where: Condition[] = [];
  if (f.dateFrom) where.push({ field: "date", op: "gte", value: f.dateFrom });
  if (f.dateTo) where.push({ field: "date", op: "lte", value: f.dateTo });
  if (f.types.length) where.push({ field: "type", op: "in", values: f.types });
  if (f.categoryIds.length) where.push({ field: "category_id", op: "in", values: f.categoryIds });
  if (f.amountMin !== null) where.push({ field: "amount_cents", op: "gte", value: f.amountMin });
  if (f.amountMax !== null) where.push({ field: "amount_cents", op: "lte", value: f.amountMax });
  if (f.taxCategory) where.push({ field: "tax_category", op: "eq", value: f.taxCategory });
  return where;
}

export interface SearchContext {
  /** Display names (all languages are fine) used for text search. */
  categoryName: (id: string | null) => string;
  accountName: (id: string | null) => string;
}

/** Filters that need OR logic or derived text (account incl. transfer target, tags, search). */
export function matchesClientFilters(
  tx: Transaction,
  f: TransactionFilters,
  ctx: SearchContext,
): boolean {
  if (f.accountIds.length) {
    const hit =
      f.accountIds.includes(tx.account_id) ||
      (tx.transfer_account_id !== null && f.accountIds.includes(tx.transfer_account_id));
    if (!hit) return false;
  }
  if (f.tags.length && !f.tags.some((tag) => tx.tags.includes(tag))) return false;
  const query = f.search.trim().toLocaleLowerCase();
  if (query) {
    const haystack = [
      tx.payee,
      tx.note,
      ...tx.tags,
      ctx.categoryName(tx.category_id),
      ctx.accountName(tx.account_id),
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();
    if (!query.split(/\s+/).every((word) => haystack.includes(word))) return false;
  }
  return true;
}

/** Stable sort; ties are broken by creation time so new entries appear first. */
export function sortTransactions(
  list: readonly Transaction[],
  sort: TransactionSort,
): Transaction[] {
  const sign = sort === "dateAsc" || sort === "amountAsc" ? 1 : -1;
  return [...list].sort((a, b) => {
    const primary =
      sort === "dateDesc" || sort === "dateAsc"
        ? a.date.localeCompare(b.date)
        : a.amount_cents - b.amount_cents;
    if (primary !== 0) return primary * sign;
    return b.created_at.localeCompare(a.created_at);
  });
}

/** Distinct tags across transactions, alphabetically. */
export function collectTags(list: readonly Pick<Transaction, "tags">[]): string[] {
  return [...new Set(list.flatMap((t) => t.tags))].sort((a, b) => a.localeCompare(b));
}

/** Distinct payees, most frequently used first. */
export function collectPayees(list: readonly Pick<Transaction, "payee">[]): string[] {
  const counts = new Map<string, number>();
  for (const { payee } of list) if (payee) counts.set(payee, (counts.get(payee) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([p]) => p);
}
