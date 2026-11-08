"use client";

import { Command } from "cmdk";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { type ReactNode, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";
import { useFormFieldControl } from "../FormField";
import control from "../shared/control.module.css";
import styles from "./Combobox.module.css";

export interface ComboboxOption {
  value: string;
  label: string;
  /** Extra search terms (e.g. German + Persian names). */
  keywords?: string[];
  icon?: ReactNode;
  /** Optional group heading. */
  group?: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  options: readonly ComboboxOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

function groupOptions(options: readonly ComboboxOption[]): Array<[string, ComboboxOption[]]> {
  const groups = new Map<string, ComboboxOption[]>();
  for (const option of options) {
    const key = option.group ?? "";
    groups.set(key, [...(groups.get(key) ?? []), option]);
  }
  return [...groups.entries()];
}

/** Searchable single select for long lists (categories, accounts, payees). */
export function Combobox({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled,
  id,
  className,
}: ComboboxProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const listId = useId();
  const a11y = useFormFieldControl({ id });
  const selected = options.find((o) => o.value === value);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-haspopup="listbox"
        disabled={disabled}
        className={cn(control.control, styles.trigger, className)}
        data-invalid={a11y["aria-invalid"] ? "true" : undefined}
        {...a11y}
      >
        <span className={cn(styles.value, !selected && control.placeholder)}>
          {selected?.icon}
          {selected?.label ?? placeholder ?? t("common.selectPlaceholder")}
        </span>
        <ChevronsUpDown size={16} aria-hidden="true" className={styles.chevron} />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className={cn(control.panel, styles.panel)}
          sideOffset={6}
          align="start"
          collisionPadding={16}
        >
          <Command className={styles.command}>
            <Command.Input
              autoFocus
              placeholder={searchPlaceholder ?? t("combobox.search")}
              className={styles.search}
            />
            <Command.List id={listId} className={styles.list}>
              <Command.Empty className={styles.empty}>
                {emptyText ?? t("combobox.empty")}
              </Command.Empty>
              {groupOptions(options).map(([group, items]) => (
                <Command.Group
                  key={group || "default"}
                  heading={group || undefined}
                  className={styles.group}
                >
                  {items.map((option) => (
                    <Command.Item
                      key={option.value}
                      value={option.value}
                      keywords={[option.label, ...(option.keywords ?? [])]}
                      disabled={option.disabled}
                      onSelect={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                      className={control.item}
                    >
                      {option.icon}
                      <span className={styles.label}>{option.label}</span>
                      {option.value === value && (
                        <Check size={16} aria-hidden="true" className={styles.check} />
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
            </Command.List>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
