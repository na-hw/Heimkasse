"use client";

import { useEffect } from "react";
import { i18n } from "@/lib/i18n/i18n";
import { applyDocumentPreferences, writeBootCache } from "@/lib/preferences/bootCache";
import { usePreferences } from "@/lib/preferences/store";

/** Applies language (i18n, lang, dir) and theme to the document whenever they change. */
export function PreferencesEffects() {
  const language = usePreferences((s) => s.language);
  const theme = usePreferences((s) => s.theme);
  const hydrated = usePreferences((s) => s.hydrated);

  useEffect(() => {
    if (i18n.language !== language) void i18n.changeLanguage(language);
    applyDocumentPreferences({ language, theme });
    if (hydrated) writeBootCache({ language, theme });
  }, [language, theme, hydrated]);

  return null;
}
