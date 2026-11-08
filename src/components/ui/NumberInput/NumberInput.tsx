"use client";

import { type ComponentPropsWithRef, type ReactNode, useEffect, useRef, useState } from "react";
import { formatNumber } from "@/lib/i18n/format";
import { normalizeDecimalInput } from "@/lib/i18n/parse";
import { useLocaleContext } from "@/lib/i18n/useFormat";
import { Input } from "../Input";

export interface NumberInputProps
  extends Omit<ComponentPropsWithRef<"input">, "value" | "onChange" | "defaultValue" | "type" | "min" | "max"> {
  value: number | null;
  onChange: (value: number | null) => void;
  /** Maximum number of decimal places (default 2). */
  maxDecimals?: number;
  min?: number;
  max?: number;
  /** Unit shown after the value (e.g. "kWh"). */
  unit?: ReactNode;
}

/** Locale-aware decimal input (meter readings, quantities). Accepts Persian digits. */
export function NumberInput({
  value,
  onChange,
  maxDecimals = 2,
  min,
  max,
  unit,
  onBlur,
  onFocus,
  ...props
}: NumberInputProps) {
  const ctx = useLocaleContext();
  const [text, setText] = useState(() =>
    value === null ? "" : formatNumber(value, ctx, { maximumFractionDigits: maxDecimals }),
  );
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) {
      setText(value === null ? "" : formatNumber(value, ctx, { maximumFractionDigits: maxDecimals }));
    }
  }, [value, ctx, maxDecimals]);

  const parse = (input: string): number | null => {
    const normalized = normalizeDecimalInput(input);
    if (normalized === null) return null;
    const decimals = normalized.split(".")[1]?.length ?? 0;
    if (decimals > maxDecimals) return null;
    const n = Number(normalized);
    if ((min !== undefined && n < min) || (max !== undefined && n > max)) return null;
    return n;
  };

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={text}
      endAdornment={unit}
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
        const n = parse(text);
        if (n !== null) setText(formatNumber(n, ctx, { maximumFractionDigits: maxDecimals }));
        onBlur?.(e);
      }}
    />
  );
}
