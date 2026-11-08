"use client";

import { useTranslation } from "react-i18next";
import { Spinner } from "@/components/ui";
import styles from "./Splash.module.css";

/** Neutral loading screen while storage and preferences initialize. */
export function Splash() {
  const { t } = useTranslation();
  return (
    <div className={styles.splash} role="status" aria-live="polite">
      <span className={styles.logo} aria-hidden="true">
        ک
      </span>
      <Spinner size={20} />
      <span className="visually-hidden">{t("app.loading")}</span>
    </div>
  );
}
