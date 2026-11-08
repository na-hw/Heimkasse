"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./Fab.module.css";

export interface FabProps extends Omit<ComponentPropsWithRef<"button">, "children"> {
  label: string;
  icon: ReactNode;
}

/** Floating primary action for phones; sits above the bottom navigation and safe area. */
export function Fab({ label, icon, className, type = "button", ...props }: FabProps) {
  return (
    <button type={type} aria-label={label} className={cn(styles.fab, className)} {...props}>
      <span aria-hidden="true" className={styles.icon}>
        {icon}
      </span>
    </button>
  );
}
