import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { i18n } from "@/lib/i18n/i18n";
import type { Language } from "@/lib/i18n/config";
import { usePreferences } from "@/lib/preferences/store";
import { DEFAULT_PREFERENCES } from "@/lib/preferences/types";

/** Renders with i18n and preferences for the given language (default German). */
export function renderWithProviders(
  ui: ReactElement,
  { language = "de", ...options }: RenderOptions & { language?: Language } = {},
) {
  usePreferences.getState().setAll({ ...DEFAULT_PREFERENCES, language, digitStyle: "persian" });
  void i18n.changeLanguage(language);
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  );
  return render(ui, { wrapper: Wrapper, ...options });
}
