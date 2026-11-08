import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface UiState {
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  /** Smart default for new transactions. */
  lastAccountId: string | null;
  setLastAccountId: (id: string) => void;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

/** UI state. Sidebar state and last used account are remembered per device. */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      commandPaletteOpen: false,
      lastAccountId: null,
      setLastAccountId: (id) => set({ lastAccountId: id }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
    }),
    {
      name: "heimkasse.ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed, lastAccountId: s.lastAccountId }),
    },
  ),
);
