import type { TFunction } from "i18next";

/**
 * Validation messages are stored as translation keys with optional params,
 * encoded as `key` or `key|{"param":1}`. They are translated at render time,
 * so switching language updates visible errors immediately.
 */
export function validationMessage(key: string, params?: Record<string, string | number>): string {
  return params ? `${key}|${JSON.stringify(params)}` : key;
}

/** Translates an encoded validation message; plain text passes through unchanged. */
export function translateValidationMessage(t: TFunction, message: string | undefined): string | undefined {
  if (!message) return undefined;
  const [key = "", rawParams] = message.split("|", 2);
  if (!key.startsWith("validation.")) return message;
  const params = rawParams ? (JSON.parse(rawParams) as Record<string, unknown>) : {};
  return t(key as "validation.required", params);
}
