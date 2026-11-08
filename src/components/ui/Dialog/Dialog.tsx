"use client";

import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { ReactElement, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";
import { IconButton } from "../IconButton";
import styles from "./Dialog.module.css";

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Optional element that opens the dialog (uncontrolled usage). */
  trigger?: ReactElement;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Action buttons, rendered at the end (bottom on mobile). */
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** Visually hide the title (it is still announced). */
  hideTitle?: boolean;
  className?: string;
}

/**
 * Modal dialog: focus is trapped inside and returns to the trigger on close.
 * On small screens it docks to the bottom like a sheet.
 */
export function Dialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  size = "md",
  hideTitle,
  className,
}: DialogProps) {
  const { t } = useTranslation();
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={styles.overlay} />
        <DialogPrimitive.Content
          className={cn(styles.content, styles[size], className)}
          {...(description ? {} : { "aria-describedby": undefined })}
        >
          <header className={styles.header}>
            <DialogPrimitive.Title className={cn(styles.title, hideTitle && "visually-hidden")}>{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <IconButton label={t("common.close")} icon={<X />} showTooltip={false} className={styles.close} />
            </DialogPrimitive.Close>
          </header>
          {description && <DialogPrimitive.Description className={styles.description}>{description}</DialogPrimitive.Description>}
          {children && <div className={styles.body}>{children}</div>}
          {footer && <footer className={styles.footer}>{footer}</footer>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Closes the surrounding Dialog/Sheet when the child is activated. */
export const DialogClose = DialogPrimitive.Close;
