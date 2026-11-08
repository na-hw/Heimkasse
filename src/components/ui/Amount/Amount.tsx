"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFormat } from "@/lib/i18n/useFormat";
import { cn } from "@/lib/utils/cn";
import styles from "./Amount.module.css";

export interface AmountProps {
  /** Signed amount in cents: positive = income, negative = expense. */
  cents: number;
  /** "signed" colors by sign and shows +/−; "neutral" for balances/totals. */
  variant?: "signed" | "neutral";
  /** Show an arrow icon in addition to sign and color. */
  withIcon?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  /**
   * Inside an element that already names the amount (e.g. a row button's
   * aria-label): render only the visible value, no extra screen-reader text.
   */
  decorative?: boolean;
  className?: string;
}

/**
 * Money amount with tabular digits. Income/expense are distinguished by
 * sign, optional icon and color – and read as "minus 45 euros" by screen readers.
 */
export function Amount({
  cents,
  variant = "signed",
  withIcon = false,
  size = "md",
  decorative = false,
  className,
}: AmountProps) {
  const { t } = useTranslation();
  const format = useFormat();
  const signed = variant === "signed";
  const visible = format.money(cents, { signDisplay: signed ? "exceptZero" : "auto" });
  const absolute = format.money(Math.abs(cents));
  const spoken =
    cents < 0
      ? t("amount.spokenNegative", { value: absolute })
      : signed && cents > 0
        ? t("amount.spokenPositive", { value: absolute })
        : absolute;
  const direction = cents > 0 ? "income" : cents < 0 ? "expense" : "zero";
  const Icon = cents >= 0 ? ArrowDownLeft : ArrowUpRight;

  return (
    <span className={cn(styles.amount, styles[size], signed && styles[direction], className)}>
      {withIcon && direction !== "zero" && <Icon className={styles.icon} aria-hidden="true" />}
      <span aria-hidden={decorative ? undefined : "true"} className={styles.value}>
        {visible}
      </span>
      {!decorative && <span className="visually-hidden">{spoken}</span>}
    </span>
  );
}
