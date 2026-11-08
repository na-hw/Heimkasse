"use client";

import { Check } from "lucide-react";
import { RadioGroup as RadioPrimitive } from "radix-ui";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { COLOR_KEYS, type ColorKey } from "@/lib/appearance/palette";
import styles from "./ColorPicker.module.css";

export interface ColorPickerProps {
  value: ColorKey;
  onChange: (value: ColorKey) => void;
  label?: string;
}

/** Swatch grid (radio group): arrow keys move, every color has a spoken name. */
export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const { t } = useTranslation();
  const id = useId();
  return (
    <div className={styles.field}>
      <span id={id} className={styles.label}>
        {label ?? t("colors.label")}
      </span>
      <RadioPrimitive.Root
        aria-labelledby={id}
        value={value}
        onValueChange={(v) => onChange(v as ColorKey)}
        className={styles.grid}
        orientation="horizontal"
        loop
      >
        {COLOR_KEYS.map((key) => (
          <RadioPrimitive.Item
            key={key}
            value={key}
            aria-label={t(`colors.${key}`)}
            className={styles.swatch}
            style={{ "--swatch": `var(--swatch-${key})` } as React.CSSProperties}
          >
            <RadioPrimitive.Indicator className={styles.check}>
              <Check size={16} aria-hidden="true" />
            </RadioPrimitive.Indicator>
          </RadioPrimitive.Item>
        ))}
      </RadioPrimitive.Root>
    </div>
  );
}
