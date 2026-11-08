"use client";

import { useTranslation } from "react-i18next";
import styles from "./AppShell.module.css";

/** App mark + name. */
export function Brand({ compact }: { compact?: boolean }) {
  const { t } = useTranslation();
  return (
    <span className={styles.brand}>
      <span className={styles.brandMark} aria-hidden="true">
        H
      </span>
      <span className={compact ? "visually-hidden" : styles.brandName}>{t("app.name")}</span>
    </span>
  );
}
