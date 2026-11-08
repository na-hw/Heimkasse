import { create } from "zustand";

interface AnnouncerState {
  polite: string;
  assertive: string;
  announce: (message: string, politeness?: "polite" | "assertive") => void;
}

/**
 * Screen-reader announcements for changes without a toast
 * (e.g. "3 rows selected", "Filters applied").
 */
export const useAnnouncer = create<AnnouncerState>((set) => ({
  polite: "",
  assertive: "",
  announce: (message, politeness = "polite") => {
    // Clear first so repeating the same message is announced again.
    set({ [politeness]: "" } as Pick<AnnouncerState, "polite">);
    setTimeout(() => set({ [politeness]: message } as Pick<AnnouncerState, "polite">), 50);
  },
}));

export const announce = (message: string, politeness?: "polite" | "assertive") =>
  useAnnouncer.getState().announce(message, politeness);
