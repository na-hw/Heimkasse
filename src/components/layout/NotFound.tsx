"use client";

import { SearchX } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button, EmptyState } from "@/components/ui";
import { useDocumentTitle } from "@/lib/utils/useDocumentTitle";

/** 404 content with a way back. */
export function NotFound() {
  const { t } = useTranslation();
  useDocumentTitle(t("errors.notFoundTitle"));
  return (
    <EmptyState
      headingLevel={2}
      icon={<SearchX />}
      title={
        <span role="heading" aria-level={1}>
          {t("errors.notFoundTitle")}
        </span>
      }
      description={t("errors.notFoundDescription")}
      action={
        <Button asChild variant="primary">
          <Link href="/">{t("errors.goHome")}</Link>
        </Button>
      }
    />
  );
}
