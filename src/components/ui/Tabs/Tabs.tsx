"use client";

import { Tabs as TabsPrimitive } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./Tabs.module.css";

export interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  content: ReactNode;
}

export interface TabsProps<T extends string> {
  items: readonly TabItem<T>[];
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  /** Accessible name for the tab list. */
  label: string;
  /** "segmented" renders a compact toggle-like control. */
  appearance?: "underline" | "segmented";
  className?: string;
}

/** Tabs with roving focus (arrow keys) and automatic RTL handling. */
export function Tabs<T extends string>({
  items,
  value,
  defaultValue,
  onValueChange,
  label,
  appearance = "underline",
  className,
}: TabsProps<T>) {
  return (
    <TabsPrimitive.Root
      value={value}
      defaultValue={defaultValue ?? items[0]?.value}
      onValueChange={(v) => onValueChange?.(v as T)}
      className={cn(styles.root, className)}
    >
      <TabsPrimitive.List aria-label={label} className={cn(styles.list, styles[appearance])}>
        {items.map((item) => (
          <TabsPrimitive.Trigger key={item.value} value={item.value} className={styles.trigger}>
            {item.icon && <span aria-hidden="true">{item.icon}</span>}
            {item.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {items.map((item) => (
        <TabsPrimitive.Content key={item.value} value={item.value} className={styles.content}>
          {item.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}
