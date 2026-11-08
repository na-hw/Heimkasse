"use client";

import { Command } from "cmdk";
import { Search } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { ReactNode } from "react";
import { Kbd } from "../Kbd";
import control from "../shared/control.module.css";
import styles from "./CommandPalette.module.css";

export interface CommandItem {
  id: string;
  label: string;
  icon?: ReactNode;
  keywords?: string[];
  shortcut?: string;
  onSelect: () => void;
}

export interface CommandGroup {
  id: string;
  heading: string;
  items: CommandItem[];
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: readonly CommandGroup[];
  /** Accessible dialog title. */
  title: string;
  placeholder: string;
  emptyText: string;
}

/** Keyboard-first launcher for navigation and actions (Cmd/Ctrl+K). */
export function CommandPalette({ open, onOpenChange, groups, title, placeholder, emptyText }: CommandPaletteProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={styles.overlay} />
        <DialogPrimitive.Content className={styles.content} aria-describedby={undefined}>
          <DialogPrimitive.Title className="visually-hidden">{title}</DialogPrimitive.Title>
          <Command label={title} className={styles.command} loop>
            <div className={styles.searchRow}>
              <Search size={18} aria-hidden="true" className={styles.searchIcon} />
              <Command.Input placeholder={placeholder} className={styles.search} />
            </div>
            <Command.List className={styles.list}>
              <Command.Empty className={styles.empty}>{emptyText}</Command.Empty>
              {groups.map((group) => (
                <Command.Group key={group.id} heading={group.heading} className={styles.group}>
                  {group.items.map((item) => (
                    <Command.Item
                      key={item.id}
                      value={item.id}
                      keywords={[item.label, ...(item.keywords ?? [])]}
                      onSelect={() => {
                        onOpenChange(false);
                        item.onSelect();
                      }}
                      className={control.item}
                    >
                      {item.icon && (
                        <span className={styles.icon} aria-hidden="true">
                          {item.icon}
                        </span>
                      )}
                      <span className={styles.label}>{item.label}</span>
                      {item.shortcut && <Kbd>{item.shortcut}</Kbd>}
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
            </Command.List>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
