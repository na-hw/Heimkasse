"use client";

import { CircleAlert, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";
import { Button } from "../Button";
import styles from "./ErrorState.module.css";

export interface ErrorStateProps {
  title?: ReactNode;
  /** User-friendly explanation (see useErrorMessage). */
  description?: ReactNode;
  onRetry?: () => void;
  retrying?: boolean;
  /** Technical details, collapsed by default. */
  details?: string;
  className?: string;
}

/** Error state with retry. Announced to screen readers via role="alert". */
export function ErrorState({ title, description, onRetry, retrying, details, className }: ErrorStateProps) {
  const { t } = useTranslation();
  return (
    <div className={cn(styles.error, className)} role="alert">
      <span className={styles.icon} aria-hidden="true">
        <CircleAlert />
      </span>
      <h2 className={styles.title}>{title ?? t("errors.title")}</h2>
      {description && <p className={styles.description}>{description}</p>}
      {onRetry && (
        <Button variant="secondary" iconStart={<RotateCcw />} onClick={onRetry} loading={retrying}>
          {t("common.retry")}
        </Button>
      )}
      {details && (
        <details className={styles.details}>
          <summary>{t("errors.details")}</summary>
          <pre dir="ltr" className="selectable">
            {details}
          </pre>
        </details>
      )}
    </div>
  );
}
