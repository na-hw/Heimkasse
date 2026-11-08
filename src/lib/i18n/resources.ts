import de from "./locales/de.json";
import fa from "./locales/fa.json";

/** German is the reference shape for translation keys. */
export type TranslationResource = typeof de;

/**
 * Persian must provide exactly the same keys as German.
 * The annotation makes TypeScript fail on any missing key.
 */
const faResource: TranslationResource = fa;

export const resources = {
  de: { translation: de },
  fa: { translation: faResource },
} as const;
