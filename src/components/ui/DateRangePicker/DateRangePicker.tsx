"use client";

import { CalendarRange, X } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useState } from "react";
import type { DateRange as DayPickerRange } from "react-day-picker";
import { useTranslation } from "react-i18next";
import { useMediaQuery } from "@/lib/utils/useMediaQuery";
import { useFormat } from "@/lib/i18n/useFormat";
import { cn } from "@/lib/utils/cn";
import { parseIsoDate, toIsoDate } from "@/lib/utils/dates";
import { Calendar } from "../DatePicker";
import { useFormFieldControl } from "../FormField";
import control from "../shared/control.module.css";
import picker from "../DatePicker/DatePicker.module.css";

export interface DateRangeValue {
  from: string | null;
  to: string | null;
}

export interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/** Range selection (filters, reports). Shows two months on wide screens. */
export function DateRangePicker({ value, onChange, placeholder, clearable = true, disabled, id, className }: DateRangePickerProps) {
  const { t } = useTranslation();
  const format = useFormat();
  const wide = useMediaQuery("(min-width: 768px)");
  const [open, setOpen] = useState(false);
  const a11y = useFormFieldControl({ id });
  const selected: DayPickerRange | undefined = value.from
    ? { from: parseIsoDate(value.from), to: value.to ? parseIsoDate(value.to) : undefined }
    : undefined;

  const label = value.from
    ? `${format.date(value.from, "medium")} – ${value.to ? format.date(value.to, "medium") : "…"}`
    : (placeholder ?? t("datePicker.chooseRange"));

  return (
    <div className={cn(picker.wrapper, className)}>
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger
          className={cn(control.control, picker.trigger)}
          disabled={disabled}
          aria-haspopup="dialog"
          {...a11y}
        >
          <CalendarRange size={18} aria-hidden="true" className={picker.icon} />
          <span className={cn(picker.value, !value.from && control.placeholder)}>{label}</span>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            className={cn(control.panel, picker.panel)}
            aria-label={t("datePicker.chooseRange")}
            sideOffset={6}
            align="start"
            collisionPadding={16}
          >
            <Calendar
              mode="range"
              autoFocus
              numberOfMonths={wide ? 2 : 1}
              selected={selected}
              defaultMonth={selected?.from}
              onSelect={(range: DayPickerRange | undefined) => {
                const next = {
                  from: range?.from ? toIsoDate(range.from) : null,
                  to: range?.to ? toIsoDate(range.to) : null,
                };
                onChange(next);
                if (next.from && next.to && next.from !== next.to) setOpen(false);
              }}
            />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
      {clearable && value.from && !disabled && (
        <button
          type="button"
          className={picker.clear}
          aria-label={t("datePicker.clear")}
          onClick={() => onChange({ from: null, to: null })}
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
