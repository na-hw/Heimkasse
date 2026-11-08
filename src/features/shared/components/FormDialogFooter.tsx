"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui";

interface FormDialogFooterProps {
  /** id of the <form> the submit button belongs to. */
  formId: string;
  submitLabel: string;
  loading?: boolean;
  onCancel: () => void;
}

/** Cancel + submit buttons for forms rendered inside Dialog/Sheet bodies. */
export function FormDialogFooter({
  formId,
  submitLabel,
  loading,
  onCancel,
}: FormDialogFooterProps) {
  const { t } = useTranslation();
  return (
    <>
      <Button variant="secondary" onClick={onCancel} disabled={loading}>
        {t("common.cancel")}
      </Button>
      <Button type="submit" form={formId} variant="primary" loading={loading}>
        {submitLabel}
      </Button>
    </>
  );
}
