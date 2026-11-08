"use client";

import { Upload } from "lucide-react";
import { type ReactNode, useRef } from "react";
import { Button, type ButtonProps } from "../Button";
import { useFormFieldControl } from "../FormField";

export interface FileInputProps {
  /** Button text, e.g. "Choose CSV file". */
  children: ReactNode;
  /** Native accept list (".csv,text/csv"). */
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  variant?: ButtonProps["variant"];
  /** Called with the picked files; the input is reset so the same file can be picked again. */
  onFiles: (files: File[]) => void;
}

/**
 * File picker rendered as a regular button (consistent styling, keyboard
 * and screen-reader friendly). Works in browsers and the Tauri webview.
 */
export function FileInput({
  children,
  accept,
  multiple,
  disabled,
  loading,
  icon = <Upload />,
  variant = "secondary",
  onFiles,
}: FileInputProps) {
  const input = useRef<HTMLInputElement>(null);
  // Buttons don't support aria-invalid/required; only id + description are wired.
  const { id, "aria-describedby": describedBy } = useFormFieldControl();
  return (
    <>
      <Button
        id={id}
        aria-describedby={describedBy}
        variant={variant}
        iconStart={icon}
        disabled={disabled}
        loading={loading}
        onClick={() => input.current?.click()}
      >
        {children}
      </Button>
      <input
        ref={input}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length > 0) onFiles(files);
        }}
      />
    </>
  );
}
