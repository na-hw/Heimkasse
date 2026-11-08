"use client";

import { CircleAlert, TriangleAlert } from "lucide-react";
import { Progress } from "radix-ui";
import { type ReactNode, useId } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./ProgressBar.module.css";

export type ProgressTone = "primary" | "success" | "warning" | "danger";

export interface ProgressBarProps {
  /** Current value; may exceed max (e.g. budget overspent). */
  value: number;
  max?: number;
  /** Accessible and visible label. */
  label: ReactNode;
  /** Human-readable value ("120 € of 300 €"), shown and announced. */
  valueText?: string;
  /** Percentage (0–100) at which the bar turns to warning; at ≥100 % it is danger. */
  warnAt?: number;
  /** Fixed tone instead of threshold-based tone. */
  tone?: ProgressTone;
  hideLabel?: boolean;
  className?: string;
}

function toneFor(percent: number, warnAt: number | undefined): ProgressTone {
  if (warnAt === undefined) return "primary";
  if (percent >= 100) return "danger";
  if (percent >= warnAt) return "warning";
  return "success";
}

/** Progress with threshold states that use icons in addition to color. */
export function ProgressBar({
  value,
  max = 100,
  label,
  valueText,
  warnAt,
  tone,
  hideLabel,
  className,
}: ProgressBarProps) {
  const labelId = useId();
  const percent = max > 0 ? (value / max) * 100 : 0;
  const resolvedTone = tone ?? toneFor(percent, warnAt);
  const StateIcon =
    resolvedTone === "danger" ? CircleAlert : resolvedTone === "warning" ? TriangleAlert : null;
  return (
    <div className={cn(styles.wrapper, className)}>
      <div className={cn(styles.meta, hideLabel && "visually-hidden")}>
        <span id={labelId} className={styles.label}>
          {label}
        </span>
        {valueText && (
          <span className={cn(styles.value, styles[`text-${resolvedTone}`])}>
            {StateIcon && <StateIcon size={14} aria-hidden="true" />}
            {valueText}
          </span>
        )}
      </div>
      <Progress.Root
        className={styles.track}
        value={Math.min(value, max)}
        max={max}
        getValueLabel={() => valueText ?? `${Math.round(percent)}%`}
        aria-labelledby={labelId}
      >
        <Progress.Indicator
          className={cn(styles.indicator, styles[resolvedTone])}
          style={{ inlineSize: `${Math.min(percent, 100)}%` }}
        />
      </Progress.Root>
    </div>
  );
}
