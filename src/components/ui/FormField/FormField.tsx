"use client";

import { type ReactNode, useId, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";
import { translateValidationMessage } from "@/lib/validation/messages";
import { FormFieldContext } from "./FormFieldContext";
import styles from "./FormField.module.css";

export interface FormFieldProps {
  label: ReactNode;
  /** Helper text shown below the control. */
  hint?: ReactNode;
  /** Error message or encoded validation key (see lib/validation/messages). */
  error?: string;
  required?: boolean;
  /** Shows "(optional)" after the label for non-required fields. */
  showOptional?: boolean;
  /** Visually hide the label (still announced to screen readers). */
  hideLabel?: boolean;
  id?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Label + control + hint + error. Controls inside pick up id and ARIA
 * wiring automatically via useFormFieldControl.
 */
export function FormField({
  label,
  hint,
  error,
  required = false,
  showOptional = false,
  hideLabel = false,
  id,
  className,
  children,
}: FormFieldProps) {
  const { t } = useTranslation();
  const autoId = useId();
  const controlId = id ?? `field-${autoId}`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const message = translateValidationMessage(t, error);

  const context = useMemo(
    () => ({
      id: controlId,
      describedBy: [hintId, errorId].filter(Boolean).join(" ") || undefined,
      invalid: Boolean(error),
      required,
    }),
    [controlId, hintId, errorId, error, required],
  );

  return (
    <div className={cn(styles.field, className)}>
      <label htmlFor={controlId} className={cn(styles.label, hideLabel && "visually-hidden")}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
        {!required && showOptional && <span className={styles.optional}>({t("common.optional")})</span>}
      </label>
      <FormFieldContext.Provider value={context}>{children}</FormFieldContext.Provider>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {message && (
        <p id={errorId} className={styles.error}>
          <span aria-hidden="true">⚠</span>
          {message}
        </p>
      )}
    </div>
  );
}
