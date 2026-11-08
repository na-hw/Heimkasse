import { LANGUAGE_DIRECTION, type Language } from "@/lib/i18n/config";
import type { ThemePreference } from "./types";

/**
 * A tiny copy of language + theme in localStorage, read by an inline script
 * before first paint to avoid a flash of wrong direction/theme.
 * The database stays the source of truth.
 */
export const BOOT_CACHE_KEY = "heimkasse.boot";

export interface BootCache {
  language: Language;
  theme: ThemePreference;
}

export function writeBootCache(cache: BootCache): void {
  try {
    localStorage.setItem(BOOT_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Storage may be unavailable (private mode); the app still works without it.
  }
}

/** Applies language/direction/theme to the <html> element. */
export function applyDocumentPreferences({ language, theme }: BootCache): void {
  const root = document.documentElement;
  root.lang = language;
  root.dir = LANGUAGE_DIRECTION[language];
  if (theme === "system") root.removeAttribute("data-theme");
  else root.dataset.theme = theme;
}

/** Inline script source executed before hydration (kept dependency-free). */
export const BOOT_SCRIPT = `(function(){try{var c=JSON.parse(localStorage.getItem("${BOOT_CACHE_KEY}")||"null");if(!c)return;var r=document.documentElement;if(c.language==="de"||c.language==="fa"){r.lang=c.language;r.dir=c.language==="fa"?"rtl":"ltr";}if(c.theme==="light"||c.theme==="dark")r.dataset.theme=c.theme;}catch(e){}})();`;
