"use client";

import "@/styles/globals.css";
import { i18n } from "@/lib/i18n/i18n";

/**
 * Last-resort boundary when the root layout itself fails. Providers are not
 * available here, so it uses the i18n instance directly.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  const t = i18n.t.bind(i18n);
  const lang = i18n.language === "fa" ? "fa" : "de";
  return (
    <html lang={lang} dir={lang === "fa" ? "rtl" : "ltr"}>
      <body>
        <main
          style={{
            display: "grid",
            placeItems: "center",
            minBlockSize: "100dvh",
            gap: "1rem",
            padding: "1rem",
          }}
        >
          <h1>{t("errors.title")}</h1>
          <p>{t("errors.routeDescription")}</p>
          <button type="button" onClick={reset} style={{ minBlockSize: 44, paddingInline: 16 }}>
            {t("common.retry")}
          </button>
        </main>
      </body>
    </html>
  );
}
