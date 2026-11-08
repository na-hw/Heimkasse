"use client";

import { Check, ChevronDown } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";
import { useFormFieldControl } from "../FormField";
import control from "../shared/control.module.css";
import styles from "./Select.module.css";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SelectProps<T extends string = string> {
  options: readonly SelectOption<T>[];
  value: T | undefined;
  onValueChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  className?: string;
}

/** Single-select dropdown for short, fixed option lists. Use Combobox for long/searchable lists. */
export function Select<T extends string = string>({
  options,
  value,
  onValueChange,
  placeholder,
  disabled,
  id,
  "aria-label": ariaLabel,
  className,
}: SelectProps<T>) {
  const { t } = useTranslation();
  const a11y = useFormFieldControl({ id });
  return (
    <SelectPrimitive.Root value={value} onValueChange={(v) => onValueChange(v as T)} disabled={disabled}>
      <SelectPrimitive.Trigger
        className={cn(control.control, styles.trigger, className)}
        aria-label={ariaLabel}
        data-invalid={a11y["aria-invalid"] ? "true" : undefined}
        {...a11y}
      >
        <SelectPrimitive.Value
          placeholder={<span className={control.placeholder}>{placeholder ?? t("common.selectPlaceholder")}</span>}
        />
        <SelectPrimitive.Icon className={styles.chevron}>
          <ChevronDown size={18} aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className={cn(control.panel, styles.content)} position="popper" sideOffset={6}>
          <SelectPrimitive.Viewport>
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={control.item}
              >
                {option.icon && <span className={styles.icon}>{option.icon}</span>}
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className={styles.check}>
                  <Check size={16} aria-hidden="true" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
