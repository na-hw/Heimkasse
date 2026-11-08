"use client";

import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, FormField, Input } from "@/components/ui";
import { FormDialogFooter } from "@/features/shared/components/FormDialogFooter";
import styles from "@/features/shared/components/EntityList.module.css";

interface Props {
  open: boolean;
  /** Name of the currently selected user preset (saving overwrites it). */
  initialName: string;
  saving: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}

/** Asks for a name and stores the current mapping as a user preset. */
export function SavePresetDialog({ open, initialName, saving, onClose, onSave }: Props) {
  const { t } = useTranslation();
  const formId = useId();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | undefined>();
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setName(initialName);
      setError(undefined);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={t("import.presets.saveTitle")}
      description={t("import.presets.saveDescription")}
      footer={
        <FormDialogFooter
          formId={formId}
          submitLabel={t("common.save")}
          loading={saving}
          onCancel={onClose}
        />
      }
    >
      <form
        id={formId}
        noValidate
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = name.trim();
          if (!trimmed) {
            setError("validation.required");
            return;
          }
          void onSave(trimmed.slice(0, 60));
        }}
      >
        <FormField label={t("import.presets.name")} required error={error}>
          <Input autoFocus value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
        </FormField>
      </form>
    </Dialog>
  );
}
