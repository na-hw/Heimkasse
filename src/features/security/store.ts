import { create } from "zustand";

interface LockState {
  /** Unlocked in this app session (memory only – every start begins locked). */
  unlocked: boolean;
  unlock: () => void;
  lock: () => void;
}

export const useLockStore = create<LockState>((set) => ({
  unlocked: false,
  unlock: () => set({ unlocked: true }),
  lock: () => set({ unlocked: false }),
}));
