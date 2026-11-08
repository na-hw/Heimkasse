import { create } from "zustand";
import { EMPTY_FILTERS, type TransactionFilters, type TransactionSort } from "./filters";

interface FiltersState {
  filters: TransactionFilters;
  sort: TransactionSort;
  setFilter: <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) => void;
  setSort: (sort: TransactionSort) => void;
  reset: () => void;
}

/** UI state of the transaction list (kept while navigating between pages). */
export const useTransactionFilters = create<FiltersState>((set) => ({
  filters: EMPTY_FILTERS,
  sort: "dateDesc",
  setFilter: (key, value) => set((s) => ({ filters: { ...s.filters, [key]: value } })),
  setSort: (sort) => set({ sort }),
  reset: () => set((s) => ({ filters: { ...EMPTY_FILTERS, search: s.filters.search } })),
}));
