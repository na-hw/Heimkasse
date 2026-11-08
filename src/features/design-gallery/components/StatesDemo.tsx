"use client";

import { Inbox, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, EmptyState, ErrorState, SkeletonText } from "@/components/ui";
import { GallerySection } from "./GallerySection";
import styles from "./DesignGallery.module.css";

export function StatesDemo() {
  const { t } = useTranslation();
  return (
    <GallerySection title={t("design.sections.states")}>
      <div className={styles.states}>
        <div aria-busy="true" aria-label={t("a11y.loading")} className={styles.stateBox}>
          <SkeletonText lines={4} />
        </div>
        <div className={styles.stateBox}>
          <EmptyState
            headingLevel={3}
            icon={<Inbox />}
            title={t("design.states.emptyTitle")}
            description={t("design.states.emptyText")}
            action={<Button variant="primary" iconStart={<Plus />}>{t("design.states.emptyAction")}</Button>}
          />
        </div>
        <div className={styles.stateBox}>
          <ErrorState description={t("design.states.errorText")} onRetry={() => undefined} />
        </div>
      </div>
    </GallerySection>
  );
}
