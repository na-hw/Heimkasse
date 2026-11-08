"use client";

import { useTranslation } from "react-i18next";
import styles from "./AppShell.module.css";

/** First focusable element: jumps past navigation to the main content. */
export function SkipLink() {
  const { t } = useTranslation();
  return (
    <a href="#main" className={styles.skipLink}>
      {t("nav.skipToContent")}
    </a>
  );
}
