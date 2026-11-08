"use client";

import { type ComponentPropsWithRef, useEffect, useRef, useState } from "react";
import { currencySymbol, formatMoney } from "@/lib/i18n/format";
import { parseMoneyToCents } from "@/lib/i18n/parse";
import { useLocaleContext } from "@/lib/i18n/useFormat";
import { Input } from "../Input";
import styles from "./MoneyInput.module.css";

export interface MoneyInputProps
  extends Omit<ComponentPropsWithRef<"input">, "value" | "onChange" | "defaultValue" | "type"> {
  /** Amount in integer cents, or null when empty/invalid. */
  value: number | null;
  onChange: (cents: number | null) => void;
  /** Allow negative amounts (default: false). */
  allowNegative?: boolean;
}

/**
 * Money input that accepts German ("1.234,56") and Persian ("۱٬۲۳۴٫۵۶")
 * digits and separators. Emits integer cents; formats nicely on blur.
 */
export function MoneyInput({ value, onChange, allowNegative = false, onBlur, onFocus, ...props }: MoneyInputProps) {
  const ctx = useLocaleContext();
  const [text, setText] = useState(() =>
    value === null ? "" : formatMoney(value, ctx, { hideCurrency: true }),
  );
  const focused = useRef(false);

  // Sync external value changes (form reset, language switch) while not editing.
  useEffect(() => {
    if (!focused.current) setText(value === null ? "" : formatMoney(value, ctx, { hideCurrency: true }));
  }, [value, ctx]);

  const parse = (input: string): number | null => {
    const cents = parseMoneyToCents(input);
    if (cents === null) return null;
    return !allowNegative && cents < 0 ? null : cents;
  };

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={text}
      className={styles.input}
      endAdornment={<span aria-hidden="true">{currencySymbol(ctx.currency)}</span>}
      onFocus={(e) => {
        focused.current = true;
        onFocus?.(e);
      }}
      onChange={(e) => {
        setText(e.target.value);
        onChange(e.target.value.trim() === "" ? null : parse(e.target.value));
      }}
      onBlur={(e) => {
        focused.current = false;
        const cents = parse(text);
        if (cents !== null) setText(formatMoney(cents, ctx, { hideCurrency: true }));
        onBlur?.(e);
      }}
    />
  );
}
