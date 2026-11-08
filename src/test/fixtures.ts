import type { TFunction } from "i18next";
import type { Transaction } from "@/features/transactions/schemas";

/** Translation stub: returns the key, plus `:count` / `{param}` values for assertions. */
export const fakeT = ((key: string, opts?: Record<string, unknown>) => {
  if (!opts) return key;
  const params = Object.entries(opts)
    .map(([k, v]) => `${k}=${String(v)}`)
    .join(",");
  return `${key}(${params})`;
}) as unknown as TFunction;

/** A complete transaction with sensible defaults. */
export const makeTransaction = (over: Partial<Transaction> = {}): Transaction => ({
  id: crypto.randomUUID(),
  created_at: "2026-11-08T10:00:00.000Z",
  updated_at: "2026-11-08T10:00:00.000Z",
  deleted_at: null,
  account_id: "11111111-1111-4111-8111-111111111111",
  category_id: null,
  type: "expense",
  amount_cents: 1000,
  date: "2026-03-01",
  payee: null,
  note: null,
  payment_method: null,
  tags: [],
  tax_category: null,
  recurring_rule_id: null,
  transfer_account_id: null,
  import_hash: null,
  ...over,
});
