"use client";

import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { ReactElement, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";
import { IconButton } from "../IconButton";
import dialog from "../Dialog/Dialog.module.css";
import styles from "./Sheet.module.css";

export interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactElement;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** "end" slides in from the reading end (right in LTR, left in RTL). */
  side?: "start" | "end" | "bottom";
  className?: string;
}

/** Side panel / drawer for detail views and longer forms. Modal with focus trap. */
export function Sheet({ open, onOpenChange, trigger, title, description, children, footer, side = "end", className }: SheetProps) {
  const { t } = useTranslation();
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={dialog.overlay} />
        <DialogPrimitive.Content
          className={cn(styles.sheet, styles[side], className)}
          {...(description ? {} : { "aria-describedby": undefined })}
        >
          <header className={dialog.header}>
            <DialogPrimitive.Title className={dialog.title}>{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <IconButton label={t("common.close")} icon={<X />} showTooltip={false} />
            </DialogPrimitive.Close>
          </header>
          {description && <DialogPrimitive.Description className={dialog.description}>{description}</DialogPrimitive.Description>}
          <div className={dialog.body}>{children}</div>
          {footer && <footer className={dialog.footer}>{footer}</footer>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
