import type { Transaction } from "@/features/transactions/schemas";
import type { Account } from "./schemas";

/**
 * Signed effect of a transaction on one account, in cents.
 * Income +, expense −, transfer − on the source and + on the target account.
 */
export function effectOnAccount(
  tx: Pick<Transaction, "type" | "amount_cents" | "account_id" | "transfer_account_id">,
  accountId: string,
): number {
  if (tx.type === "transfer") {
    if (tx.account_id === accountId) return -tx.amount_cents;
    if (tx.transfer_account_id === accountId) return tx.amount_cents;
    return 0;
  }
  if (tx.account_id !== accountId) return 0;
  return tx.type === "income" ? tx.amount_cents : -tx.amount_cents;
}

/** Current balance per account: initial balance + all active transactions. */
export function computeBalances(
  accounts: readonly Pick<Account, "id" | "initial_balance_cents">[],
  transactions: readonly Pick<Transaction, "type" | "amount_cents" | "account_id" | "transfer_account_id">[],
): Map<string, number> {
  const balances = new Map(accounts.map((a) => [a.id, a.initial_balance_cents]));
  for (const tx of transactions) {
    for (const id of [tx.account_id, tx.transfer_account_id]) {
      if (id && balances.has(id)) balances.set(id, (balances.get(id) ?? 0) + effectOnAccount(tx, id));
      if (tx.type !== "transfer") break;
    }
  }
  return balances;
}

/** Sum of balances of the given accounts. */
export function totalBalance(balances: Map<string, number>, accountIds: readonly string[]): number {
  return accountIds.reduce((sum, id) => sum + (balances.get(id) ?? 0), 0);
}
