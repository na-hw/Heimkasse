import { z } from "zod";
import { DEFAULT_LANGUAGE, LANGUAGES } from "@/lib/i18n/config";

/** Persisted user preferences (stored as key/value rows in the settings table). */
export const preferencesSchema = z.object({
  language: z.enum(LANGUAGES).default(DEFAULT_LANGUAGE),
  theme: z.enum(["system", "light", "dark"]).default("system"),
  digitStyle: z.enum(["persian", "latin"]).default("persian"),
  calendar: z.enum(["gregorian", "jalali"]).default("gregorian"),
  weekStart: z.number().int().min(0).max(6).default(1),
  currency: z.enum(["EUR", "CHF", "USD", "GBP"]).default("EUR"),
  budgetMonthStartDay: z.number().int().min(1).max(28).default(1),
});

export type Preferences = z.infer<typeof preferencesSchema>;
export type PreferenceKey = keyof Preferences;
export type ThemePreference = Preferences["theme"];

export const DEFAULT_PREFERENCES: Preferences = preferencesSchema.parse({});
export const PREFERENCE_KEYS = Object.keys(preferencesSchema.shape) as PreferenceKey[];
