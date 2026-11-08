"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, DropdownMenu } from "@/components/ui";
import type { ExportFormat } from "../useExport";

interface ExportMenuProps {
  onExport: (format: ExportFormat) => void;
  pending: ExportFormat | null;
  disabled?: boolean;
  /** Formats offered (default both). */
  formats?: readonly ExportFormat[];
}

/** "Export" button with CSV/PDF choices. */
export function ExportMenu({
  onExport,
  pending,
  disabled,
  formats = ["csv", "pdf"],
}: ExportMenuProps) {
  const { t } = useTranslation();
  return (
    <DropdownMenu
      trigger={
        <Button iconStart={<Download />} loading={pending !== null} disabled={disabled}>
          {t("export.button")}
        </Button>
      }
      items={formats.map((f) => ({
        id: f,
        label: t(`export.${f}`),
        icon: f === "csv" ? <FileSpreadsheet /> : <FileText />,
        onSelect: () => onExport(f),
      }))}
    />
  );
}
