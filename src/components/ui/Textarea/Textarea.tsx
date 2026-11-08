"use client";

import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils/cn";
import { useFormFieldControl } from "../FormField";
import control from "../shared/control.module.css";
import styles from "./Textarea.module.css";

export type TextareaProps = ComponentPropsWithRef<"textarea">;

/** Multi-line text input that grows with its content. */
export function Textarea({ className, id, "aria-describedby": describedBy, rows = 3, ...props }: TextareaProps) {
  const a11y = useFormFieldControl({ id, "aria-describedby": describedBy });
  return (
    <textarea
      rows={rows}
      className={cn(control.control, styles.textarea, className)}
      {...a11y}
      {...props}
    />
  );
}
