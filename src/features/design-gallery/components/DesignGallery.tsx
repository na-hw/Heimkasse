"use client";

import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui";
import { NotFound } from "@/components/layout/NotFound";
import { useDocumentTitle } from "@/lib/utils/useDocumentTitle";
import { ButtonsDemo } from "./ButtonsDemo";
import { DataDemo } from "./DataDemo";
import { FeedbackDemo } from "./FeedbackDemo";
import { FormDemo } from "./FormDemo";
import { OverlaysDemo } from "./OverlaysDemo";
import { StatesDemo } from "./StatesDemo";
import styles from "./DesignGallery.module.css";

/** Living style guide for manual testing of the UI library (development only). */
export function DesignGallery() {
  const { t } = useTranslation();
  useDocumentTitle(t("design.title"));
  if (process.env.NODE_ENV === "production") return <NotFound />;
  return (
    <>
      <PageHeader title={t("design.title")} description={t("design.description")} />
      <div className={styles.gallery}>
        <ButtonsDemo />
        <FormDemo />
        <OverlaysDemo />
        <FeedbackDemo />
        <DataDemo />
        <StatesDemo />
      </div>
    </>
  );
}
