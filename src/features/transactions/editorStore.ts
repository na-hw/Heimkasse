import { create } from "zustand";
import type { Transaction, TransactionCreate } from "./schemas";

export type EditorMode = "create" | "edit" | "duplicate";

interface EditorState {
  open: boolean;
  mode: EditorMode;
  transaction: Transaction | null;
  defaults: Partial<TransactionCreate>;
  openCreate: (defaults?: Partial<TransactionCreate>) => void;
  openEdit: (transaction: Transaction) => void;
  openDuplicate: (transaction: Transaction) => void;
  close: () => void;
}

/** Controls the single, app-wide transaction dialog (⌘N, "+" button, edit from lists). */
export const useTransactionEditor = create<EditorState>((set) => ({
  open: false,
  mode: "create",
  transaction: null,
  defaults: {},
  openCreate: (defaults = {}) => set({ open: true, mode: "create", transaction: null, defaults }),
  openEdit: (transaction) => set({ open: true, mode: "edit", transaction, defaults: {} }),
  openDuplicate: (transaction) => set({ open: true, mode: "duplicate", transaction, defaults: {} }),
  close: () => set({ open: false }),
}));
