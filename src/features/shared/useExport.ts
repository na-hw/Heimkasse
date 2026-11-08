"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/ui";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import { useFormat } from "@/lib/i18n/useFormat";
import { type ExportDocument, documentToCsv, fileSlug } from "@/lib/export/document";
import { saveFile } from "@/lib/export/saveFile";
import { todayIso } from "@/lib/utils/dates";

export type ExportFormat = "csv" | "pdf";

/** Exports a document as CSV or PDF with progress state and result toasts. */
export function useExport() {
  const { t } = useTranslation();
  const format = useFormat();
  const errorMessage = useErrorMessage();
  const [pending, setPending] = useState<ExportFormat | null>(null);

  const run = async (kind: ExportFormat, doc: ExportDocument, csv?: string) => {
    setPending(kind);
    try {
      const fileName = `${fileSlug(`${doc.title} ${doc.subtitle ?? ""}`)}-${todayIso()}.${kind}`;
      const data =
        kind === "csv"
          ? (csv ?? documentToCsv(doc))
          : await (
              await import("@/lib/export/renderPdf")
            ).renderDocumentToPdf(doc, {
              pageLabel: (page, total) =>
                t("export.page", { page: format.number(page), total: format.number(total) }),
            });
      const saved = await saveFile({
        fileName,
        mimeType: kind === "csv" ? "text/csv;charset=utf-8" : "application/pdf",
        data,
      });
      if (saved) toast.success(t("export.done"), { description: fileName });
    } catch (error) {
      toast.error(t("export.failed"), { description: errorMessage(error) });
    } finally {
      setPending(null);
    }
  };

  return {
    pending,
    /** `csv` overrides the default document serialization (e.g. a flat list). */
    exportCsv: (doc: ExportDocument, csv?: string) => run("csv", doc, csv),
    exportPdf: (doc: ExportDocument) => run("pdf", doc),
  };
}
