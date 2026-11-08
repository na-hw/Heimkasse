/**
 * Color keys for user-colorable entities (accounts, categories, goals).
 * Stored as keys – not hex – so each key maps to a theme-aware CSS variable
 * (`--swatch-<key>`) with sufficient contrast in light and dark mode.
 */
export const COLOR_KEYS = [
  "teal",
  "green",
  "olive",
  "amber",
  "orange",
  "red",
  "pink",
  "purple",
  "indigo",
  "blue",
  "cyan",
  "gray",
] as const;

export type ColorKey = (typeof COLOR_KEYS)[number];
