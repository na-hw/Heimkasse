"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";

/** Sets a translated document title ("Page · Kiseh"); updates on language change. */
export function useDocumentTitle(page: string): void {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = t("app.pageTitle", { page });
  }, [page, t]);
}
