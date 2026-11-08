import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./Badge.module.css";

export type BadgeTone = "neutral" | "primary" | "success" | "danger" | "warning" | "info";

export interface BadgeProps {
  tone?: BadgeTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Small status label. Always include text – never rely on color alone. */
export function Badge({ tone = "neutral", icon, children, className }: BadgeProps) {
  return (
    <span className={cn(styles.badge, styles[tone], className)}>
      {icon && (
        <span aria-hidden="true" className={styles.icon}>
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}
