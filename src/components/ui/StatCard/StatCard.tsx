"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useFormat } from "@/lib/i18n/useFormat";
import { cn } from "@/lib/utils/cn";
import { Skeleton } from "../Skeleton";
import styles from "./StatCard.module.css";

export interface StatTrend {
  /** Relative change, e.g. 0.12 = +12 %. */
  ratio: number;
  /** Whether an increase is good (income) or bad (expenses). */
  goodWhen: "up" | "down";
  /** Comparison context, e.g. "vs. last month". */
  context?: string;
}

export interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  trend?: StatTrend;
  hint?: ReactNode;
  loading?: boolean;
  className?: string;
}

/** Key figure with optional trend (icon + sign + text, not color alone). */
export function StatCard({ label, value, icon, trend, hint, loading, className }: StatCardProps) {
  const { t } = useTranslation();
  const format = useFormat();
  const direction = !trend || Math.abs(trend.ratio) < 0.005 ? "flat" : trend.ratio > 0 ? "up" : "down";
  const quality = direction === "flat" || !trend ? "neutral" : direction === trend.goodWhen ? "good" : "bad";
  const TrendIcon = direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Minus;
  const percent = trend ? format.percent(Math.abs(trend.ratio), { maximumFractionDigits: 1 }) : "";
  const spoken =
    direction === "up"
      ? t("a11y.trendUp", { value: percent })
      : direction === "down"
        ? t("a11y.trendDown", { value: percent })
        : t("a11y.trendFlat");

  return (
    <div className={cn(styles.card, className)} aria-busy={loading || undefined}>
      <div className={styles.top}>
        <span className={styles.label}>{label}</span>
        {icon && (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <div className={styles.value}>{loading ? <Skeleton width="60%" height="1.6em" /> : value}</div>
      {trend && !loading && (
        <p className={cn(styles.trend, styles[quality])}>
          <TrendIcon size={16} aria-hidden="true" className="flip-rtl" />
          <span aria-hidden="true">
            {direction === "up" ? "+" : direction === "down" ? "−" : ""}
            {percent}
          </span>
          <span className="visually-hidden">{spoken}</span>
          {trend.context && <span className={styles.context}>{trend.context}</span>}
        </p>
      )}
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}
