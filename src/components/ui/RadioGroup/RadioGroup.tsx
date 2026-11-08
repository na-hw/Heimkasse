"use client";

import { RadioGroup as RadioPrimitive } from "radix-ui";
import { type ReactNode, useId } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./RadioGroup.module.css";

export interface RadioOption<T extends string> {
  value: T;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps<T extends string> {
  /** Group label, used as the accessible name. */
  label: ReactNode;
  options: readonly RadioOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  orientation?: "horizontal" | "vertical";
  /** "cards" renders options as selectable tiles. */
  appearance?: "list" | "cards";
  hint?: ReactNode;
  className?: string;
}

/** Single choice from a small set of visible options. Arrow keys move the selection. */
export function RadioGroup<T extends string>({
  label,
  options,
  value,
  onValueChange,
  orientation = "vertical",
  appearance = "list",
  hint,
  className,
}: RadioGroupProps<T>) {
  const id = useId();
  const labelId = `rg-${id}-label`;
  const hintId = hint ? `rg-${id}-hint` : undefined;
  return (
    <div className={cn(styles.group, className)}>
      <span id={labelId} className={styles.groupLabel}>
        {label}
      </span>
      <RadioPrimitive.Root
        aria-labelledby={labelId}
        aria-describedby={hintId}
        orientation={orientation}
        value={value}
        onValueChange={(v) => onValueChange(v as T)}
        className={cn(styles.options, styles[orientation], styles[appearance])}
      >
        {options.map((option) => (
          // The label wraps the radio, so the whole option (tile) is clickable.
          <label key={option.value} className={styles.option} data-disabled={option.disabled || undefined}>
            <RadioPrimitive.Item value={option.value} disabled={option.disabled} className={styles.radio}>
              <RadioPrimitive.Indicator className={styles.indicator} />
            </RadioPrimitive.Item>
            <span className={styles.optionLabel}>
              <span>{option.label}</span>
              {option.description && <span className={styles.description}>{option.description}</span>}
            </span>
          </label>
        ))}
      </RadioPrimitive.Root>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  );
}
