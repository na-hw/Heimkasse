"use client";

import { AlertDialog } from "radix-ui";
import { type ReactNode, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";
import { validationMessage } from "@/lib/validation/messages";
import { Button } from "../Button";
import { FormField } from "../FormField";
import { Input } from "../Input";
import dialog from "../Dialog/Dialog.module.css";
import styles from "./ConfirmDialog.module.css";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  /** May return a promise; the dialog shows a loading state and closes on success. */
  onConfirm: () => void | Promise<void>;
  /**
   * When set, the user must type this word before confirming
   * (used for irreversible actions like "delete all data").
   */
  confirmationWord?: string;
}

/**
 * Confirmation for destructive or irreversible actions (role="alertdialog").
 * Initial focus is on Cancel so Enter never destroys data by accident.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = "danger",
  onConfirm,
  confirmationWord,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const inputId = useId();
  const matches = !confirmationWord || typed.trim() === confirmationWord;

  const handleOpenChange = (next: boolean) => {
    if (busy) return;
    if (!next) setTyped("");
    onOpenChange(next);
  };

  const confirm = async () => {
    if (!matches) return;
    setBusy(true);
    try {
      await onConfirm();
      setTyped("");
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={handleOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={dialog.overlay} />
        <AlertDialog.Content className={cn(dialog.content, dialog.sm)}>
          <div className={styles.header}>
            <AlertDialog.Title className={dialog.title}>{title}</AlertDialog.Title>
          </div>
          <AlertDialog.Description className={dialog.description}>{description}</AlertDialog.Description>
          {confirmationWord && (
            <div className={dialog.body}>
              <FormField
                id={inputId}
                label={t("validation.confirmationMismatch", { word: confirmationWord })}
                error={typed && !matches ? validationMessage("validation.confirmationMismatch", { word: confirmationWord }) : undefined}
              >
                <Input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void confirm();
                  }}
                />
              </FormField>
            </div>
          )}
          <div className={cn(dialog.footer, styles.footer)}>
            <AlertDialog.Cancel asChild>
              <Button variant="secondary" disabled={busy}>
                {cancelLabel ?? t("common.cancel")}
              </Button>
            </AlertDialog.Cancel>
            <Button
              variant={tone === "danger" ? "danger" : "primary"}
              loading={busy}
              disabled={!matches}
              onClick={() => void confirm()}
            >
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
