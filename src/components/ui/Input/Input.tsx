"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { useFormFieldControl } from "../FormField";
import control from "../shared/control.module.css";

export interface InputProps extends ComponentPropsWithRef<"input"> {
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  /** Class for the outer wrapper. */
  wrapperClassName?: string;
}

/** Text input. Inside a FormField it is labelled and described automatically. */
export function Input({
  startAdornment,
  endAdornment,
  wrapperClassName,
  className,
  id,
  "aria-describedby": describedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: InputProps) {
  const a11y = useFormFieldControl({
    id,
    "aria-describedby": describedBy,
    "aria-invalid": ariaInvalid === true || ariaInvalid === "true" ? true : undefined,
  });
  return (
    <div
      className={cn(control.control, wrapperClassName)}
      data-invalid={a11y["aria-invalid"] ? "true" : undefined}
      data-disabled={props.disabled ? "" : undefined}
    >
      {startAdornment && <span className={control.adornment}>{startAdornment}</span>}
      <input className={cn(control.bareInput, className)} {...a11y} {...props} />
      {endAdornment && <span className={control.adornment}>{endAdornment}</span>}
    </div>
  );
}
