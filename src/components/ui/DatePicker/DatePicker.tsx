"use client";

import { CalendarDays, X } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFormat } from "@/lib/i18n/useFormat";
import { cn } from "@/lib/utils/cn";
import { parseIsoDate, toIsoDate } from "@/lib/utils/dates";
import { useFormFieldControl } from "../FormField";
import control from "../shared/control.module.css";
import { Calendar } from "./Calendar";
import styles from "./DatePicker.module.css";

export interface DatePickerProps {
  /** ISO date `YYYY-MM-DD` or null. */
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  /** Show a button to clear the date. */
  clearable?: boolean;
  min?: string;
  max?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/** Date field with a popover calendar. Stores ISO dates; displays them per locale/calendar. */
export function DatePicker({ value, onChange, placeholder, clearable, min, max, disabled, id, className }: DatePickerProps) {
  const { t } = useTranslation();
  const format = useFormat();
  const [open, setOpen] = useState(false);
  const a11y = useFormFieldControl({ id });
  const selected = value ? parseIsoDate(value) : undefined;

  return (
    <div className={cn(styles.wrapper, className)}>
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger
          className={cn(control.control, styles.trigger)}
          disabled={disabled}
          aria-haspopup="dialog"
          data-invalid={a11y["aria-invalid"] ? "true" : undefined}
          {...a11y}
        >
          <CalendarDays size={18} aria-hidden="true" className={styles.icon} />
          <span className={cn(styles.value, !value && control.placeholder)}>
            {value ? format.date(value, "medium") : (placeholder ?? t("datePicker.chooseDate"))}
          </span>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            className={cn(control.panel, styles.panel)}
            aria-label={t("datePicker.chooseDate")}
            sideOffset={6}
            align="start"
            collisionPadding={16}
          >
            <Calendar
              mode="single"
              autoFocus
              selected={selected}
              defaultMonth={selected}
              disabled={[
                ...(min ? [{ before: parseIsoDate(min) }] : []),
                ...(max ? [{ after: parseIsoDate(max) }] : []),
              ]}
              onSelect={(date: Date | undefined) => {
                onChange(date ? toIsoDate(date) : null);
                setOpen(false);
              }}
            />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
      {clearable && value && !disabled && (
        <button type="button" className={styles.clear} aria-label={t("datePicker.clear")} onClick={() => onChange(null)}>
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
