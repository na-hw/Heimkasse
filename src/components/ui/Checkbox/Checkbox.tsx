"use client";

import { Check, Minus } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { type ComponentPropsWithRef, type ReactNode, useId } from "react";
import { cn } from "@/lib/utils/cn";
import { useFormFieldControl } from "../FormField";
import styles from "./Checkbox.module.css";

export interface CheckboxProps extends Omit<ComponentPropsWithRef<typeof CheckboxPrimitive.Root>, "children"> {
  /** Visible label. Omit only when labelled another way (e.g. aria-label in tables). */
  label?: ReactNode;
  description?: ReactNode;
}

/** Accessible checkbox with optional label and description; supports "indeterminate". */
export function Checkbox({ label, description, className, id, ...props }: CheckboxProps) {
  const autoId = useId();
  const a11y = useFormFieldControl({ id: id ?? (label ? `cb-${autoId}` : undefined) });
  const descriptionId = description ? `${a11y.id ?? autoId}-desc` : undefined;
  const box = (
    <CheckboxPrimitive.Root
      className={cn(styles.box, className)}
      {...a11y}
      aria-describedby={[a11y["aria-describedby"], descriptionId].filter(Boolean).join(" ") || undefined}
      {...props}
    >
      <CheckboxPrimitive.Indicator className={styles.indicator}>
        {props.checked === "indeterminate" ? <Minus size={14} /> : <Check size={14} />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
  if (!label) return <span className={styles.touch}>{box}</span>;
  return (
    <div className={styles.row}>
      <span className={styles.touch}>{box}</span>
      <div className={styles.text}>
        <label htmlFor={a11y.id} className={styles.label}>
          {label}
        </label>
        {description && (
          <p id={descriptionId} className={styles.description}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
