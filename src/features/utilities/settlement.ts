import type { Category } from "@/features/categories/schemas";
import { withDescendants } from "@/features/categories/tree";
import type { TxLike } from "@/features/reports/aggregate";
import { inRange, yearRange } from "@/lib/utils/period";

/** Name key of the built-in "Nebenkosten" category. */
export const UTILITIES_CATEGORY_KEY = "categories.builtin.utilities";

/** Total prepaid in a settlement year (12 monthly prepayments). */
export const prepaidTotal = (monthlyCents: number) => monthlyCents * 12;

/** Positive = refund (Guthaben), negative = back-payment (Nachzahlung). */
export const settlementResult = (monthlyCents: number, actualCents: number) =>
  prepaidTotal(monthlyCents) - actualCents;

/** Monthly prepayment that would have covered the actual costs, rounded up to whole euros. */
export const suggestedPrepayment = (actualCents: number) => Math.ceil(actualCents / 12 / 100) * 100;

/** Expenses booked in the built-in Nebenkosten category (incl. subcategories) in a year. */
export function bookedUtilities(
  txs: readonly TxLike[],
  categories: readonly Category[],
  year: number,
): number {
  const root = categories.find((c) => c.name_key === UTILITIES_CATEGORY_KEY);
  if (!root) return 0;
  const ids = new Set(withDescendants(categories, root.id));
  const range = yearRange(year);
  return txs.reduce(
    (sum, tx) =>
      tx.type === "expense" && tx.category_id && ids.has(tx.category_id) && inRange(tx.date, range)
        ? sum + tx.amount_cents
        : sum,
    0,
  );
}
