import type { QueryClient } from "@tanstack/react-query";

/** Central query keys. Data is local, so after any write all data queries are refreshed. */
export const queryKeys = {
  accounts: ["accounts"] as const,
  balances: ["accounts", "balances"] as const,
  categories: ["categories"] as const,
  transactions: ["transactions"] as const,
  transactionList: (storageFilters: unknown) => ["transactions", "list", storageFilters] as const,
  transactionMeta: ["transactions", "meta"] as const,
  allTransactions: ["transactions", "all"] as const,
  budgets: ["budgets"] as const,
  contracts: ["contracts"] as const,
  meters: ["meters"] as const,
  settlements: ["settlements"] as const,
  goals: ["goals"] as const,
  recurring: ["recurring"] as const,
  trash: ["trash"] as const,
  overview: ["overview"] as const,
};

const DATA_KEYS = [
  queryKeys.accounts,
  queryKeys.categories,
  queryKeys.transactions,
  queryKeys.recurring,
  queryKeys.budgets,
  queryKeys.contracts,
  queryKeys.meters,
  queryKeys.settlements,
  queryKeys.goals,
  queryKeys.trash,
  queryKeys.overview,
];

/** Refreshes every data query (cheap: all data is local). */
export function invalidateData(queryClient: QueryClient): Promise<void> {
  return Promise.all(DATA_KEYS.map((queryKey) => queryClient.invalidateQueries({ queryKey }))).then(
    () => undefined,
  );
}
