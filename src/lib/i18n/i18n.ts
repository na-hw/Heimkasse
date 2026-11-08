import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LANGUAGE } from "./config";
import { resources } from "./resources";

/**
 * Single i18next instance. Resources are bundled and initialization is
 * synchronous, so switching languages is instant and works offline.
 */
export const i18n = i18next.createInstance();

void i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: "de",
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  returnNull: false,
  initAsync: false,
});
