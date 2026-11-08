export const LANGUAGES = ["de", "fa"] as const;
export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "de";

export type TextDirection = "ltr" | "rtl";

export const LANGUAGE_DIRECTION: Record<Language, TextDirection> = {
  fa: "rtl",
  de: "ltr",
};

/** Language names in their own language (shown in the language switcher). */
export const LANGUAGE_NATIVE_NAME: Record<Language, string> = {
  fa: "فارسی",
  de: "Deutsch",
};

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && (LANGUAGES as readonly string[]).includes(value);
}
