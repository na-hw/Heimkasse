"use client";

import { RadioGroup as RadioPrimitive } from "radix-ui";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { ICON_KEYS, type IconKey } from "@/lib/appearance/icons";
import type { ColorKey } from "@/lib/appearance/palette";
import { ICON_REGISTRY } from "../CategoryIcon";
import styles from "./IconPicker.module.css";

export interface IconPickerProps {
  value: IconKey;
  onChange: (value: IconKey) => void;
  /** Tints the selected icon with the chosen color. */
  color?: ColorKey;
  label?: string;
}

/** Icon grid (radio group) with spoken names; arrow keys move the selection. */
export function IconPicker({ value, onChange, color = "teal", label }: IconPickerProps) {
  const { t } = useTranslation();
  const id = useId();
  return (
    <div className={styles.field}>
      <span id={id} className={styles.label}>
        {label ?? t("icons.label")}
      </span>
      <RadioPrimitive.Root
        aria-labelledby={id}
        value={value}
        onValueChange={(v) => onChange(v as IconKey)}
        className={styles.grid}
        loop
        style={{ "--tile-color": `var(--swatch-${color})` } as React.CSSProperties}
      >
        {ICON_KEYS.map((key) => {
          const Icon = ICON_REGISTRY[key];
          return (
            <RadioPrimitive.Item key={key} value={key} aria-label={t(`icons.${key}`)} className={styles.item}>
              <Icon aria-hidden="true" />
            </RadioPrimitive.Item>
          );
        })}
      </RadioPrimitive.Root>
    </div>
  );
}
