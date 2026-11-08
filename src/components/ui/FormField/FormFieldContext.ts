"use client";

import { createContext, useContext } from "react";

export interface FormFieldContextValue {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
  required: boolean;
}

export const FormFieldContext = createContext<FormFieldContextValue | null>(null);

export interface ControlA11yProps {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-required"?: boolean;
}

/**
 * Wires a control to its surrounding FormField: id (for the label),
 * aria-describedby (hint + error), aria-invalid and aria-required.
 * Explicit props win over context values.
 */
export function useFormFieldControl(props: ControlA11yProps = {}): ControlA11yProps {
  const field = useContext(FormFieldContext);
  if (!field) return props;
  const describedBy = [field.describedBy, props["aria-describedby"]].filter(Boolean).join(" ") || undefined;
  return {
    id: props.id ?? field.id,
    "aria-describedby": describedBy,
    "aria-invalid": props["aria-invalid"] ?? (field.invalid || undefined),
    "aria-required": props["aria-required"] ?? (field.required || undefined),
  };
}
