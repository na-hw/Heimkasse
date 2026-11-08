"use client";

import { DropdownMenu as MenuPrimitive } from "radix-ui";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Kbd } from "../Kbd";
import control from "../shared/control.module.css";
import styles from "./DropdownMenu.module.css";

export type MenuEntry =
  | {
      type?: "item";
      id: string;
      label: string;
      icon?: ReactNode;
      onSelect: () => void;
      tone?: "default" | "danger";
      disabled?: boolean;
      shortcut?: string;
    }
  | { type: "separator"; id: string }
  | { type: "label"; id: string; label: string };

export interface DropdownMenuProps {
  /** Usually an IconButton (e.g. "more actions"). */
  trigger: ReactElement;
  items: readonly MenuEntry[];
  align?: "start" | "center" | "end";
}

/** Config-driven action menu with full keyboard support (arrows, typeahead, Escape). */
export function DropdownMenu({ trigger, items, align = "end" }: DropdownMenuProps) {
  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger asChild>{trigger}</MenuPrimitive.Trigger>
      <MenuPrimitive.Portal>
        <MenuPrimitive.Content align={align} sideOffset={6} collisionPadding={16} className={control.panel}>
          {items.map((entry) => {
            if (entry.type === "separator") return <MenuPrimitive.Separator key={entry.id} className={styles.separator} />;
            if (entry.type === "label")
              return (
                <MenuPrimitive.Label key={entry.id} className={styles.label}>
                  {entry.label}
                </MenuPrimitive.Label>
              );
            return (
              <MenuPrimitive.Item
                key={entry.id}
                disabled={entry.disabled}
                onSelect={entry.onSelect}
                className={cn(control.item, entry.tone === "danger" && styles.danger)}
              >
                {entry.icon && (
                  <span className={styles.icon} aria-hidden="true">
                    {entry.icon}
                  </span>
                )}
                <span className={styles.text}>{entry.label}</span>
                {entry.shortcut && <Kbd>{entry.shortcut}</Kbd>}
              </MenuPrimitive.Item>
            );
          })}
        </MenuPrimitive.Content>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  );
}
