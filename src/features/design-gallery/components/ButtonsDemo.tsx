"use client";

import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge, Button, IconButton } from "@/components/ui";
import { GallerySection } from "./GallerySection";
import styles from "./DesignGallery.module.css";

export function ButtonsDemo() {
  const { t } = useTranslation();
  return (
    <GallerySection title={t("design.sections.buttons")}>
      <div className={styles.row}>
        <Button variant="primary" iconStart={<Plus />}>{t("design.variants.primary")}</Button>
        <Button variant="secondary">{t("design.variants.secondary")}</Button>
        <Button variant="ghost">{t("design.variants.ghost")}</Button>
        <Button variant="danger" iconStart={<Trash2 />}>{t("design.variants.danger")}</Button>
        <Button variant="primary" loading>{t("design.variants.loading")}</Button>
      </div>
      <div className={styles.row}>
        <Button size="sm">{t("common.edit")}</Button>
        <Button size="lg" variant="primary">{t("common.save")}</Button>
        <IconButton label={t("common.edit")} icon={<Pencil />} />
        <IconButton label={t("common.more")} icon={<MoreHorizontal />} variant="secondary" />
      </div>
      <div className={styles.row}>
        <Badge>{t("theme.system")}</Badge>
        <Badge tone="primary">{t("app.name")}</Badge>
        <Badge tone="success">{t("amount.income")}</Badge>
        <Badge tone="danger">{t("amount.expense")}</Badge>
        <Badge tone="warning">{t("design.feedback.budget")}</Badge>
        <Badge tone="info">{t("storage.indexeddb")}</Badge>
      </div>
    </GallerySection>
  );
}
