import { create } from "zustand";
import { DEFAULT_PREFERENCES, type PreferenceKey, type Preferences } from "./types";

interface PreferencesState extends Preferences {
  /** True once preferences were loaded from storage. */
  hydrated: boolean;
  setAll: (prefs: Preferences) => void;
  set: <K extends PreferenceKey>(key: K, value: Preferences[K]) => void;
}

/**
 * UI-facing preferences (language, theme, digits …). The store gives instant
 * UI updates; persistence happens through the settings repository.
 */
export const usePreferences = create<PreferencesState>((set) => ({
  ...DEFAULT_PREFERENCES,
  hydrated: false,
  setAll: (prefs) => set({ ...prefs, hydrated: true }),
  set: (key, value) => set({ [key]: value } as Partial<PreferencesState>),
}));
