"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import { type ComponentPropsWithRef, type ReactNode, useId } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./Switch.module.css";

export interface SwitchProps extends Omit<
  ComponentPropsWithRef<typeof SwitchPrimitive.Root>,
  "children"
> {
  label: ReactNode;
  description?: ReactNode;
}

/** On/off toggle for settings that apply immediately. */
export function Switch({ label, description, className, id, ...props }: SwitchProps) {
  const autoId = useId();
  const switchId = id ?? `sw-${autoId}`;
  const descriptionId = description ? `${switchId}-desc` : undefined;
  return (
    <div className={cn(styles.row, className)}>
      <div className={styles.text}>
        <label htmlFor={switchId} className={styles.label}>
          {label}
        </label>
        {description && (
          <p id={descriptionId} className={styles.description}>
            {description}
          </p>
        )}
      </div>
      <SwitchPrimitive.Root
        id={switchId}
        className={styles.track}
        aria-describedby={descriptionId}
        {...props}
      >
        <SwitchPrimitive.Thumb className={styles.thumb} />
      </SwitchPrimitive.Root>
    </div>
  );
}
